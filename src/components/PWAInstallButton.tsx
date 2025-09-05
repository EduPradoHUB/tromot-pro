import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { isInIframe, isIOS } from '@/lib/pwaUtils';

interface PWAInstallButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PWAInstallButton({ 
  children, 
  className, 
  variant = "outline", 
  size = "lg" 
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, hasPrompt, installApp } = usePWA();

  // Não mostrar botão se já está instalado ou se é iOS
  if (isInstalled || isIOS()) {
    return null;
  }

  const handleClick = async () => {
    console.log('[PWAInstallButton] Install button clicked', { 
      isInstallable, 
      hasPrompt, 
      isInIframe: isInIframe(),
      standalone: window.matchMedia('(display-mode: standalone)').matches 
    });
    
    // Se estiver em iframe, abrir em nova aba
    if (isInIframe()) {
      console.log('[PWAInstallButton] In iframe, opening new tab');
      window.open('/instalar?install=1', '_blank');
      return;
    }
    
    // Tentar instalação direta se possível
    if (isInstallable && hasPrompt) {
      console.log('[PWAInstallButton] Attempting direct installation');
      const success = await installApp();
      if (success) {
        console.log('[PWAInstallButton] Installation successful');
        return;
      }
    }
    
    // Abrir página de instalação como fallback
    console.log('[PWAInstallButton] Opening install page as fallback');
    window.open('/instalar?install=1', '_blank');
  };

  return (
    <Button 
      size={size} 
      variant={variant} 
      className={className}
      onClick={handleClick}
    >
      <Smartphone className="mr-2 h-5 w-5" />
      {children || 'Instalar App'}
    </Button>
  );
}