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

// Utilitários profissionais para PWA - Versão Completa

export const logPWAStatus = async () => {
  console.group('🔧 [PWA] Status Detalhado do Progressive Web App');
  
  // Verificar Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    console.log('✅ Service Worker:', registration ? 'Registrado' : 'Não encontrado');
    if (registration) {
      console.log('   📦 Escopo:', registration.scope);
      console.log('   🔄 Estado:', registration.active?.state || 'Inativo');
    }
  } else {
    console.log('❌ Service Worker não suportado');
  }

  // Verificar Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log('📋 Manifest:', manifestLink ? 'Encontrado' : 'Não encontrado');
  if (manifestLink) {
    console.log('   🔗 URL:', (manifestLink as HTMLLinkElement).href);
  }

  // Verificar HTTPS
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  console.log('🔒 HTTPS:', isSecure ? 'Seguro' : 'Inseguro');

  // Verificar suporte a PWA
  const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window;
  console.log('🎯 Suporte PWA:', supportsPWA ? 'Completo' : 'Parcial');

  // Verificar instalação
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone === true;
  console.log('📱 App Instalado:', isStandalone ? 'Sim' : 'Não');

  // Verificar prompt disponível
  const hasPrompt = !!(window as any).deferredPrompt;
  console.log('⚡ Prompt Disponível:', hasPrompt ? 'Sim' : 'Não');

  // Informações do navegador
  console.log('🌐 Navegador:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  });

  console.groupEnd();
};

export const getInstallInstructions = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/ipad|iphone|ipod/.test(userAgent)) {
    return {
      platform: 'iOS',
      icon: '📱',
      steps: [
        'Toque no ícone de compartilhar (□↑) na barra inferior',
        'Role para baixo e toque em "Adicionar à Tela de Início"',
        'Toque em "Adicionar" para confirmar',
        'O TROMOT PRO aparecerá na sua tela inicial!'
      ]
    };
  }
  
  if (userAgent.includes('chrome')) {
    return {
      platform: 'Chrome',
      icon: '🔵',
      steps: [
        'Toque nos três pontos (⋮) no menu do Chrome',
        'Selecione "Adicionar à tela inicial" ou "Instalar app"',
        'Confirme tocando em "Adicionar" ou "Instalar"',
        'O TROMOT PRO será instalado como app nativo!'
      ]
    };
  }

  if (userAgent.includes('edge')) {
    return {
      platform: 'Edge',
      icon: '🔷',
      steps: [
        'Clique nos três pontos (...) no menu do Edge',
        'Vá em "Apps" > "Instalar este site como um app"',
        'Clique em "Instalar" na janela que aparecer',
        'O TROMOT PRO será instalado no seu sistema!'
      ]
    };
  }

  return {
    platform: 'Navegador',
    icon: '🌐',
    steps: [
      'Procure pelo ícone de instalação na barra de endereços',
      'Clique no ícone quando aparecer',
      'Confirme a instalação na janela que abrir',
      'Use o Chrome ou Edge para melhor experiência!'
    ]
  };
};

export const triggerInstallPrompt = async (): Promise<boolean> => {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.warn('🚨 [PWA] Nenhum prompt de instalação disponível');
    return false;
  }

  try {
    console.log('🚀 [PWA] Disparando prompt de instalação nativo');
    await deferredPrompt.prompt();
    
    const result = await deferredPrompt.userChoice;
    console.log('📊 [PWA] Resultado da instalação:', result.outcome);
    
    if (result.outcome === 'accepted') {
      delete (window as any).deferredPrompt;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ [PWA] Erro ao disparar prompt:', error);
    return false;
  }
};