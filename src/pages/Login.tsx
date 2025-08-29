import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAnalytics, setAcceptAnalytics] = useState(false);
  const { login } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Termos necessários",
        description: "Você deve aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    const success = await login(email);
    if (success) {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao Tromot Pro.",
      });
      navigate('/');
    } else {
      toast({
        title: "Erro no login",
        description: "Email não encontrado. Tente: joao@tromot.com, maria@tromot.com ou carlos@email.com",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto mb-4">
            T
          </div>
          <CardTitle className="text-2xl">TROMOT PRO</CardTitle>
          <p className="text-muted-foreground">
            Faça login com seu email ou telefone
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="seu@email.com ou telefone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={setAcceptTerms}
                />
                <label htmlFor="terms" className="text-sm">
                  Aceito os{' '}
                  <Link to="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analytics"
                  checked={acceptAnalytics}
                  onCheckedChange={setAcceptAnalytics}
                />
                <label htmlFor="analytics" className="text-sm">
                  Aceito o uso de dados para analytics (LGPD)
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Emails de teste: joao@tromot.com, maria@tromot.com, carlos@email.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}