import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      console.log('[PWA] beforeinstallprompt event received');
      setInstallPrompt(event);
      setIsInstallable(true);
      setHasPrompt(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      setHasPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
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