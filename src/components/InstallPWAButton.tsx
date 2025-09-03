import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from '@/hooks/use-toast';

interface InstallPWAButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function InstallPWAButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  children 
}: InstallPWAButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (isInstalled) {
      toast({
        title: "App já instalado",
        description: "O TROMOT PRO já está instalado no seu dispositivo!",
      });
      return;
    }

    if (!isInstallable) {
      // Mostrar instruções manuais
      const userAgent = navigator.userAgent;
      let instructions = "";
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        instructions = "No Safari: toque no ícone de compartilhar (⬆️) e selecione 'Adicionar à Tela de Início'";
      } else if (userAgent.includes('Android')) {
        instructions = "No Chrome: toque no menu (⋮) e selecione 'Instalar app' ou 'Adicionar à tela inicial'";
      } else {
        instructions = "No seu navegador, procure pela opção 'Instalar app' ou 'Adicionar à tela inicial' no menu";
      }
      
      toast({
        title: "Como instalar o app",
        description: instructions,
        duration: 8000,
      });
      return;
    }

    setIsInstalling(true);
    
    try {
      await installApp();
      
      toast({
        title: "App instalado com sucesso!",
        description: "O TROMOT PRO foi instalado no seu dispositivo.",
      });
    } catch (error) {
      toast({
        title: "Erro na instalação",
        description: "Não foi possível instalar o app automaticamente. Tente pelo menu do navegador.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const getButtonContent = () => {
    if (children) return children;
    
    if (isInstalled) {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          App Instalado
        </>
      );
    }
    
    if (isInstalling) {
      return (
        <>
          <Download className="mr-2 h-4 w-4 animate-bounce" />
          Instalando...
        </>
      );
    }
    
    if (isInstallable) {
      return (
        <>
          <Smartphone className="mr-2 h-4 w-4" />
          Instalar App
        </>
      );
    }
    
    return (
      <>
        <AlertCircle className="mr-2 h-4 w-4" />
        Como Instalar
      </>
    );
  };

  return (
    <Button
      variant={isInstalled ? 'secondary' : variant}
      size={size}
      className={className}
      onClick={handleInstall}
      disabled={isInstalling}
    >
      {getButtonContent()}
    </Button>
  );
}