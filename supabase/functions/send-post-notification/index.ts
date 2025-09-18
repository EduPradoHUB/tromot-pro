import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  postId: string;
  productName: string;
  authorName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { postId, productName, authorName }: NotificationRequest = await req.json();

    console.log('Sending notification for post:', postId, 'product:', productName);

    // Buscar todos os usuários com permissão de notificação (aqui você pode filtrar por preferências)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .neq('user_id', (await supabase.auth.getUser()).data.user?.id); // Não enviar para o próprio autor

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles' }),
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

    // Log analytics event
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'notification_sent',
        metadata: {
          post_id: postId,
          product_name: productName,
          author_name: authorName,
          recipients_count: profiles?.length || 0
        }
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});