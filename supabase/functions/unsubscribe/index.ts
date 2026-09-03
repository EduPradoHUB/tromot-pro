// unsubscribe
//
// Chamada pela página pública /descadastro quando o cliente clica no
// link de descadastro de um email de notificação de produto. Não
// exige login — o token aleatório (profiles.unsubscribe_token) já
// identifica o cliente com segurança suficiente pra esse tipo de ação
// (mesmo padrão usado por praticamente todo serviço de email).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token ausente.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase
      .from('profiles')
      .update({ email_notifications_opt_in: false })
      .eq('unsubscribe_token', token)
      .select('email')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return new Response(JSON.stringify({ error: 'Link inválido ou expirado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, email: data.email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em unsubscribe:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
