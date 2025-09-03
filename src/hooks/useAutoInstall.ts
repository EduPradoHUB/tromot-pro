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
      
      // Não fazer auto-install automático - apenas mostrar o dialog
      console.log('[Auto Install] Showing install dialog, no automatic installation');
    }
  }, [isInstallable, hasPrompt, installApp]);

  return {
    shouldShowDialog,
    setShouldShowDialog
  };
};
