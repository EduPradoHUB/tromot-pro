// whatsapp-webhook
//
// Recebe as mensagens do WhatsApp de Suporte Técnico da TROMOT (via
// uazapi), conversa com o cliente usando Claude com acesso a ferramentas
// (produtos, manuais, base de conhecimento própria, distribuidores,
// link de compra) e responde automaticamente pelo WhatsApp.
//
// Configuração necessária:
//  1. Secrets do projeto Supabase: ANTHROPIC_API_KEY, VOYAGE_API_KEY,
//     UAZAPI_BASE_URL, UAZAPI_TOKEN, WHATSAPP_WEBHOOK_SECRET
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
import { embedText } from '../_shared/embeddings.ts'
import { callClaude, ClaudeMessage, ClaudeTool } from '../_shared/claude.ts'
import { sendText, sendMedia, parseInboundWebhook } from '../_shared/uazapi.ts'

const MAX_TOOL_ITERATIONS = 5
const HISTORY_LIMIT = 20
const STORE_HOME_URL = 'https://tromotstore.com.br/'

const SYSTEM_PROMPT = `Você é a IA de Suporte Técnico da TROMOT, atendendo instaladores e clientes pelo WhatsApp.

ESCOPO — responda SOMENTE sobre:
- instalação, uso e solução de problemas de produtos eletrônicos automotivos da TROMOT;
- ajudar a identificar o produto certo para o veículo/situação do cliente;
- enviar manuais, fotos técnicas e o link de compra quando pedido;
- indicar o representante/distribuidor mais próximo do cliente.

Se o cliente perguntar qualquer coisa fora desse escopo (assuntos pessoais, outras marcas, opinião, etc.), recuse educadamente e traga a conversa de volta para o suporte técnico TROMOT.

COMO AJUDAR EM INSTALAÇÕES QUE NÃO ESTÃO NOS MANUAIS:
1. Primeiro use buscar_produto e buscar_manual/buscar_base_conhecimento para ver se já existe orientação.
2. Se não encontrar nada, oriente o cliente a medir e descrever o que está vendo (ex: "quantos fios saem do conector, quais cores, qual a tensão medida com o multímetro"), como um técnico experiente faria por telefone.
3. NUNCA invente uma instrução de instalação elétrica que você não tem base para afirmar — isso pode causar curto-circuito, incêndio ou danificar o veículo. Se não tiver certeza mesmo depois de perguntar, use escalar_para_humano para um técnico da TROMOT continuar o atendimento, e diga isso claramente ao cliente.
4. Sempre que resolver um caso novo que não estava documentado, ele NÃO fica automaticamente salvo — a equipe TROMOT revisa e adiciona à base de conhecimento manualmente depois. Você pode avisar o cliente que vai "registrar esse caso para a equipe".

FERRAMENTAS:
- Use buscar_produto para achar o produto pelo nome/código.
- Use buscar_manual para obter manual em PDF/imagem de um produto e enviá-lo (a ferramenta já envia o arquivo pelo WhatsApp, você só confirma em texto).
- Use buscar_base_conhecimento para casos parecidos já resolvidos antes (inclusive instalações fora do manual oficial).
- Use buscar_distribuidor quando o cliente quiser comprar ou falar com um representante: pergunte a cidade/estado dele antes de chamar essa ferramenta, se ainda não souber.
- Use link_de_compra quando o cliente quiser comprar o produto direto pela loja online.
- Use escalar_para_humano quando não conseguir resolver, quando o cliente pedir para falar com uma pessoa, ou em qualquer situação de risco (elétrica, incêndio, garantia).

TOM: direto, técnico mas simples, cordial, em português do Brasil. Frases curtas, como uma conversa de WhatsApp — evite parágrafos longos.`

