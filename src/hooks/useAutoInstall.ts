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
      
      // Auto-install when prompt becomes available with more aggressive polling
      let checkCount = 0;
      const maxChecks = 60; // 30 seconds at 500ms intervals
      let timeoutId: NodeJS.Timeout;
      
      const tryAutoInstall = () => {
        checkCount++;
        console.log(`[Auto Install] Check ${checkCount}/${maxChecks} - installable: ${isInstallable}, hasPrompt: ${hasPrompt}`);
        
        if (isInstallable && hasPrompt) {
          console.log('[Auto Install] Attempting automatic installation');
          installApp().then(success => {
            if (success) {
              console.log('[Auto Install] Installation successful!');
              setShouldShowDialog(false);
            } else {
              console.log('[Auto Install] Installation failed, keeping dialog open');
            }
          });
        } else if (checkCount < maxChecks) {
          // Keep checking for up to 30 seconds
          timeoutId = setTimeout(tryAutoInstall, 500);
        } else {
          console.log('[Auto Install] Max checks reached, stopping auto-install attempts');
        }
      };
      
      // Start checking immediately
      timeoutId = setTimeout(tryAutoInstall, 100);
      
      // Cleanup after 30 seconds
      const cleanupTimeout = setTimeout(() => {
        clearTimeout(timeoutId);
        console.log('[Auto Install] Cleanup timeout reached');
      }, 30000);
      
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
