// Lógica compartilhada de envio das notificações de produto por email.
// Usada tanto pelo caminho automático (product-change-webhook) quanto
// pelo botão manual "Enviar agora" (send-pending-notification), para
// nunca ter duas versões da mesma regra de negócio.

import { sendBatchEmails, ResendEmail } from './resend.ts'

const EVENT_LABELS: Record<string, string> = {
  novo_produto: 'Novo produto TROMOT',
  manual_atualizado: 'Manual atualizado',
  produto_alterado: 'Produto atualizado',
}

function getAppBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || 'https://tromotpro.com.br').replace(/\/$/, '')
}

function getFromAddress(): string {
  // Precisa ser um endereço de um domínio verificado no Resend
  // (Domains → Add Domain). Ex: "TROMOT PRO <novidades@tromot.com>".
  return Deno.env.get('RESEND_FROM_EMAIL') || 'TROMOT PRO <novidades@tromot.com>'
}

function buildEmailHtml(eventType: string, product: any, unsubscribeToken: string): { subject: string; html: string } {
  const appUrl = getAppBaseUrl()
  const productUrl = `${appUrl}/produto/${product.id}`
  const unsubscribeUrl = `${appUrl}/descadastro?token=${unsubscribeToken}`

  let subject: string
  let intro: string

  if (eventType === 'novo_produto') {
    subject = `Novo produto TROMOT: ${product.name}`
    intro = `A TROMOT acabou de lançar um novo produto: <strong>${product.name}</strong>.`
  } else if (eventType === 'manual_atualizado') {
    subject = `Manual atualizado: ${product.name}`
    intro = `O manual do produto <strong>${product.name}</strong> foi atualizado.`
  } else {
    subject = `Atualização no produto: ${product.name}`
    intro = `O produto <strong>${product.name}</strong> teve uma atualização.`
  }

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
    <h2 style="color: #c8102e; margin-bottom: 4px;">TROMOT PRO</h2>
    <p>${intro}</p>
    ${product.description ? `<p style="color: #555;">${product.description}</p>` : ''}
    <p style="margin: 24px 0;">
      <a href="${productUrl}" style="background:#c8102e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
        Ver produto
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="font-size: 12px; color: #999;">
      Você está recebendo este email porque optou por receber novidades de produto no app TROMOT PRO.
      <a href="${unsubscribeUrl}" style="color:#999;">Não quero mais receber esses emails</a>.
    </p>
  </div>`

  return { subject, html }
}

export async function sendProductNotification(supabase: any, notificationId: string): Promise<{ recipients: number }> {
  const { data: notification, error: notifError } = await supabase
    .from('product_notifications')
    .select('id, event_type, product_id, status')
    .eq('id', notificationId)
    .single()

  if (notifError || !notification) throw new Error('Notificação não encontrada.')
  if (notification.status === 'sent') return { recipients: notification.recipients_count ?? 0 }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, description')
    .eq('id', notification.product_id)
    .single()

  if (productError || !product) throw new Error('Produto não encontrado.')

  const { data: recipients, error: recipientsError } = await supabase
    .from('profiles')
    .select('email, unsubscribe_token')
    .eq('role', 'Cliente')
    .eq('email_notifications_opt_in', true)
    .not('email', 'is', null)

  if (recipientsError) throw new Error(recipientsError.message)

  const list = recipients ?? []
  const from = getFromAddress()

  if (list.length > 0) {
    const emails: ResendEmail[] = list.map((r: any) => {
      const { subject, html } = buildEmailHtml(notification.event_type, product, r.unsubscribe_token)
      return { from, to: r.email, subject, html }
    })
    await sendBatchEmails(emails)
  }

  await supabase
    .from('product_notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: list.length })
    .eq('id', notificationId)

  return { recipients: list.length }
}

export { EVENT_LABELS }
