// app-chat
//
// Backend do botão de chat dentro do próprio app — o cliente conversa
// com a mesma IA de Suporte do WhatsApp (mesmo prompt, mesmas
// ferramentas, mesma base de conhecimento), sem precisar sair do app.
// Funciona logado ou anônimo: o front-end manda um sessionId (gerado e
// guardado no navegador do cliente) que identifica a conversa.
//
// Requisição: POST { sessionId: string, message?: string, loadHistory?: boolean }
// Se vier Authorization (usuário logado), a conversa é associada ao
// user_id e usa o whatsapp/email do perfil como contato — a IA não
// precisa perguntar contato antes de escalar nesse caso.
//
// Configuração: usa os mesmos secrets do whatsapp-webhook
// (ANTHROPIC_API_KEY, VOYAGE_API_KEY) mais SUPPORT_ADMIN_WHATSAPP e
// UAZAPI_BASE_URL/UAZAPI_TOKEN (pra avisar você quando escalar).
// verify_jwt = false em config.toml porque atende também visitante
// anônimo — quem estiver logado manda o Authorization mesmo assim, e
// a função valida o token manualmente.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ClaudeMessage } from '../_shared/claude.ts'
import { sendText } from '../_shared/uazapi.ts'
import { runConversationTurn, SupportChannel } from '../_shared/supportAgent.ts'

const HISTORY_LIMIT = 20

function makeAppChannel(): SupportChannel {
  return {
    conversationsTable: 'app_chat_conversations',

    deliverManual(manualUrl) {
      // Sem WhatsApp aqui — a própria IA inclui o link na mensagem de
      // texto, e devolvemos a URL pro front-end poder mostrar um botão.
      return Promise.resolve({ enviado: true, manual_url: manualUrl })
    },

    async notifyAdmin(motivo, contato) {
      const adminPhone = Deno.env.get('SUPPORT_ADMIN_WHATSAPP')
      if (!adminPhone) return
      try {
        const quem = contato ? `Cliente do chat do app (contato: ${contato})` : 'Um cliente do chat do app'
        await sendText(adminPhone, `${quem} está precisando da sua ajuda!\nMotivo: ${motivo}`)
      } catch (err) {
        console.error('Falha ao notificar admin sobre escalonamento (app-chat):', err)
      }
    },

    requiresContactForEscalation: true,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, message, loadHistory } = await req.json()
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Se o cliente estiver logado, usa o perfil dele (nome/whatsapp/
    // email) pra já saber o contato e não precisar perguntar.
    let userId: string | null = null
    let contactInfo: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: userData } = await anonClient.auth.getUser()
      if (userData?.user) {
        userId = userData.user.id
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp, email')
          .eq('user_id', userId)
          .single()
        contactInfo = profile?.whatsapp || profile?.email || null
      }
    }

    const conversation = await getOrCreateConversation(supabase, sessionId, userId, contactInfo)

    if (loadHistory && !message) {
      const { data: historyRows } = await supabase
        .from('app_chat_messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(100)

      return new Response(JSON.stringify({ messages: historyRows ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'message é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('app_chat_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    })

    const { data: historyRows } = await supabase
      .from('app_chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)

    const history = (historyRows ?? []).reverse()
    const messages: ClaudeMessage[] = history.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content ?? '',
    }))

    const replyText = await runConversationTurn(supabase, conversation, messages, makeAppChannel())

    await supabase.from('app_chat_messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: replyText,
    })
    await supabase
      .from('app_chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em app-chat:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function getOrCreateConversation(supabase: any, sessionId: string, userId: string | null, contactInfo: string | null) {
  const { data: existing } = await supabase
    .from('app_chat_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    // Se a sessão era anônima e o cliente acabou de logar (ou o
    // contato mudou), atualiza pra IA já saber quem é sem perguntar.
    if ((userId && existing.user_id !== userId) || (contactInfo && !existing.contact_info)) {
      const update: Record<string, unknown> = {}
      if (userId && existing.user_id !== userId) update.user_id = userId
      if (contactInfo && !existing.contact_info) update.contact_info = contactInfo
      const { data: updated } = await supabase
        .from('app_chat_conversations')
        .update(update)
        .eq('id', existing.id)
        .select()
        .single()
      return updated ?? existing
    }
    return existing
  }

  const { data: created, error } = await supabase
    .from('app_chat_conversations')
    .insert({ session_id: sessionId, user_id: userId, contact_info: contactInfo })
    .select()
    .single()

  if (error) throw error
  return created
}
