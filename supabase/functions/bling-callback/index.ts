import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BLING_BASE = 'https://www.bling.com.br/Api/v3'

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  const htmlErro = (msg: string) => new Response(
    '<html><body style="font-family:sans-serif;padding:40px;background:#1a1a1a;color:#fff">' +
    '<h2 style="color:#e53e3e">Erro na autorizacao Bling</h2><p>' + msg + '</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )

  const htmlSucesso = (total: number) => new Response(
    '<html><body style="font-family:sans-serif;padding:40px;background:#1a1a1a;color:#fff">' +
    '<h2 style="color:#48bb78">Bling conectado com sucesso!</h2>' +
    '<p>Integracao configurada. Pode fechar esta aba.</p>' +
    '<p style="color:#888;font-size:14px">Sincronizacao inicial: ' + total + ' clientes importados.</p>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )

  if (error) return htmlErro('Autorizacao negada: ' + error)
  if (!code) return htmlErro('Codigo de autorizacao ausente.')

  const clientId = Deno.env.get('BLING_CLIENT_ID')!
  const clientSecret = Deno.env.get('BLING_CLIENT_SECRET')!
  const credentials = btoa(clientId + ':' + clientSecret)

  // Troca o code pelo access_token
  const tokenRes = await fetch(BLING_BASE + '/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return htmlErro('Falha ao obter token: ' + err)
  }

  const tokens = await tokenRes.json()

  // Salva tokens no Supabase (service_role)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error: dbErr } = await supabase.from('bling_tokens').upsert({
    id: 1,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (dbErr) return htmlErro('Erro ao salvar tokens: ' + dbErr.message)

  // Dispara sync inicial de clientes em background
  try {
    const syncUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/sync-clientes-bling'
    const syncRes = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        'Content-Type': 'application/json',
      },
    })
    const syncData = await syncRes.json()
    return htmlSucesso(syncData.total || 0)
  } catch (_) {
    return htmlSucesso(0)
  }
})
