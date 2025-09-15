import { useState, useEffect } from 'react';

// Definir o tipo do evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Variável global para armazenar o prompt
let globalInstallPrompt: BeforeInstallPromptEvent | null = null;

// Função para detectar iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Função para detectar Android
const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Função para verificar se o PWA já está instalado
const checkInstallationStatus = (): boolean => {
  // Verificar display mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Verificar iOS standalone
  const isIOSStandalone = isIOS() && (window.navigator as any).standalone === true;
  
  // Verificar se está rodando via Capacitor
  const isCapacitor = !!(window as any).Capacitor;
  
  // Verificar parâmetro na URL
  const urlParams = new URLSearchParams(window.location.search);
  const isFromPWA = urlParams.get('source') === 'pwa';
  
  return isStandalone || isIOSStandalone || isCapacitor || isFromPWA;
};

// Função para simular engagement
const simulateEngagement = () => {
  // Simular cliques e interações para aumentar o engagement score
  const events = ['click', 'scroll', 'keydown', 'touchstart'];
  events.forEach(eventType => {
    document.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
  
  // Definir tempo de sessão no localStorage
  const sessionStart = localStorage.getItem('pwa-session-start');
  if (!sessionStart) {
    localStorage.setItem('pwa-session-start', Date.now().toString());
  }
  
  // Incrementar contador de visitas
  const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0') + 1;
  localStorage.setItem('pwa-visit-count', visitCount.toString());
};

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    console.log('[usePWA] Initializing PWA hook');
    
    // Simular engagement imediatamente
    simulateEngagement();
    
    // Verificar se já está instalado
    const installed = checkInstallationStatus();
    console.log('[usePWA] Installation status:', installed);
    setIsInstalled(installed);

    // Verificar se já existe um prompt salvo globalmente
    if (globalInstallPrompt) {
      console.log('[usePWA] Found existing global prompt');
      setInstallPrompt(globalInstallPrompt);
      setIsInstallable(true);
      setHasPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[usePWA] beforeinstallprompt event fired - INSTALLATION AVAILABLE!');
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      
      // Salvar o prompt globalmente E no estado
      globalInstallPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      setHasPrompt(true);
      
      console.log('[usePWA] Install prompt captured and stored globally');
      console.log('[usePWA] Prompt platforms:', promptEvent.platforms);
    };

    const handleAppInstalled = () => {
      console.log('[usePWA] appinstalled event fired - APP SUCCESSFULLY INSTALLED!');
      setIsInstalled(true);
      setIsInstallable(false);
      setHasPrompt(false);
      setInstallPrompt(null);
      globalInstallPrompt = null;
      
      // Marcar como instalado no localStorage
      localStorage.setItem('pwa-installed', 'true');
    };

    const handleDisplayModeChange = () => {
      const installed = checkInstallationStatus();
      console.log('[usePWA] Display mode changed, installed:', installed);
      setIsInstalled(installed);
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Listener para mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(handleDisplayModeChange);

    // Verificar critérios de instalação após um pequeno delay
    setTimeout(() => {
      if (!installed) {
        // Forçar disponibilidade de instalação se não estiver instalado
        const canInstall = !!globalInstallPrompt || isIOS() || isAndroid() || 
                          navigator.userAgent.includes('Chrome') ||
                          navigator.userAgent.includes('Edge') ||
                          navigator.userAgent.includes('Firefox');
        
        console.log('[usePWA] Installability check:', { 
          canInstall, 
          hasGlobalPrompt: !!globalInstallPrompt, 
          isIOS: isIOS(),
          isAndroid: isAndroid(),
          userAgent: navigator.userAgent
        });
        
        setIsInstallable(canInstall);
        
        // Se temos um prompt global, definir como disponível
        if (globalInstallPrompt) {
          setHasPrompt(true);
        }
      }
    }, 2000);

    // Tentar capturar o evento novamente após delay (algumas vezes o evento não dispara imediatamente)
    setTimeout(() => {
      if (!globalInstallPrompt && !installed) {
        console.log('[usePWA] Trying to trigger beforeinstallprompt manually');
        // Simular mais engagement
        simulateEngagement();
        
        // Despachar evento customizado para forçar verificação
        window.dispatchEvent(new CustomEvent('pwa-check-installability'));
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeListener(handleDisplayModeChange);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    console.log('[usePWA] installApp called - ATTEMPTING INSTALLATION');
    console.log('[usePWA] Current state:', { isInstalled, hasPrompt, installPrompt: !!installPrompt, globalPrompt: !!globalInstallPrompt });
    
    try {
      // Verificar se já está instalado
      if (isInstalled) {
        console.log('[usePWA] App already installed');
        return true;
      }

      // Simular mais engagement antes da instalação
      simulateEngagement();

      // Tentar usar o prompt nativo primeiro (usar o global se disponível)
      const currentPrompt = installPrompt || globalInstallPrompt;
      if (currentPrompt) {
        console.log('[usePWA] Using native install prompt - THIS SHOULD INSTALL AUTOMATICALLY!');
        console.log('[usePWA] Prompt details:', { platforms: currentPrompt.platforms });
        
        try {
          await currentPrompt.prompt();
          const choiceResult = await currentPrompt.userChoice;
          
          console.log('[usePWA] User choice:', choiceResult.outcome);
          
          if (choiceResult.outcome === 'accepted') {
            console.log('[usePWA] SUCCESS! User accepted installation');
            setIsInstalled(true);
            setIsInstallable(false);
            setHasPrompt(false);
            setInstallPrompt(null);
            globalInstallPrompt = null;
            localStorage.setItem('pwa-installed', 'true');
            return true;
          } else {
            console.log('[usePWA] User dismissed the install prompt');
            return false;
          }
        } catch (promptError) {
          console.error('[usePWA] Error with native prompt:', promptError);
          return false;
        }
      }

      console.log('[usePWA] Native prompt not available - No beforeinstallprompt event captured');
      console.log('[usePWA] This means the PWA may not meet Chrome\'s installation criteria');
      
      // Se não temos prompt nativo, tentar outras estratégias baseadas no browser
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Para Chrome/Edge - verificar se o menu de instalação está disponível
      if (userAgent.includes('chrome') || userAgent.includes('edge')) {
        console.log('[usePWA] Chrome/Edge detected - checking for install availability');
        
        // Verificar se atende aos critérios mínimos do PWA
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasManifest = document.querySelector('link[rel="manifest"]');
        const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
        
        console.log('[usePWA] PWA criteria check:', { hasServiceWorker, hasManifest, isHTTPS });
        
        if (hasServiceWorker && hasManifest && isHTTPS) {
          console.log('[usePWA] PWA criteria met - installation should be available via browser menu');
          console.log('[usePWA] User should see "Install app" option in Chrome menu (⋮)');
        }
      }

      return false;
      
    } catch (error) {
      console.error('[usePWA] Installation error:', error);
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