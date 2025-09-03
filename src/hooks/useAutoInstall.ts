import { useEffect, useState } from 'react';
import { usePWA } from './usePWA';

export const useAutoInstall = () => {
  const [shouldShowDialog, setShouldShowDialog] = useState(false);
  const { isInstallable, installApp, hasPrompt } = usePWA();

  useEffect(() => {
    // Check if we have install parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shouldInstall = urlParams.get('install') === '1';
    
    if (shouldInstall) {
      console.log('[Auto Install] Install parameter detected');
      setShouldShowDialog(true);
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('install');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Auto-install when prompt becomes available
      let timeoutId: NodeJS.Timeout;
      
      const tryAutoInstall = () => {
        if (isInstallable && hasPrompt) {
          console.log('[Auto Install] Attempting automatic installation');
          installApp().then(success => {
            if (success) {
              setShouldShowDialog(false);
            }
          });
        } else {
          // Keep checking for a few seconds
          timeoutId = setTimeout(tryAutoInstall, 500);
        }
      };
      
      // Start checking after a small delay to let everything initialize
      timeoutId = setTimeout(tryAutoInstall, 1000);
      
      // Cleanup after 10 seconds to avoid infinite checking
      const cleanupTimeout = setTimeout(() => {
        clearTimeout(timeoutId);
      }, 10000);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(cleanupTimeout);
      };
    }
  }, [isInstallable, hasPrompt, installApp]);

  return {
    shouldShowDialog,
    setShouldShowDialog
  };
};
