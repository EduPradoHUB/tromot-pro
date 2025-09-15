import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
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

    // Mostrar o prompt após 2 segundos conforme solicitado - SEM CONDIÇÕES RESTRITIVAS
    console.log('[InstallPrompt] Iniciando timer de 2 segundos para prompt de instalação');
    const timer = setTimeout(() => {
      console.log('[InstallPrompt] ⏰ 2 segundos passaram - verificando condições de exibição');
      console.log('[InstallPrompt] 📱 isInstalled:', isInstalled);
      console.log('[InstallPrompt] ⚡ isInstallable:', isInstallable);
      
      // Remover condições restritivas - mostrar sempre que não estiver instalado
      if (!isInstalled) {
        console.log('[InstallPrompt] ✅ Exibindo prompt de instalação (sem condições restritivas)');
        setShowPrompt(true);
      } else {
        console.log('[InstallPrompt] ❌ App já instalado - não exibindo prompt');
      }
    }, 2000);

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
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-card rounded-2xl p-4 border border-border/50">
            <h4 className="font-semibold mb-3 text-primary">Benefícios do TROMOT PRO:</h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-tromot-red rounded-full"></div>
                Acesso offline aos manuais técnicos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-tromot-red rounded-full"></div>
                Notificações de novos produtos e atualizações
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-tromot-red rounded-full"></div>
                Interface otimizada para instaladores
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-tromot-red rounded-full"></div>
                Acesso rápido direto da tela inicial
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleInstall} className="flex-1 bg-tromot-red hover:bg-tromot-red/90" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Instalar TROMOT PRO
            </Button>
            <Button variant="outline" onClick={handleDismiss} size="lg">
              Depois
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