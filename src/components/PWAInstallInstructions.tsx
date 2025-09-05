import React from 'react';
import { Smartphone, Share, Plus, Download, Chrome, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PWAInstallInstructionsProps {
  onClose?: () => void;
}

export function PWAInstallInstructions({ onClose }: PWAInstallInstructionsProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);

  const getInstructions = () => {
    if (isIOS) {
      return {
        title: "Instalar no iOS (Safari)",
        icon: <Smartphone className="h-6 w-6" />,
        steps: [
          {
            icon: <Share className="h-5 w-5 text-blue-500" />,
            title: "Toque no ícone de compartilhar",
            description: "Na barra inferior do Safari"
          },
          {
            icon: <Plus className="h-5 w-5 text-green-500" />,
            title: "Selecione 'Adicionar à Tela de Início'",
            description: "Role para baixo se necessário"
          },
          {
            icon: <Smartphone className="h-5 w-5 text-primary" />,
            title: "Confirme 'Adicionar'",
            description: "O app aparecerá na sua tela inicial"
          }
        ]
      };
    } else if (isAndroid && isChrome) {
      return {
        title: "Instalar no Android (Chrome)",
        icon: <Chrome className="h-6 w-6" />,
        steps: [
          {
            icon: <Globe className="h-5 w-5 text-blue-500" />,
            title: "Toque no menu (⋮)",
            description: "No canto superior direito"
          },
          {
            icon: <Download className="h-5 w-5 text-green-500" />,
            title: "Selecione 'Instalar app'",
            description: "Ou 'Adicionar à tela inicial'"
          },
          {
            icon: <Smartphone className="h-5 w-5 text-primary" />,
            title: "Confirme a instalação",
            description: "O app será instalado como um aplicativo nativo"
          }
        ]
      };
    } else if (isEdge) {
      return {
        title: "Instalar no Edge",
        icon: <Globe className="h-6 w-6" />,
        steps: [
          {
            icon: <Globe className="h-5 w-5 text-blue-500" />,
            title: "Clique no menu (...)",
            description: "No canto superior direito"
          },
          {
            icon: <Download className="h-5 w-5 text-green-500" />,
            title: "Vá em 'Aplicativos'",
            description: "Depois 'Instalar este site como um aplicativo'"
          },
          {
            icon: <Smartphone className="h-5 w-5 text-primary" />,
            title: "Confirme a instalação",
            description: "O app será instalado no seu sistema"
          }
        ]
      };
    } else if (isFirefox) {
      return {
        title: "Firefox não suporta PWA",
        icon: <Globe className="h-6 w-6" />,
        steps: [
          {
            icon: <Chrome className="h-5 w-5 text-orange-500" />,
            title: "Use Chrome ou Edge",
            description: "Para melhor experiência de instalação"
          }
        ]
      };
    } else {
      return {
        title: "Instalar no Desktop",
        icon: <Download className="h-6 w-6" />,
        steps: [
          {
            icon: <Globe className="h-5 w-5 text-blue-500" />,
            title: "Procure o ícone de instalação",
            description: "Na barra de endereços do navegador"
          },
          {
            icon: <Download className="h-5 w-5 text-green-500" />,
            title: "Clique em 'Instalar'",
            description: "Ou use o menu do navegador"
          },
          {
            icon: <Smartphone className="h-5 w-5 text-primary" />,
            title: "Confirme a instalação",
            description: "O app será adicionado ao seu sistema"
          }
        ]
      };
    }
  };

  const instructions = getInstructions();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          {instructions.icon}
        </div>
        <CardTitle className="text-lg">{instructions.title}</CardTitle>
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {instructions.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-muted p-2 rounded-full flex-shrink-0">
              {step.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
        
        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full mt-6">
            Entendi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}