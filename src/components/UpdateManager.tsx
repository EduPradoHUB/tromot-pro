import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function UpdateManager() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[UpdateManager] SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('[UpdateManager] SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'App pronto para uso offline',
        description: 'O TROMOT PRO está disponível mesmo sem internet',
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: 'Atualização disponível',
        description: 'Uma nova versão do app está pronta',
        action: (
          <button
            onClick={() => updateServiceWorker(true)}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
          >
            Atualizar
          </button>
        ),
        duration: 0, // Não remove automaticamente
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}