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

// Detectar se já está instalado
const checkInstallationStatus = () => {
  // PWA instalado (modo standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari "Add to Home Screen"
  const isIOSInstalled = isIOS() && (window.navigator as any).standalone === true;
  
  // Chrome/Edge PWA
  const isPWAInstalled = isStandalone;
  
  return isIOSInstalled || isPWAInstalled;
};

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    setIsInstalled(checkInstallationStatus());

    // iOS não dispara beforeinstallprompt, mas é "instalável" via Add to Home Screen
    if (isIOS()) {
      setIsInstallable(true);
      console.log('[PWA] iOS detected - installable via Add to Home Screen');
    }

    // Escutar evento de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      console.log('[PWA] beforeinstallprompt event received');
      setInstallPrompt(event);
      setIsInstallable(true);
      setHasPrompt(true);
    };

    // Escutar app instalado
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      setHasPrompt(false);
    };

    // Escutar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(checkInstallationStatus());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    // iOS: Instruções para Add to Home Screen
    if (isIOS()) {
      console.log('[PWA] iOS - showing Add to Home Screen instructions');
      alert('Para instalar o TROMOT PRO:\n\n1. Toque no ícone de compartilhar (□↑)\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
      return false; // iOS não confirma instalação programaticamente
    }

    // Android/Chrome: Usar beforeinstallprompt
    if (!installPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      console.log('[PWA] Showing install prompt');
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
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    hasPrompt,
    installApp,
  };
};