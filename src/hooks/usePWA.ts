import * as React from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Detectar iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detectar se já está instalado - mais permissivo para evitar false positives
const checkInstallationStatus = () => {
  // PWA instalado (modo standalone) - só considerar se estiver realmente standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari "Add to Home Screen" - verificação mais rigorosa
  const isIOSInstalled = isIOS() && (window.navigator as any).standalone === true;
  
  // Verificar se está rodando em app nativo (Capacitor)
  const isCapacitor = !!(window as any).Capacitor;
  
  // Só considerar instalado se realmente estiver em modo standalone ou for app nativo
  return (isStandalone && !window.location.search.includes('forceHideBadge')) || isIOSInstalled || isCapacitor;
};

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(true); // Mais permissivo - sempre mostrar opção
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [hasPrompt, setHasPrompt] = React.useState(false);

  React.useEffect(() => {
    console.log('[PWA] Initializing PWA hook');
    
    // Verificar se já está instalado
    const installed = checkInstallationStatus();
    setIsInstalled(installed);
    console.log('[PWA] Installation status:', installed);

    // Sempre considerar instalável, a não ser que já esteja instalado
    if (!installed) {
      setIsInstallable(true);
      if (isIOS()) {
        console.log('[PWA] iOS detected - installable via Add to Home Screen');
      } else {
        console.log('[PWA] Browser detected - checking for native prompt');
      }
    }

    // Verificar se já existe o prompt capturado globalmente
    if ((window as any).deferredPrompt) {
      console.log('[PWA] Found existing deferred prompt');
      const existingPrompt = (window as any).deferredPrompt;
      setInstallPrompt(existingPrompt);
      setIsInstallable(true);
      setHasPrompt(true);
      console.log('[PWA] Using existing prompt, platforms:', existingPrompt.platforms);
    }

    // Verificar condições PWA para trigger do beforeinstallprompt
    const checkPWAEligibility = async () => {
      const hasManifest = document.querySelector('link[rel="manifest"]');
      const hasServiceWorker = 'serviceWorker' in navigator;
      const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
      
      console.log('[PWA] Eligibility check:', {
        hasManifest: !!hasManifest,
        hasServiceWorker,
        isHTTPS,
        userAgent: navigator.userAgent
      });

      // Importar e executar verificação detalhada
      try {
        const { logPWAStatus } = await import('@/utils/pwaUtils');
        await logPWAStatus();
      } catch (error) {
        console.warn('[PWA] Could not load PWA utils:', error);
      }
    };
    
    // Aguardar um pouco antes de verificar PWA eligibility
    const checkTimer = setTimeout(() => {
      checkPWAEligibility();
      
      // Forçar uma verificação adicional após service worker estar ativo
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          console.log('[PWA] Service Worker is ready, forcing prompt check');
          // Pequeno delay para garantir que tudo foi processado
          setTimeout(() => {
            // Se ainda não temos prompt, algo pode estar errado
            if (!hasPrompt && !(window as any).deferredPrompt) {
              console.warn('[PWA] No beforeinstallprompt received yet. PWA may not meet criteria.');
              console.log('[PWA] Current state:', {
                isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
                hasManifest: !!document.querySelector('link[rel="manifest"]'),
                hasServiceWorker: 'serviceWorker' in navigator,
                userAgent: navigator.userAgent
              });
            }
          }, 2000);
        });
      }
    }, 1000);

    // Escutar evento de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event received - this enables native installation!');
      e.preventDefault();
      
      const event = e as BeforeInstallPromptEvent;
      
      // Salvar no window globalmente
      (window as any).deferredPrompt = event;
      
      setInstallPrompt(event);
      setIsInstallable(true);
      setHasPrompt(true);
      
      console.log('[PWA] Native install prompt available, platforms:', event.platforms);
    };

    // Escutar app instalado
    const handleAppInstalled = (e: Event) => {
      console.log('[PWA] App installed successfully', e);
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      setHasPrompt(false);
      
      // Limpar backup
      delete (window as any).deferredPrompt;
    };

    // Escutar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const newInstallStatus = checkInstallationStatus();
      console.log('[PWA] Display mode changed, installed:', newInstallStatus);
      setIsInstalled(newInstallStatus);
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      clearTimeout(checkTimer);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    console.log('[PWA] Install attempt starting...', {
      hasPrompt,
      installPrompt: !!installPrompt,
      isIOS: isIOS(),
      deferredPromptExists: !!(window as any).deferredPrompt
    });
    
    // Verificar se existe prompt em cache global
    const globalPrompt = (window as any).deferredPrompt;
    const promptToUse = installPrompt || globalPrompt;
    
    // Android/Chrome: Usar beforeinstallprompt se disponível
    if (promptToUse && !isIOS()) {
      try {
        console.log('[PWA] Using native install prompt - this should install automatically!');
        
        // Atualizar estado se usamos o prompt global
        if (!installPrompt && globalPrompt) {
          setInstallPrompt(globalPrompt);
          setHasPrompt(true);
        }
        
        await promptToUse.prompt();
        
        const result = await promptToUse.userChoice;
        console.log('[PWA] User responded to native prompt:', result.outcome);
        
        if (result.outcome === 'accepted') {
          console.log('[PWA] User accepted - app should be installing now!');
          setInstallPrompt(null);
          setHasPrompt(false);
          // Limpar o cache global
          delete (window as any).deferredPrompt;
          return true;
        } else {
          console.log('[PWA] User dismissed the native install prompt');
        }
        
        return false;
      } catch (error) {
        console.error('[PWA] Error during native installation:', error);
        console.log('[PWA] Falling back to manual instructions');
      }
    } else {
      console.log('[PWA] No native prompt available, showing manual instructions');
    }

    // Fallback: Instruções manuais para todos os casos onde o prompt nativo não funciona
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (isIOS()) {
      instructions = 'Para instalar o TROMOT PRO:\n\n1. Toque no ícone de compartilhar (□↑)\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"';
    } else if (userAgent.includes('chrome')) {
      instructions = 'Para instalar o TROMOT PRO:\n\n1. Toque no menu do Chrome (⋮)\n2. Selecione "Instalar app"\n3. Confirme a instalação';
    } else if (userAgent.includes('edge')) {
      instructions = 'Para instalar o TROMOT PRO:\n\n1. Toque no menu do Edge (...)\n2. Vá em "Aplicativos"\n3. Selecione "Instalar este site como um aplicativo"';
    } else if (userAgent.includes('samsung')) {
      instructions = 'Para instalar o TROMOT PRO:\n\n1. Toque no menu do navegador\n2. Selecione "Adicionar página a"\n3. Escolha "Tela inicial"';
    } else {
      instructions = 'Para instalar o TROMOT PRO:\n\n1. Abra no Chrome ou Edge\n2. Toque no menu do navegador\n3. Selecione "Instalar app"';
    }

    console.log('[PWA] Showing manual installation instructions');
    alert(instructions);
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    hasPrompt,
    installApp,
  };
};