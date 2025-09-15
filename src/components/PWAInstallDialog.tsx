import React, { useState } from 'react';
import { X, Download, Smartphone, Chrome, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PWAInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallDialog = ({ open, onOpenChange, onInstall }: PWAInstallDialogProps) => {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await onInstall();
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const getInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    
    if (isIOS) {
      return {
        title: 'Instalar no Safari (iOS)',
        icon: <Smartphone className="w-6 h-6" />,
        steps: [
          'Toque no ícone de compartilhar (□↑) na barra inferior',
          'Selecione "Adicionar à Tela de Início"',
          'Toque em "Adicionar" para confirmar'
        ]
      };
    }
    
    if (userAgent.includes('chrome')) {
      return {
        title: 'Instalar no Chrome',
        icon: <Chrome className="w-6 h-6" />,
        steps: [
          'Toque no menu do Chrome (⋮) no canto superior direito',
          'Selecione "Instalar app" ou "Adicionar à tela inicial"',
          'Confirme tocando em "Instalar"'
        ]
      };
    }
    
    if (userAgent.includes('edge')) {
      return {
        title: 'Instalar no Edge',
        icon: <Palette className="w-6 h-6" />,
        steps: [
          'Toque no menu (...) no canto superior direito',
          'Vá em "Aplicativos"',
          'Selecione "Instalar este site como um aplicativo"'
        ]
      };
    }
    
    return {
      title: 'Instalar App',
      icon: <Download className="w-6 h-6" />,
      steps: [
        'Abra este site no Chrome ou Edge',
        'Procure pela opção "Instalar app" no menu',
        'Confirme a instalação'
      ]
    };
  };

  const instructions = getInstructions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                {instructions.icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {instructions.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  TROMOT PRO - Acesso rápido aos manuais
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Como instalar:</h4>
            <ol className="text-sm text-muted-foreground space-y-2">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Benefícios do app:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Acesso offline aos manuais</li>
              <li>• Notificações de novos produtos</li>
              <li>• Experiência mais rápida e fluida</li>
              <li>• Ícone na tela inicial do seu dispositivo</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleInstall} disabled={isInstalling} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              {isInstalling ? 'Instalando...' : 'Tentar Instalar'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Se não conseguir instalar, siga as instruções acima ou use o app diretamente no navegador
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};