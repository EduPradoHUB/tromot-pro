import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface PWAInstallButtonSimpleProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function PWAInstallButtonSimple({ 
  children, 
  className, 
  variant = "outline", 
  size = "lg",
  showIcon = true 
}: PWAInstallButtonSimpleProps) {
  
  const handleClick = () => {
    // Simple fallback - redirect to install page or show basic instructions
    console.log('[PWA] Install button clicked - redirecting to install page');
    window.location.href = '/instalar';
  };

  return (
    <Button 
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && <Smartphone className="mr-2 h-4 w-4" />}
      {children || 'Instalar App'}
    </Button>
  );
}