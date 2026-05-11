import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BLING_BASE = 'https://www.bling.com.br/Api/v3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getValidToken(supabase) {
  const { data, error } = await supabase
    .from('bling_tokens')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !data) throw new Error('Token Bling nao encontrado.')

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
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: data.refresh_token,
    }),
  })

  if (!res.ok) throw new Error('Falha ao renovar token Bling')
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Nao autorizado', { status: 401 })

    const anonSupabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await anonSupabase.auth.getUser()
    if (!user) return new Response('Nao autorizado', { status: 401 })

    const body = await req.json()
    const { path, method = 'GET', payload } = body
    if (!path) return new Response('Path obrigatorio', { status: 400 })

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )
    const token = await getValidToken(serviceSupabase)

    const blingRes = await fetch(BLING_BASE + path, {
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    const result = await blingRes.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: blingRes.status,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
