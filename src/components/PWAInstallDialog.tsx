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
        title: 'Instalar no iPhone/iPad',
        icon: <Smartphone className="w-6 h-6 text-tromot-red" />,
        steps: [
          'Toque no ícone de compartilhamento (□↑) na barra inferior do Safari',
          'Role para baixo até encontrar "Adicionar à Tela de Início"',
          'Toque em "Adicionar à Tela de Início"',
          'Confirme tocando em "Adicionar" no canto superior direito',
          'O TROMOT PRO agora aparecerá como um app na sua tela inicial!'
        ]
      };
    }
    
    if (userAgent.includes('chrome')) {
      return {
        title: 'Instalar no Android (Chrome)',
        icon: <Chrome className="w-6 h-6 text-tromot-red" />,
        steps: [
          'Toque nos três pontos (⋮) no canto superior direito do Chrome',
          'Selecione "Adicionar à tela inicial" ou "Instalar app"',
          'Confirme tocando em "Adicionar" ou "Instalar"',
          'O TROMOT PRO será instalado como um app nativo no seu dispositivo!'
        ]
      };
    }
    
    if (userAgent.includes('edge')) {
      return {
        title: 'Instalar no Microsoft Edge',
        icon: <Palette className="w-6 h-6 text-tromot-red" />,
        steps: [
          'Clique nos três pontos (...) no canto superior direito do Edge',
          'Selecione "Apps" > "Instalar este site como um app"',
          'Clique em "Instalar" na janela que aparecer',
          'O TROMOT PRO será instalado como um aplicativo no seu computador!'
        ]
      };
    }
    
    return {
      title: 'Instalar no seu navegador',
      icon: <Download className="w-6 h-6 text-tromot-red" />,
      steps: [
        'Procure pelo ícone de instalação (⬇️) na barra de endereços do seu navegador',
        'Clique no ícone de instalação quando aparecer',
        'Confirme clicando em "Instalar" na janela que abrir',
        'Se não aparecer o ícone, tente usando o Chrome ou Edge para uma melhor experiência'
      ]
    };
  };

  const instructions = getInstructions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-tromot-red to-tromot-red/80 rounded-2xl">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-primary">
                Instalar TROMOT PRO
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Transforme seu navegador em um app nativo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefícios */}
          <div className="bg-gradient-card rounded-2xl p-4 border border-border/50">
            <h4 className="font-semibold mb-3 text-primary">Por que instalar?</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tromot-red rounded-full"></div>
                <span>Acesso offline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tromot-red rounded-full"></div>
                <span>Mais velocidade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tromot-red rounded-full"></div>
                <span>Notificações push</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tromot-red rounded-full"></div>
                <span>Ícone na tela inicial</span>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {instructions.icon}
              <h3 className="font-semibold text-lg">{instructions.title}</h3>
            </div>
            
            <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-tromot-red text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleInstall} 
              className="flex-1 bg-tromot-red hover:bg-tromot-red/90" 
              size="lg"
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>Instalando...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Tentar Instalação Automática
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
              Fechar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Se a instalação automática não funcionar, siga as instruções acima para instalar manualmente
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};