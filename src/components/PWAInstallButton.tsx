import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function PWAInstallButton({ 
  children, 
  className, 
  variant = "outline", 
  size = "lg",
  showIcon = true 
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, hasPrompt, installApp } = usePWA();

  // Não mostrar botão se já está instalado
  if (isInstalled) {
    return null;
  }

  // Debug: sempre logar o estado para debug
  console.log('[PWAInstallButton] State:', { isInstallable, isInstalled, hasPrompt });

  // Detectar se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  const handleClick = async () => {
    console.log('[PWAInstallButton] Install button clicked', { 
      isInstallable, 
      hasPrompt,
      isIOS,
      userAgent: navigator.userAgent
    });
    
    // Se tem prompt nativo, usar ele
    if (isInstallable && hasPrompt && !isIOS) {
      console.log('[PWAInstallButton] Attempting direct installation');
      const success = await installApp();
      if (success) {
        console.log('[PWAInstallButton] Installation successful');
        return;
      }
    }
    
    // Sempre chamar a função installApp do hook que já tem toda a lógica
    await installApp();
  };

  return (
    <Button 
      size={size} 
      variant={variant} 
      className={className}
      onClick={handleClick}
    >
      {showIcon && <Smartphone className="mr-2 h-5 w-5" />}
      {children || 'Instalar App'}
    </Button>
  );
}