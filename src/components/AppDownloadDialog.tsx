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
    
    // Tentar instalação direta primeiro
    if (isInstallable && hasPrompt && !isInIframe()) {
      console.log('[PWA Dialog] Attempting direct installation');
      const success = await installApp();
      if (success) {
        console.log('[PWA Dialog] Direct installation successful');
        onOpenChange(false);
        return;
      }
    }
    
    // Se não conseguiu instalar diretamente, mostrar instruções específicas do browser
    const userAgent = navigator.userAgent;
    let message = '';
    
    if (userAgent.includes('Chrome')) {
      message = 'Para instalar:\n1. Clique no menu (⋮) do Chrome\n2. Selecione "Instalar app"';
    } else if (userAgent.includes('Edge')) {
      message = 'Para instalar:\n1. Clique no menu (...) do Edge\n2. Selecione "Instalar este site como app"';
    } else if (userAgent.includes('Firefox')) {
      message = 'O Firefox não suporta instalação de PWA.\nUse Chrome ou Edge para instalar o app.';
    } else if (isIOS()) {
      // Manter o dialog aberto para iOS
      return;
    } else {
      message = 'Procure pela opção "Instalar app" no menu do seu navegador.';
    }
    
    alert(message);
    onOpenChange(false);
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