import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export const NotificationManager = () => {
  const { requestPermission, showNotification, permission } = useNotifications();
  const { user } = useApp();

  // Solicitar permissão para notificações quando o usuário logar
  useEffect(() => {
    if (user && permission === 'default') {
      const askForPermission = async () => {
        const granted = await requestPermission();
        if (granted) {
          console.log('✅ Notificações habilitadas para o usuário');
        } else {
          console.log('❌ Usuário recusou notificações');
        }
      };
      
      // Aguardar um pouco antes de solicitar permissão
      setTimeout(askForPermission, 2000);
    }
  }, [user, permission, requestPermission]);

  // Escutar por novos posts aprovados em tempo real
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Configurando listener para novos posts aprovados');

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: 'status=eq.approved'
        },
        async (payload) => {
          console.log('📱 Novo post aprovado detectado:', payload);
          
          if (payload.new && payload.old?.status !== 'approved') {
            try {
              // Buscar dados completos do post
              const { data: postData, error } = await supabase
                .from('posts')
                .select(`
                  id,
                  author_id,
                  product_id,
                  products (name),
                  profiles (name)
                `)
                .eq('id', payload.new.id)
                .single();

              if (!error && postData && postData.author_id !== user.id) {
                // Não notificar o próprio autor
                await showNotification('Nova Instalação!', {
                  body: `${postData.profiles?.name || 'Usuário'} postou uma nova instalação de ${postData.products?.name || 'produto'}`,
                  tag: 'new-installation',
                  icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
                  badge: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
                  data: {
                    postId: postData.id,
                    productId: postData.product_id,
                    url: `/produto/${postData.product_id}`
                  }
                });
                
                console.log('✅ Notificação enviada para post:', postData.id);
              }
            } catch (error) {
              console.error('❌ Erro ao processar notificação:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Removendo listener de notificações');
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);

  return null; // Componente invisível
};