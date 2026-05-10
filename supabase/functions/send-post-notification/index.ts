import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://tromot.com',
  'https://www.tromot.com',
  'https://app.tromot.com',
  'https://bc258fac-6bb8-419b-8b51-b94515b0f521.lovableproject.com',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

interface NotificationRequest {
  postId: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Require authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { postId }: NotificationRequest = await req.json();
    if (!postId || typeof postId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'postId obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load real post data from DB (do not trust client-provided names)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, author_id, status, product_id, products:product_id(name), profiles:author_id(name)')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Only the post author may trigger this notification
    if (post.author_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Apenas o autor pode enviar essa notificação' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Rate limit: max 10 notifications/hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'notification_sent')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);
    if ((recentCount ?? 0) >= 10) {
      return new Response(
        JSON.stringify({ error: 'Limite de notificações excedido' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productName = (post as any).products?.name ?? 'produto';
    const authorName = (post as any).profiles?.name ?? 'Um instalador';

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .neq('user_id', user.id);

    if (profilesError) {
      return new Response(
        JSON.stringify({ error: 'Falha ao processar destinatários' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log analytics event
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'notification_sent',
        user_id: user.id,
        metadata: {
          post_id: postId,
          product_name: productName,
          recipients_count: profiles?.length || 0,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        recipientCount: profiles?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
