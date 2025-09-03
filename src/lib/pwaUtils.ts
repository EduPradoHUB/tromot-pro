export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't access window.top, we're probably in an iframe
  }
};

export const getInstallInstructions = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return "No Safari: toque no ícone de compartilhar e selecione 'Adicionar à Tela de Início'";
  } else if (userAgent.includes('Android')) {
    return "No Chrome: toque no menu (⋮) e selecione 'Instalar app' ou 'Adicionar à tela inicial'";
  } else {
    return "No seu navegador, procure pela opção 'Instalar app' ou 'Adicionar à tela inicial' no menu";
  }
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const logPWADiagnostics = (): void => {
  console.log('[PWA Diagnostics] Browser info:', {
    userAgent: navigator.userAgent,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isInIframe: isInIframe(),
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    manifestSupported: 'manifestchange' in window,
    beforeInstallPromptFired: window.hasOwnProperty('beforeinstallprompt')
  });
};