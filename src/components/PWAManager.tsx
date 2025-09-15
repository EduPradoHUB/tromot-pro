import React, { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from '@/hooks/use-toast';

export const PWAManager = () => {
  const { isInstallable, isInstalled } = usePWA();

  useEffect(() => {
    // Registrar service worker se ainda não foi registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWAManager] Service Worker registered:', registration);
          
          // Verificar se há atualizações
          registration.addEventListener('updatefound', () => {
            console.log('[PWAManager] Update found');
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: 'Atualização disponível',
                    description: 'Recarregue a página para ver as novidades',
                    action: (
                      <button 
                        onClick={() => window.location.reload()}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
                      >
                        Recarregar
                      </button>
                    ),
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWAManager] Service Worker registration failed:', error);
        });
    }

    // Configurar eventos de rede
    const handleOnline = () => {
      toast({
        title: 'Conexão restaurada',
        description: 'Você está online novamente',
      });
    };

    const handleOffline = () => {
      toast({
        title: 'Modo offline',
        description: 'Você pode continuar usando o app offline',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mostrar notificação de instalação disponível (apenas uma vez por sessão)
    const hasShownInstallNotification = sessionStorage.getItem('pwa-install-notification-shown');
    if (isInstallable && !isInstalled && !hasShownInstallNotification) {
      setTimeout(() => {
        toast({
          title: 'App disponível para instalação',
          description: 'Instale o TROMOT PRO para uma experiência melhor',
          duration: 10000,
        });
        sessionStorage.setItem('pwa-install-notification-shown', 'true');
      }, 3000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstallable, isInstalled]);

  // Este componente não renderiza nada visível
  return null;
};