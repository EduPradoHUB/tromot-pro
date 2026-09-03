// whatsapp-webhook
//
// Recebe as mensagens do WhatsApp de Suporte Técnico da TROMOT (via
// uazapi), conversa com o cliente usando Claude com acesso a ferramentas
// (produtos, manuais, base de conhecimento própria, distribuidores,
// link de compra) e responde automaticamente pelo WhatsApp.
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
import { embedText } from '../_shared/embeddings.ts'
import { callClaude, ClaudeMessage, ClaudeTool } from '../_shared/claude.ts'
import { sendText, sendMedia, parseInboundWebhook } from '../_shared/uazapi.ts'

const MAX_TOOL_ITERATIONS = 5
const HISTORY_LIMIT = 20
const STORE_HOME_URL = 'https://tromotstore.com.br/'

const SYSTEM_PROMPT = `Você é a IA de Suporte Técnico da TROMOT, atendendo pelo WhatsApp.

REGRA DE OURO — SEJA OBJETIVA: responda só o que foi perguntado, do jeito mais curto possível. NUNCA use emojis. NUNCA escreva parágrafos longos para uma pergunta simples.
- Uma saudação ("olá", "oi", "bom dia", "boa tarde") recebe só uma saudação curta de volta — por exemplo "Olá! Em que posso ajudar?" — e nada mais. Espere a pergunta real do cliente antes de explicar qualquer coisa.
- Depois de responder, não fique repetindo contexto nem adicionando informação que ninguém pediu.

ESCOPO — responda SOMENTE sobre produtos, instalação, compra e representantes da TROMOT. Qualquer outro assunto (pessoal, outras marcas, opinião, etc.): recuse em uma frase e volte para o suporte técnico TROMOT.

O QUE FAZER EM CADA SITUAÇÃO (direto ao ponto, sem enrolação):
- Cliente pediu o manual de um produto → use buscar_produto (se ainda não sabe qual produto) e depois buscar_manual. A ferramenta já envia o arquivo pelo WhatsApp; você só confirma em texto curto, tipo "Manual enviado aqui em cima."
- Cliente pediu foto do produto → use link_de_compra e mande o link (a página do produto tem as fotos).
- Cliente (pessoa física ou loja) quer comprar → use link_de_compra e mande o link da tromotstore.com.br.
- Cliente é distribuidor/representante querendo comprar → pergunte a cidade e o estado dele, se ainda não souber, e use buscar_distribuidor para mandar o contato do representante mais próximo.
- Instalação que não está em nenhum manual → use buscar_base_conhecimento primeiro. Se não achar nada, peça para o cliente medir e descrever o que está vendo (quantos fios, quais cores, qual a tensão no multímetro), como um técnico faria por telefone. NUNCA invente uma instrução elétrica sem base — risco de curto-circuito, incêndio ou dano ao veículo. Sem certeza mesmo depois de perguntar, use escalar_para_humano.
- Um caso novo resolvido na hora NÃO fica salvo automaticamente na base de conhecimento — a equipe TROMOT revisa e adiciona depois. Pode avisar o cliente que o caso foi registrado para a equipe.

ENCERRANDO O ATENDIMENTO:
1. Depois de resolver a dúvida do cliente, pergunte em poucas palavras: "Posso ajudar em algo mais?"
2. Se o cliente disser que não precisa de mais nada, pergunte: "De 1 a 5, como você avalia esse atendimento?"
3. Quando o cliente responder com uma nota, use registrar_avaliacao com esse número. Depois só agradeça em uma frase curta.

FERRAMENTAS:
- buscar_produto: achar o produto pelo nome/código.
- buscar_manual: obter e enviar o manual (PDF/imagem) de um produto.
- buscar_base_conhecimento: buscar casos parecidos já resolvidos, inclusive fora do manual oficial.
- buscar_distribuidor: achar o representante mais próximo por estado/cidade.
- link_de_compra: link de compra ou fotos do produto na loja oficial.
- escalar_para_humano: quando não conseguir resolver, o cliente pedir uma pessoa, ou houver risco (elétrico, incêndio, garantia). Isso já avisa a equipe TROMOT automaticamente.
- registrar_avaliacao: salvar a nota de 1 a 5 dada pelo cliente ao final do atendimento.

TOM: português do Brasil, direto, técnico mas simples, cordial. Frases curtas, como uma conversa real de WhatsApp. Sem emojis. Sem textos longos para perguntas curtas.`

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
    description: 'Marca a conversa para atendimento humano de um técnico TROMOT, quando a IA não consegue resolver ou o cliente pede. Também avisa a equipe automaticamente.',
    input_schema: {
      type: 'object',
      properties: { motivo: { type: 'string' } },
      required: ['motivo'],
    },
  },
  {
    name: 'registrar_avaliacao',
    description: 'Registra a nota de 1 a 5 que o cliente deu para o atendimento, ao final da conversa.',
    input_schema: {
      type: 'object',
      properties: {
        nota: { type: 'integer', description: 'nota de 1 (péssimo) a 5 (ótimo)' },
        comentario: { type: 'string', description: 'comentário opcional do cliente sobre o atendimento' },
      },
      required: ['nota'],
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

      // Avisa você (ou quem estiver configurado) no WhatsApp, para não
      // depender de ficar olhando o painel/o número de suporte o dia todo.
      const adminPhone = Deno.env.get('SUPPORT_ADMIN_WHATSAPP')
      if (adminPhone) {
        try {
          await sendText(
            adminPhone,
            `${conversation.phone} está precisando da sua ajuda!\nMotivo: ${input.motivo}`
          )
        } catch (err) {
          console.error('Falha ao notificar admin sobre escalonamento:', err)
        }
      }

      return { registrado: true }
    }

    case 'registrar_avaliacao': {
      const nota = Number(input.nota)
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return { erro: 'Nota inválida — precisa ser um número inteiro de 1 a 5.' }
      }

      await supabase.from('service_ratings').insert({
        conversation_id: conversation.id,
        phone: conversation.phone,
        rating: nota,
        comment: input.comentario ?? null,
      })

      await supabase
        .from('whatsapp_conversations')
        .update({ status: 'resolved', needs_human: false })
        .eq('id', conversation.id)

      return { registrado: true }
    }

    default:
      return { erro: `Ferramenta desconhecida: ${name}` }
  }
}
