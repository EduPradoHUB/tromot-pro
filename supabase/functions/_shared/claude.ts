// Wrapper fino sobre a Messages API da Anthropic (chamada via fetch puro,
// sem SDK, para manter a função leve no Deno Edge Runtime).
//
// Secret necessário: ANTHROPIC_API_KEY
//
// Verifique em https://docs.claude.com/en/docs/about-claude/models qual é
// o modelo mais atual/recomendado no momento em que for ativar isso —
// o valor abaixo é só um ponto de partida razoável.
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'

export interface ClaudeTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: any
}

export async function callClaude(opts: {
  system: string
  messages: ClaudeMessage[]
  tools: ClaudeTool[]
  model?: string
  maxTokens?: number
}) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada nos secrets do projeto Supabase.')
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
      tools: opts.tools,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Falha ao chamar a API da Anthropic: ${res.status} ${errText}`)
  }

  return res.json()
}
