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
    
    // Para iOS ou quando não tem prompt, mostrar instruções
    if (isIOS) {
      alert('Para instalar no iOS:\n1. Toque no ícone de compartilhar (⬆️)\n2. Selecione "Adicionar à Tela de Início"\n3. Confirme "Adicionar"');
    } else {
      alert('Para instalar o app:\n1. No Chrome: Menu (⋮) > "Instalar app"\n2. No Edge: Menu (...) > "Aplicativos" > "Instalar este site como um aplicativo"\n3. No Firefox: Não suportado, use Chrome ou Edge');
    }
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