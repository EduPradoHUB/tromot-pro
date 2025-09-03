import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, CheckCircle, X, Loader2 } from 'lucide-react';
import { IOSInstallInstructions } from '@/components/IOSInstallInstructions';
import { isIOS, logPWADiagnostics } from '@/lib/pwaUtils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstalarApp() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(`[Install Page] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Página de instalação carregada');
    logPWADiagnostics();

    // Verificar se já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        addLog('App já está instalado');
        setIsInstalled(true);
        setIsWaiting(false);
        return;
      }
    };

    checkInstalled();

    // Forçar atualização do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          addLog('Atualizando Service Worker...');
          registration.update().then(() => {
            addLog('Service Worker atualizado');
          });
        }
      });
    }

    // Listener para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      addLog('beforeinstallprompt recebido!');
      setInstallPrompt(event);
      setIsWaiting(false);
      
      // Tentar instalação automática imediatamente
      setTimeout(() => {
        if (!installAttempted) {
          addLog('Tentando instalação automática...');
          handleInstall(event);
        }
      }, 500);
    };

    // Listener para appinstalled
    const handleAppInstalled = () => {
      addLog('App instalado com sucesso!');
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsWaiting(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Timeout para parar de esperar
    const timeout = setTimeout(() => {
      if (!installPrompt && !isInstalled) {
        addLog('Timeout atingido - beforeinstallprompt não foi disparado');
        setIsWaiting(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstall = async (prompt?: BeforeInstallPromptEvent) => {
    const promptToUse = prompt || installPrompt;
    if (!promptToUse) {
      addLog('Nenhum prompt de instalação disponível');
      return;
    }

    setInstallAttempted(true);
    
    try {
      addLog('Chamando prompt.prompt()...');
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      
      addLog(`Escolha do usuário: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        addLog('Usuário aceitou a instalação');
        setIsInstalled(true);
      } else {
        addLog('Usuário recusou a instalação');
      }
      
      setInstallPrompt(null);
    } catch (error) {
      addLog(`Erro na instalação: ${error}`);
      console.error('[Install Page] Erro:', error);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-green-600 dark:text-green-400">App Instalado!</CardTitle>
            <CardDescription>
              O TROMOT PRO foi instalado com sucesso na sua tela inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Instalar TROMOT PRO</CardTitle>
          <CardDescription>
            Instale o app para acesso offline e melhor experiência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isWaiting ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Preparando instalação...
              </p>
            </div>
          ) : (
            <>
              {installPrompt && !isIOS() ? (
                <Button onClick={() => handleInstall()} className="w-full" size="lg">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Instalar Agora
                </Button>
              ) : isIOS() ? (
                <IOSInstallInstructions />
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Este navegador não suporta instalação automática.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Procure pela opção "Adicionar à tela inicial" no menu do seu navegador.
                  </p>
                </div>
              )}
            </>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </div>

          {/* Debug logs - apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Logs de debug
              </summary>
              <div className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}