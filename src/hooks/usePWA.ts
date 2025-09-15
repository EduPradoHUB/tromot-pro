import { useState, useEffect } from 'react';

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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(true); // Mais permissivo - sempre mostrar opção
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
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
        console.log('[PWA] Browser detected - installable with manual instructions as fallback');
      }
    }

    // Verificar se já existe o prompt capturado (pode acontecer antes do React carregar)
    if ((window as any).deferredPrompt) {
      console.log('[PWA] Found deferred prompt from before React initialization');
      setInstallPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
      setHasPrompt(true);
    }

    // Escutar evento de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event received');
      e.preventDefault();
      
      const event = e as BeforeInstallPromptEvent;
      
      // Salvar no window também como backup
      (window as any).deferredPrompt = event;
      
      setInstallPrompt(event);
      setIsInstallable(true);
      setHasPrompt(true);
      
      console.log('[PWA] Install prompt ready, platforms:', event.platforms);
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
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    console.log('[PWA] Install attempt - hasPrompt:', hasPrompt, 'installPrompt:', !!installPrompt, 'isIOS:', isIOS());
    
    // Android/Chrome: Usar beforeinstallprompt se disponível
    if (installPrompt && !isIOS()) {
      try {
        console.log('[PWA] Showing native install prompt');
        await installPrompt.prompt();
        
        const result = await installPrompt.userChoice;
        console.log('[PWA] User choice:', result.outcome);
        
        if (result.outcome === 'accepted') {
          setInstallPrompt(null);
          setIsInstallable(false);
          setHasPrompt(false);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('[PWA] Error during installation:', error);
        // Fallback para instruções manuais
      }
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