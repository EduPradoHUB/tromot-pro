// whatsapp-webhook
//
// Recebe as mensagens do WhatsApp de Suporte Técnico da TROMOT (via
// uazapi) e conversa com o cliente usando o mesmo "cérebro" de
// _shared/supportAgent.ts que também atende o chat dentro do app
// (app-chat) — só a entrega muda: aqui o manual e a resposta final vão
// de verdade pelo WhatsApp via uazapi.
//
// Configuração necessária:
//  1. Secrets do projeto Supabase: ANTHROPIC_API_KEY, VOYAGE_API_KEY,
//     UAZAPI_BASE_URL, UAZAPI_TOKEN, WHATSAPP_WEBHOOK_SECRET,
//     SUPPORT_ADMIN_WHATSAPP (opcional — seu número, para receber um
//     aviso curto sempre que a IA escalar um atendimento para humano)
//  2. No painel da uazapi, configurar o webhook de mensagens recebidas
//     apontando para:
//     https://<seu-projeto>.supabase.co/functions/v1/whatsapp-webhook?secret=<WHATSAPP_WEBHOOK_SECRET>
//  3. supabase/config.toml já marca esta função com verify_jwt = false
//     (ela não é chamada por um usuário logado no app, e sim pela uazapi).
//
// Veja ARCHITECTURE_WHATSAPP_IA.md para o desenho completo.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ClaudeMessage } from '../_shared/claude.ts'
import { sendText, sendMedia, parseInboundWebhook } from '../_shared/uazapi.ts'
import { runConversationTurn, SupportChannel } from '../_shared/supportAgent.ts'

const HISTORY_LIMIT = 20

// O canal precisa saber o telefone da conversa atual pra enviar mídia e
// pra identificar o cliente no aviso ao admin — por isso é montado a
// cada requisição, com o telefone "fechado" no closure.
function makeWhatsappChannel(phone: string): SupportChannel {
  return {
    conversationsTable: 'whatsapp_conversations',

    async deliverManual(manualUrl, manualType, productName) {
      const ok = await sendMedia(phone, manualUrl, manualType === 'pdf' ? 'document' : 'image', `Manual — ${productName}`)
      return { enviado: ok }
    },

    async notifyAdmin(motivo) {
      const adminPhone = Deno.env.get('SUPPORT_ADMIN_WHATSAPP')
      if (!adminPhone) return
      try {
        await sendText(adminPhone, `${phone} está precisando da sua ajuda!\nMotivo: ${motivo}`)
      } catch (err) {
        console.error('Falha ao notificar admin sobre escalonamento:', err)
      }
    },

    requiresContactForEscalation: false,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const expectedSecret = Deno.env.get('WHATSAPP_WEBHOOK_SECRET')
    const providedSecret = req.headers.get('x-webhook-secret') ?? url.searchParams.get('secret')
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response('Não autorizado', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const inbound = parseInboundWebhook(body)

    // Ignora eventos que não são mensagem de texto de cliente (ex: status,
    // confirmação de entrega, mensagens de grupo). Ajuste aqui se quiser
    // tratar áudio/imagem recebidos do cliente no futuro.
    if (!inbound || inbound.messageType !== 'text' || !inbound.text) {
      return new Response(JSON.stringify({ ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const conversation = await getOrCreateConversation(supabase, inbound.phone, inbound.senderName)

    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: inbound.text,
    })

    const { data: historyRows } = await supabase
      .from('whatsapp_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)

    const history = (historyRows ?? []).reverse()
    const messages: ClaudeMessage[] = history.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content ?? '',
    }))

    const replyText = await runConversationTurn(supabase, conversation, messages, makeWhatsappChannel(inbound.phone))

    await sendText(inbound.phone, replyText)
    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: replyText,
    })
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em whatsapp-webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function getOrCreateConversation(supabase: any, phone: string, senderName?: string) {
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('whatsapp_conversations')
    .insert({ phone, customer_name: senderName ?? null })
    .select()
    .single()

  if (error) throw error
  return created
}
