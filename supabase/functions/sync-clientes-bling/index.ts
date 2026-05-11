import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BLING_BASE = 'https://www.bling.com.br/Api/v3'

async function getBlingToken(supabase) {
  const { data } = await supabase.from('bling_tokens').select('*').eq('id', 1).single()
  if (!data) throw new Error('Token nao configurado')

  if (new Date(data.expires_at) > new Date(Date.now() + 60_000)) {
    return data.access_token
  }

  const clientId = Deno.env.get('BLING_CLIENT_ID')
  const clientSecret = Deno.env.get('BLING_CLIENT_SECRET')
  const credentials = btoa(clientId + ':' + clientSecret)

  const res = await fetch(BLING_BASE + '/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: data.refresh_token }),
  })

  const refreshed = await res.json()
  await supabase.from('bling_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  return refreshed.access_token
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const token = await getBlingToken(supabase)
    let pagina = 1
    let totalSincronizado = 0

    while (true) {
      const res = await fetch(
        BLING_BASE + '/contatos?pagina=' + pagina + '&limite=100&situacao=A',
        { headers: { 'Authorization': 'Bearer ' + token } }
      )

      const json = await res.json()
      const contatos = json.data

      if (!contatos || contatos.length === 0) break

      const registros = contatos.map((c) => ({
        bling_id:   c.id,
        nome:       c.nome,
        documento:  c.numeroDocumento || null,
        email:      c.email || null,
        telefone:   c.telefone || null,
        cidade:     c.enderecos?.[0]?.municipio || null,
        uf:         c.enderecos?.[0]?.uf || null,
        cep:        c.enderecos?.[0]?.cep || null,
        endereco:   c.enderecos?.[0]?.endereco || null,
        situacao:   'A',
        synced_at:  new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('clientes')
        .upsert(registros, {
          onConflict: 'bling_id',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Erro upsert pagina ' + pagina + ':', error)
      }

      totalSincronizado += registros.length
      pagina++

      // Respeita rate limit do Bling (300 req/min)
      await new Promise(r => setTimeout(r, 200))
    }

    console.log('Sync concluido: ' + totalSincronizado + ' clientes')
    return new Response(
      JSON.stringify({ success: true, total: totalSincronizado }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erro sync:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
