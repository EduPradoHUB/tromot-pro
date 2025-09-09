import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePWA } from '@/hooks/usePWA';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em millisegundos

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWA();

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isInstalled) return;

    // Verificar se foi dispensado recentemente
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      const now = Date.now();
      
      // Se foi dispensado há menos de 7 dias, não mostrar
      if (now - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Mostrar o prompt após 5 segundos
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    console.log('[PWA] Install button clicked');
    const success = await installApp();
    
    // Se o prompt nativo funcionou, fechar o modal
    if (success) {
      console.log('[PWA] Native installation successful');
      setShowPrompt(false);
    } else {
      console.log('[PWA] Installation handled via manual instructions');
      // Para instruções manuais, aguardar um pouco e fechar o modal
      setTimeout(() => {
        setShowPrompt(false);
      }, 1000);
    }
  };

  const handleDismiss = () => {
    // Salvar timestamp da dispensada
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Instalar TROMOT PRO
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Acesse rapidamente seus manuais
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Benefícios do app:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Acesso offline aos manuais</li>
              <li>• Notificações de novos produtos</li>
              <li>• Experiência mais rápida</li>
              <li>• Ícone na tela inicial</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Você pode instalar o app a qualquer momento através do menu do seu navegador
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};