import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { PWAInstallDialog } from './PWAInstallDialog';

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
  const [showDialog, setShowDialog] = React.useState(false);

  // Não mostrar botão se já está instalado
  if (isInstalled) {
    return null;
  }

  // Debug: sempre logar o estado para debug e facilitar troubleshooting
  console.log('[PWAInstallButton] 🔍 Estado atual:', { isInstallable, isInstalled, hasPrompt });
  console.log('[PWAInstallButton] 🌐 User Agent:', navigator.userAgent);
  console.log('[PWAInstallButton] 📱 Standalone Mode:', window.matchMedia('(display-mode: standalone)').matches);
  console.log('[PWAInstallButton] 🎯 beforeinstallprompt disponível:', !!(window as any).deferredPrompt);
  
  const handleClick = async () => {
    console.log('[PWAInstallButton] 🎯 Botão de instalação clicado');
    console.log('[PWAInstallButton] 🔍 Tentando instalação automática primeiro...');
    
    // Tentar instalação automática primeiro
    const success = await installApp();
    
    // Se não conseguiu instalar automaticamente, mostrar dialog com instruções
    if (!success) {
      console.log('[PWAInstallButton] ⚠️ Instalação automática falhou - exibindo instruções manuais');
      setShowDialog(true);
    } else {
      console.log('[PWAInstallButton] ✅ Instalação automática bem-sucedida!');
    }
  };

  return (
    <>
      <Button 
        size={size} 
        variant={variant} 
        className={`${className} transition-all duration-200 hover:scale-105`}
        onClick={handleClick}
      >
        {showIcon && <Smartphone className="mr-2 h-5 w-5" />}
        {children || 'Instalar TROMOT PRO'}
      </Button>
      
      <PWAInstallDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        onInstall={installApp}
      />
    </>
  );
}