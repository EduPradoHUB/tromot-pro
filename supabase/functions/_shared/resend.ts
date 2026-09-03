// Cliente mínimo para a API do Resend (https://resend.com), usado para
// mandar os emails de novidade de produto. Sem dependência externa —
// só fetch puro, no mesmo estilo de claude.ts e embeddings.ts.
//
// Requer o secret RESEND_API_KEY no projeto Supabase.
// Requer também um domínio verificado no Resend (Domains → Add Domain)
// para o endereço usado em FROM_EMAIL funcionar de verdade — veja
// ARCHITECTURE_WHATSAPP_IA.md.

export interface ResendEmail {
  from: string
  to: string | string[]
  subject: string
  html: string
}

const RESEND_API_URL = 'https://api.resend.com'

function getApiKey(): string {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY não configurado nos secrets do Supabase.')
  return key
}

export async function sendEmail(email: ResendEmail): Promise<void> {
  const res = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(email),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao enviar email via Resend (${res.status}): ${detail}`)
  }
}

// Manda até 100 emails personalizados numa chamada só (limite do Resend).
// Se vier mais que isso, divide em lotes automaticamente.
export async function sendBatchEmails(emails: ResendEmail[]): Promise<void> {
  const BATCH_LIMIT = 100
  for (let i = 0; i < emails.length; i += BATCH_LIMIT) {
    const batch = emails.slice(i, i + BATCH_LIMIT)
    const res = await fetch(`${RESEND_API_URL}/emails/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Falha ao enviar lote de emails via Resend (${res.status}): ${detail}`)
    }
  }
}
