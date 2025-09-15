// Utilitários para PWA e verificação de critérios de instalação

export const checkPWAInstallability = async (): Promise<{
  canInstall: boolean;
  issues: string[];
  checks: Record<string, boolean>;
}> => {
  const issues: string[] = [];
  const checks = {
    isHTTPS: false,
    hasManifest: false,
    hasServiceWorker: false,
    hasValidIcons: false,
    hasStartUrl: false,
    hasName: false,
    hasDisplay: false
  };

  try {
    // 1. Verificar HTTPS
    checks.isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!checks.isHTTPS) {
      issues.push('PWA requires HTTPS or localhost');
    }

    // 2. Verificar manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    checks.hasManifest = !!manifestLink;
    
    if (manifestLink) {
      try {
        const manifestResponse = await fetch(manifestLink.href);
        const manifest = await manifestResponse.json();
        
        // Verificar propriedades obrigatórias do manifest
        checks.hasName = !!(manifest.name || manifest.short_name);
        checks.hasStartUrl = !!manifest.start_url;
        checks.hasDisplay = !!manifest.display;
        checks.hasValidIcons = manifest.icons && manifest.icons.some((icon: any) => 
          icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
        );

        if (!checks.hasName) issues.push('Manifest missing name or short_name');
        if (!checks.hasStartUrl) issues.push('Manifest missing start_url');
        if (!checks.hasDisplay) issues.push('Manifest missing display mode');
        if (!checks.hasValidIcons) issues.push('Manifest missing valid icons (192x192 or 512x512)');
        
      } catch (error) {
        issues.push('Failed to load or parse manifest.json');
      }
    } else {
      issues.push('No manifest.json found');
    }

    // 3. Verificar Service Worker
    checks.hasServiceWorker = 'serviceWorker' in navigator;
    if (checks.hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          issues.push('Service Worker not registered');
        }
      } catch (error) {
        issues.push('Service Worker registration check failed');
      }
    } else {
      issues.push('Service Worker not supported');
    }

    const canInstall = Object.values(checks).every(check => check);
    
    return { canInstall, issues, checks };
    
  } catch (error) {
    console.error('[PWA] Error checking installability:', error);
    issues.push('Error during installability check');
    return { canInstall: false, issues, checks };
  }
};

export const logPWAStatus = async () => {
  console.log('[PWA] === PWA Status Check ===');
  
  const result = await checkPWAInstallability();
  
  console.log('[PWA] Can Install:', result.canInstall);
  console.log('[PWA] Checks:', result.checks);
  
  if (result.issues.length > 0) {
    console.warn('[PWA] Issues found:', result.issues);
  } else {
    console.log('[PWA] All PWA requirements met!');
  }
  
  // Verificar beforeinstallprompt
  const hasPrompt = !!(window as any).deferredPrompt;
  console.log('[PWA] beforeinstallprompt available:', hasPrompt);
  
  // User agent info
  console.log('[PWA] User Agent:', navigator.userAgent);
  console.log('[PWA] Is Mobile:', /Mobi|Android/i.test(navigator.userAgent));
  
  return result;
};