import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Simplificado */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between bg-stone-50">
          {/* Logo */}
          <Link to="/manuais-publico" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" 
              alt="Tromot Logo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="text-2xl font-bold text-primary">PRO</span>
          </Link>

          {/* Botão de Login */}
          <Button asChild className="bg-tromot-red hover:bg-tromot-red/90">
            <Link to="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar / Cadastrar
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Simplificado */}
      <footer className="border-t bg-muted/50 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" 
                alt="Tromot Logo" 
                className="h-8 w-auto object-contain" 
              />
              <span className="text-lg font-bold text-primary">PRO</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Tromot Indústria Eletrônica. Todos os direitos reservados.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                Fazer Login Completo
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};
