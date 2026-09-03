// kb-embed
// Gera (ou regenera) o embedding de uma entrada da base de conhecimento
// (public.knowledge_base) para que a IA do WhatsApp consiga encontrá-la
// por busca semântica (RAG).
//
// Chamada pelo painel admin (src/pages/admin/KnowledgeBase.tsx) toda vez
// que uma entrada é criada ou editada. Requer usuário autenticado com
// role ADM ou Técnico Tromot (RLS de knowledge_base já garante isso na
// escrita da linha; aqui validamos de novo antes de gastar uma chamada
// de embeddings).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { embedText } from '../_shared/embeddings.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Não autorizado', { status: 401, headers: corsHeaders })

    // Cliente autenticado como o usuário que chamou a função, só para
    // confirmar quem é e qual o role.
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) return new Response('Não autorizado', { status: 401, headers: corsHeaders })

    const { data: profile } = await userSupabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['ADM', 'Técnico Tromot'].includes(profile.role)) {
      return new Response('Acesso negado: apenas ADM ou Técnico Tromot.', { status: 403, headers: corsHeaders })
    }

    const { knowledgeBaseId } = await req.json()
    if (!knowledgeBaseId) {
      return new Response(JSON.stringify({ error: 'knowledgeBaseId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service role para poder ler/gravar a entrada independente de RLS
    // (o usuário já foi validado acima).
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: entry, error: fetchError } = await serviceSupabase
      .from('knowledge_base')
      .select('id, title, situation, solution, category')
      .eq('id', knowledgeBaseId)
      .single()

    if (fetchError || !entry) {
      return new Response(JSON.stringify({ error: 'Entrada não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // O texto embedado combina situação + solução (+ categoria), para que
    // a busca funcione tanto por "o que o cliente perguntou" quanto pela
    // solução em si.
    const textToEmbed = [
      entry.title,
      entry.category ? `Categoria: ${entry.category}` : null,
      `Situação: ${entry.situation}`,
      `Solução: ${entry.solution}`,
    ].filter(Boolean).join('\n')

    const embedding = await embedText(textToEmbed, 'document')

    const { error: updateError } = await serviceSupabase
      .from('knowledge_base')
      .update({ embedding })
      .eq('id', knowledgeBaseId)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em kb-embed:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
