// send-pending-notification
//
// Chamada pelo painel admin (tela "Notificações de produto") quando o
// modo de um tipo de evento está como "manual" e o ADM clica em
// "Enviar agora" numa notificação pendente. Valida que quem chamou é
// ADM ou Técnico Tromot, e delega o envio de verdade para a mesma
// lógica compartilhada usada no caminho automático.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendProductNotification } from '../_shared/productEmail.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userError } = await anonClient.auth.getUser()
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single()

    if (!profile || !['ADM', 'Técnico Tromot'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a ADM/Técnico Tromot.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { notificationId } = await req.json()
    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'notificationId é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const result = await sendProductNotification(supabase, notificationId)

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em send-pending-notification:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
