import { useEffect } from 'react';
import { usePWA } from './usePWA';

export const useAutoInstall = () => {
  const { isInstallable, installApp, hasPrompt } = usePWA();

  useEffect(() => {
    // Check if we have install parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shouldInstall = urlParams.get('install') === '1';
    
    if (shouldInstall) {
      console.log('[Auto Install] Install parameter detected, attempting automatic installation');
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('install');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Tentar instalação automática após pequeno delay
      setTimeout(async () => {
        if (isInstallable && hasPrompt) {
          console.log('[Auto Install] Attempting automatic installation');
          const success = await installApp();
          if (success) {
            console.log('[Auto Install] Automatic installation successful');
          } else {
            console.log('[Auto Install] Automatic installation failed');
          }
        } else {
          console.log('[Auto Install] Not installable or no prompt available');
        }
      }, 1000);
    }
  }, [isInstallable, hasPrompt, installApp]);

  return {};
};
