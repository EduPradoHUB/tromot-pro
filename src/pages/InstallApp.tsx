import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Smartphone, Download, Bell } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';
import { PWAInstallInstructions } from '@/components/PWAInstallInstructions';
import { toast } from '@/hooks/use-toast';

export default function InstallApp() {
  const { isInstallable, isInstalled, hasPrompt, installApp } = usePWA();
  const { permission, isSupported, requestPermission, showNotification } = useNotifications();
  const [installing, setInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check if already installed
  useEffect(() => {
    if (isInstalled) {
      toast({
        title: "App já instalado!",
        description: "O TROMOT PRO já está instalado no seu dispositivo.",
      });
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!isInstallable || !hasPrompt) {
      setShowInstructions(true);
      return;
    }

    setInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast({
          title: "Instalação concluída!",
          description: "TROMOT PRO foi instalado com sucesso.",
        });
      } else {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Installation error:', error);
      setShowInstructions(true);
    } finally {
      setInstalling(false);
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá atualizações importantes do TROMOT PRO.",
      });
      
      // Show a test notification
      setTimeout(() => {
        showNotification('Bem-vindo ao TROMOT PRO!', {
          body: 'Agora você receberá notificações sobre novos produtos e atualizações.',
        });
      }, 1000);
    } else {
      toast({
        title: "Notificações negadas",
        description: "Você pode ativar as notificações nas configurações do navegador.",
        variant: "destructive"
      });
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl">App Instalado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              O TROMOT PRO já está instalado no seu dispositivo.
            </p>
            
            {isSupported && permission !== 'granted' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4" />
                    Ativar Notificações
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre novos produtos e atualizações
                  </p>
                  <Button onClick={handleRequestNotifications} variant="outline" size="sm">
                    Ativar Notificações
                  </Button>
                </div>
              </>
            )}
            
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Abrir App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <PWAInstallInstructions onClose={() => setShowInstructions(false)} />
          
          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="w-full"
            >
              Voltar ao App
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Instalar TROMOT PRO</CardTitle>
          <div className="flex justify-center">
            <Badge variant="outline" className="text-xs">
              Progressive Web App
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Instale o TROMOT PRO no seu dispositivo para uma experiência completa e acesso offline.
            </p>
          </div>

          {/* Installation Features */}
          <div className="space-y-3">
            <h4 className="font-medium">Por que instalar?</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Acesso rápido na tela inicial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Notificações de atualizações</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Experiência nativa</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Installation Button */}
          <div className="space-y-3">
            {isInstallable && hasPrompt ? (
              <Button 
                onClick={handleInstall} 
                disabled={installing}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                {installing ? 'Instalando...' : 'Instalar Agora'}
              </Button>
            ) : (
              <Button 
                onClick={() => setShowInstructions(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Ver Instruções
              </Button>
            )}
            
            {/* Notifications */}
            {isSupported && permission === 'default' && (
              <Button 
                onClick={handleRequestNotifications}
                variant="outline"
                className="w-full"
              >
                <Bell className="mr-2 h-4 w-4" />
                Ativar Notificações
              </Button>
            )}
          </div>

          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="ghost"
              size="sm"
            >
              Usar no navegador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}