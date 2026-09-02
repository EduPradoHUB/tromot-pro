// Gera embeddings de texto usando a Voyage AI (recomendada pela Anthropic
// para uso com Claude — o Claude em si não gera embeddings).
//
// Modelo: voyage-3 (1024 dimensões, bom suporte a português).
// Se você trocar de modelo, ajuste EMBEDDING_MODEL abaixo E a dimensão
// da coluna `embedding` nas migrations (knowledge_base.embedding).
//
// Secret necessário no projeto Supabase: VOYAGE_API_KEY
// (Configurações do projeto -> Edge Functions -> Secrets, ou
// `supabase secrets set VOYAGE_API_KEY=...`)

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const EMBEDDING_MODEL = 'voyage-3'

export async function embedText(text: string, inputType: 'document' | 'query' = 'document'): Promise<number[]> {
  const apiKey = Deno.env.get('VOYAGE_API_KEY')
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY não configurada nos secrets do projeto Supabase.')
  }

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [text],
      model: EMBEDDING_MODEL,
      input_type: inputType, // 'document' ao indexar a base de conhecimento, 'query' ao buscar
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Falha ao gerar embedding (Voyage AI): ${res.status} ${errText}`)
  }

  const json = await res.json()
  const embedding = json?.data?.[0]?.embedding
  if (!Array.isArray(embedding)) {
    throw new Error('Resposta inesperada da Voyage AI ao gerar embedding.')
  }
  return embedding
}
