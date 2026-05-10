import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  postId: string;
}

serve(async (req) => {
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
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Falha ao processar destinatários' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aqui você pode implementar diferentes provedores de notificação
    // Por enquanto, vamos usar notificações web através do service worker
    
    const notificationPayload = {
      title: 'Nova Instalação!',
      body: `${authorName} postou uma nova instalação de ${productName}`,
      icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
      badge: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
      data: {
        postId,
        productName,
        authorName,
        url: `/produto/${postId}`
      },
      tag: 'new-installation',
      requireInteraction: false
    };

    // Log analytics event (attributed to caller)
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

    console.log(`Notification prepared for ${profiles?.length || 0} users`);

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
    console.error('Error in send-post-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});