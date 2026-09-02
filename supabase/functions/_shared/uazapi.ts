// Adaptador para a uazapi (uazapi.dev) — API não-oficial de WhatsApp.
//
// ATENÇÃO: os nomes exatos dos endpoints e o formato do payload variam
// entre instâncias/versões da uazapi. Os endpoints abaixo seguem o
// formato mais comum documentado pela uazapi (grupo "send"), mas
// CONFIRME no painel da sua instância (Instância -> API/Swagger) antes
// de ativar em produção. Se algo não bater, ajuste só este arquivo —
// nada mais no projeto depende do formato exato da uazapi.
//
// Secrets necessários no projeto Supabase:
//   UAZAPI_BASE_URL  -> ex: https://sua-instancia.uazapi.com
//   UAZAPI_TOKEN     -> token da instância (painel uazapi)

function getConfig() {
  const baseUrl = Deno.env.get('UAZAPI_BASE_URL')
  const token = Deno.env.get('UAZAPI_TOKEN')
  if (!baseUrl || !token) {
    throw new Error('UAZAPI_BASE_URL / UAZAPI_TOKEN não configurados nos secrets do projeto.')
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token }
}

export async function sendText(phone: string, text: string) {
  const { baseUrl, token } = getConfig()
  const res = await fetch(`${baseUrl}/send/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ number: phone, text }),
  })
  if (!res.ok) {
    console.error('uazapi sendText falhou:', res.status, await res.text())
  }
  return res.ok
}

export async function sendMedia(
  phone: string,
  fileUrl: string,
  type: 'image' | 'document',
  caption?: string
) {
  const { baseUrl, token } = getConfig()
  // A uazapi aceita enviar mídia a partir de uma URL pública (o mesmo
  // link já usado no app, ex: Supabase Storage do bucket "manuals").
  const res = await fetch(`${baseUrl}/send/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({
      number: phone,
      type,           // 'image' | 'document'
      file: fileUrl,
      caption: caption ?? '',
    }),
  })
  if (!res.ok) {
    console.error('uazapi sendMedia falhou:', res.status, await res.text())
  }
  return res.ok
}

// Formato esperado do corpo do webhook enviado pela uazapi quando chega
// uma mensagem nova. Ajuste os campos conforme o payload real da sua
// instância (log o `req.json()` bruto no início se precisar confirmar).
export interface UazapiInboundMessage {
  phone: string        // número do remetente, ex: "5516999998888"
  senderName?: string
  messageType: 'text' | 'image' | 'audio' | 'document' | 'video' | string
  text?: string
  mediaUrl?: string
}

// Normaliza o payload cru do webhook da uazapi para o formato acima.
// A uazapi costuma mandar algo como { message: { ... }, chat: { ... } }
// no padrão Baileys — adapte esta função ao payload real que você vir
// chegar (dê um `console.log(JSON.stringify(body))` temporário na
// primeira mensagem de teste e ajuste os caminhos abaixo).
export function parseInboundWebhook(body: any): UazapiInboundMessage | null {
  const msg = body?.message ?? body
  if (!msg) return null

  const phone: string | undefined =
    msg.phone ?? msg.from ?? msg.key?.remoteJid?.replace(/@s\.whatsapp\.net$/, '')

  if (!phone) return null

  return {
    phone,
    senderName: msg.senderName ?? msg.pushName ?? undefined,
    messageType: msg.messageType ?? msg.type ?? 'text',
    text: msg.text ?? msg.body ?? msg.conversation ?? undefined,
    mediaUrl: msg.mediaUrl ?? msg.fileUrl ?? undefined,
  }
}
