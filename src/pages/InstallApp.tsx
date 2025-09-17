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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500/10 p-4 rounded-3xl">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-primary">TROMOT PRO Instalado!</CardTitle>
            <p className="text-muted-foreground">
              O app está pronto para usar no seu dispositivo
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {isSupported && permission !== 'granted' && (
              <div className="bg-gradient-card rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Bell className="h-5 w-5 text-tromot-red" />
                  <h4 className="font-semibold text-primary">Ativar Notificações</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Receba alertas sobre novos produtos e atualizações importantes
                </p>
                <Button 
                  onClick={handleRequestNotifications} 
                  variant="outline" 
                  className="border-tromot-red text-tromot-red hover:bg-tromot-red/5"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Permitir Notificações
                </Button>
              </div>
            )}
            
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full bg-tromot-red hover:bg-tromot-red/90 text-white font-semibold py-4 text-lg"
              size="lg"
            >
              Abrir TROMOT PRO
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <PWAInstallInstructions onClose={() => setShowInstructions(false)} />
          
          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="w-full border-tromot-red text-tromot-red hover:bg-tromot-red/5"
              size="lg"
            >
              Voltar ao TROMOT PRO
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card">
        <CardHeader className="text-center pb-4">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-tromot-red to-tromot-red/80 rounded-3xl flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary">TROMOT PRO</h1>
              <p className="text-muted-foreground">App profissional para instaladores</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-card rounded-2xl p-4 text-center border border-border/50">
                <div className="w-10 h-10 bg-tromot-red/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Download className="w-5 h-5 text-tromot-red" />
                </div>
                <h3 className="font-semibold text-sm">Acesso Offline</h3>
                <p className="text-xs text-muted-foreground mt-1">Manuais sempre disponíveis</p>
              </div>
              <div className="bg-gradient-card rounded-2xl p-4 text-center border border-border/50">
                <div className="w-10 h-10 bg-tromot-red/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5 text-tromot-red" />
                </div>
                <h3 className="font-semibold text-sm">App Nativo</h3>
                <p className="text-xs text-muted-foreground mt-1">Experiência otimizada</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <Badge variant="outline" className="text-xs bg-tromot-red/5 text-tromot-red border-tromot-red/20">
              Progressive Web App
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {(isInstallable && hasPrompt) ? (
              <Button 
                onClick={handleInstall} 
                size="lg" 
                className="w-full bg-tromot-red hover:bg-tromot-red/90 text-white font-semibold py-4 text-lg"
                disabled={installing}
              >
                {installing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Instalando TROMOT PRO...
                  </div>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Instalar TROMOT PRO Agora
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => setShowInstructions(true)} 
                size="lg" 
                className="w-full bg-tromot-red hover:bg-tromot-red/90 text-white font-semibold py-4 text-lg"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Ver Instruções de Instalação
              </Button>
            )}

            <Button 
              variant="outline" 
              size="lg" 
              className="w-full border-tromot-red text-tromot-red hover:bg-tromot-red/5"
              onClick={() => window.location.href = '/'}
            >
              Usar no Navegador
            </Button>
          </div>

          {/* Notifications */}
          {isSupported && permission === 'default' && (
            <>
              <Separator className="bg-border/50" />
              <div className="text-center space-y-3">
                <h4 className="font-medium flex items-center justify-center gap-2 text-primary">
                  <Bell className="h-4 w-4" />
                  Ativar Notificações
                </h4>
                <p className="text-sm text-muted-foreground">
                  Receba alertas sobre novos produtos e atualizações
                </p>
                <Button 
                  onClick={handleRequestNotifications}
                  variant="outline"
                  className="border-tromot-red/20 text-tromot-red hover:bg-tromot-red/5"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Permitir Notificações
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}