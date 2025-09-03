import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, CheckCircle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface AppDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppDownloadDialog({ open, onOpenChange }: AppDownloadDialogProps) {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstallInstructions = () => {
    const userAgent = navigator.userAgent;
    let instructions = "";
    
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      instructions = "No Safari: toque no ícone de compartilhar e selecione 'Adicionar à Tela de Início'";
    } else if (userAgent.includes('Android')) {
      instructions = "No Chrome: toque no menu (⋮) e selecione 'Instalar app' ou 'Adicionar à tela inicial'";
    } else {
      instructions = "No seu navegador, procure pela opção 'Instalar app' ou 'Adicionar à tela inicial' no menu";
    }
    
    alert(instructions);
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
            ) : isInstallable ? (
              <Button onClick={installApp} className="w-full" size="lg">
                <Smartphone className="mr-2 h-5 w-5" />
                Instalar App Agora
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleInstallInstructions} className="w-full">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Como instalar?
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Use o menu do seu navegador para instalar o app
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