const TOOLS: ClaudeTool[] = [
  {
    name: 'buscar_produto',
    description: 'Busca produtos TROMOT pelo nome, código ou categoria.',
    input_schema: {
      type: 'object',
      properties: { termo: { type: 'string', description: 'nome, código ou palavra-chave do produto' } },
      required: ['termo'],
    },
  },
  {
    name: 'buscar_manual',
    description: 'Busca e ENVIA pelo WhatsApp o manual (PDF ou imagem) de um produto, dado o id do produto retornado por buscar_produto.',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' } },
      required: ['product_id'],
    },
  },
  {
    name: 'buscar_base_conhecimento',
    description: 'Busca semântica na base de conhecimento interna da TROMOT (casos e instalações já resolvidos, inclusive fora dos manuais oficiais).',
    input_schema: {
      type: 'object',
      properties: { pergunta: { type: 'string', description: 'a situação/dúvida do cliente, em texto livre' } },
      required: ['pergunta'],
    },
  },
  {
    name: 'buscar_distribuidor',
    description: 'Busca o distribuidor/representante TROMOT mais próximo por estado e cidade, e registra a localização na conversa.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'sigla UF, ex: SP' },
        cidade: { type: 'string' },
      },
      required: ['estado'],
    },
  },
  {
    name: 'link_de_compra',
    description: 'Retorna o link de compra do produto na loja oficial (tromotstore.com.br), dado o id do produto.',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' } },
      required: ['product_id'],
    },
  },
  {
    name: 'escalar_para_humano',
    description: 'Marca a conversa para atendimento humano de um técnico TROMOT, quando a IA não consegue resolver ou o cliente pede.',
    input_schema: {
      type: 'object',
      properties: { motivo: { type: 'string' } },
      required: ['motivo'],
    },
  },
]

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
    const messages: ClaudeMessage[] = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content ?? '',
    }))

    const replyText = await runConversationTurn(supabase, conversation, messages)

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

async function runConversationTurn(supabase: any, conversation: any, initialMessages: ClaudeMessage[]) {
  const messages = [...initialMessages]

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await callClaude({ system: SYSTEM_PROMPT, messages, tools: TOOLS })

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content?.find((b: any) => b.type === 'text')
      return textBlock?.text?.trim() || 'Desculpe, não consegui gerar uma resposta agora. Um técnico vai te responder em breve.'
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      const result = await executeTool(supabase, conversation, block.name, block.input)
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  return 'Seu caso ficou mais complexo do que eu consigo resolver sozinha — já registrei aqui e um técnico da TROMOT vai te chamar em breve.'
}

async function executeTool(supabase: any, conversation: any, name: string, input: any) {
  switch (name) {
    case 'buscar_produto': {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, category, description, manual_url, manual_type, store_url, no_manual_available')
        .or(`name.ilike.%${input.termo}%,code.ilike.%${input.termo}%,category.ilike.%${input.termo}%`)
        .eq('status', 'active')
        .limit(5)
      if (error) return { erro: error.message }
      return data
    }

    case 'buscar_manual': {
      const { data: product, error } = await supabase
        .from('products')
        .select('name, manual_url, manual_type, no_manual_available')
        .eq('id', input.product_id)
        .single()
      if (error || !product) return { erro: 'Produto não encontrado.' }
      if (product.no_manual_available || !product.manual_url) {
        return { enviado: false, motivo: 'Este produto ainda não tem manual cadastrado no sistema.' }
      }
      const ok = await sendMedia(
        conversation.phone,
        product.manual_url,
        product.manual_type === 'pdf' ? 'document' : 'image',
        `Manual — ${product.name}`
      )
      return { enviado: ok }
    }

    case 'buscar_base_conhecimento': {
      const queryEmbedding = await embedText(input.pergunta, 'query')
      const { data, error } = await supabase.rpc('match_knowledge_base', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 3,
      })
      if (error) return { erro: error.message }
      return data
    }

    case 'buscar_distribuidor': {
      await supabase
        .from('whatsapp_conversations')
        .update({ state: input.estado, city: input.cidade ?? null })
        .eq('id', conversation.id)

      const query = supabase
        .from('distributors')
        .select('id, name, phone, whatsapp, city, state, cover_entire_state')
        .eq('active', true)
        .eq('state', input.estado)

      const { data, error } = await query
      if (error) return { erro: error.message }

      const list = data ?? []
      const exactCity = input.cidade
        ? list.find((d: any) => d.city?.toLowerCase() === input.cidade.toLowerCase())
        : null
      const statewide = list.find((d: any) => d.cover_entire_state)
      const chosen = exactCity ?? statewide ?? list[0] ?? null

      if (chosen) {
        await supabase
          .from('whatsapp_conversations')
          .update({ distributor_id: chosen.id })
          .eq('id', conversation.id)
      }

      return chosen
        ? { nome: chosen.name, telefone: chosen.whatsapp ?? chosen.phone, cidade: chosen.city, estado: chosen.state }
        : { encontrado: false }
    }

    case 'link_de_compra': {
      const { data: product } = await supabase
        .from('products')
        .select('name, store_url')
        .eq('id', input.product_id)
        .single()
      return { link: product?.store_url || STORE_HOME_URL }
    }

    case 'escalar_para_humano': {
      await supabase
        .from('whatsapp_conversations')
        .update({ status: 'escalated', needs_human: true, escalation_reason: input.motivo })
        .eq('id', conversation.id)
      return { registrado: true }
    }

    default:
      return { erro: `Ferramenta desconhecida: ${name}` }
  }
}
