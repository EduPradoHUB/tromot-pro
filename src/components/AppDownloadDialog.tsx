import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, CheckCircle, ExternalLink } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { IOSInstallInstructions } from './IOSInstallInstructions';
import { isInIframe, getInstallInstructions, isIOS } from '@/lib/pwaUtils';

interface AppDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppDownloadDialog({ open, onOpenChange }: AppDownloadDialogProps) {
  const { isInstallable, isInstalled, hasPrompt, installApp } = usePWA();

  const handleInstallClick = async () => {
    console.log('[PWA Dialog] Install button clicked', { 
      isInstallable, 
      hasPrompt, 
      isInIframe: isInIframe(),
      userAgent: navigator.userAgent,
      standalone: window.matchMedia('(display-mode: standalone)').matches
    });
    
    // Se não estamos em iframe e temos o prompt, instalar diretamente
    if (!isInIframe() && isInstallable && hasPrompt) {
      console.log('[PWA Dialog] Attempting direct installation');
      const success = await installApp();
      if (success) {
        console.log('[PWA Dialog] Direct installation successful');
        onOpenChange(false);
        return;
      }
    }
    
    // Abrir página dedicada de instalação
    console.log('[PWA Dialog] Opening dedicated install page');
    const url = `${window.location.origin}/instalar`;
    const newWindow = window.open(url, '_blank', 'width=500,height=700,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      console.log('[PWA Dialog] Install page opened successfully');
      onOpenChange(false);
    } else {
      console.log('[PWA Dialog] Failed to open install page');
      // Fallback apenas para iOS
      if (isIOS()) {
        // Manter o dialog aberto para mostrar instruções iOS
        return;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-left">Baixe o App TROMOT PRO</DialogTitle>
              <DialogDescription className="text-left mt-1">
                Acesso offline aos manuais e notificações
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Vantagens do App:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Acesso offline aos manuais</li>
              <li>• Notificações sobre novos produtos</li>
              <li>• Experiência mais rápida</li>
              <li>• Escaneamento de código de barras</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">App já instalado!</span>
              </div>
            ) : (
              <>
                <Button onClick={handleInstallClick} className="w-full" size="lg">
                  <Smartphone className="mr-2 h-5 w-5" />
                  {isInIframe() ? (
                    <>
                      Instale Agora!
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Instale Agora!'
                  )}
                </Button>
                
                {isIOS() && !isInstallable && (
                  <IOSInstallInstructions />
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  {isInIframe() ? 'Abrirá em nova aba para instalação' : 'Clique para instalar o app'}
                </p>
              </>
            )}
            
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
              Talvez mais tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}