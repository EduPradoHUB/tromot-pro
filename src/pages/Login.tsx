
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
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAnalytics, setAcceptAnalytics] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const { login } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateAdminRole = async () => {
    if (email !== 'eduardo@tromot.com.br') {
      toast({
        title: "Acesso negado",
        description: "Esta função é apenas para o admin.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const adminToken = prompt('Digite o token de configuração do admin:');
      if (!adminToken) {
        throw new Error('Token necessário');
      }

      const response = await fetch(`https://bclktrcbwpwsxksbhqsv.supabase.co/functions/v1/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: adminToken })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar admin');
      }

      toast({
        title: "Sucesso!",
        description: result.message
      });
    } catch (error) {
      console.error('Erro ao atualizar admin:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar usuário admin.",
        variant: "destructive"
      });
    }
    setIsCreatingAdmin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Termos necessários",
        description: "Você deve aceitar os termos de uso para continuar.",
        variant: "destructive"
      });
      return;
    }

    try {
      await login(email, password);
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao Tromot Pro."
      });
      navigate('/');
    } catch (error: any) {
      console.error('Erro de login:', error);
      
      let errorMessage = "Email ou senha incorretos.";
      if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg mx-auto mb-4">
            <img src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" alt="Tromot Logo" className="h-10 w-10 object-contain" />
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
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            
            <Input 
              type="password" 
              placeholder="Sua senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={acceptTerms} onCheckedChange={checked => setAcceptTerms(checked === true)} />
                <label htmlFor="terms" className="text-sm">
                  Aceito os{' '}
                  <Link to="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="analytics" checked={acceptAnalytics} onCheckedChange={checked => setAcceptAnalytics(checked === true)} />
                <label htmlFor="analytics" className="text-sm">
                  Aceito o uso de dados para analytics (LGPD)
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          
          <div className="space-y-2 mt-4">
            <p className="text-center text-sm text-muted-foreground">
              Admin: eduardo@tromot.com.br | Senha: 123456
            </p>
            
            <p className="text-center text-xs text-muted-foreground">
              Primeiro faça login, depois clique em "Atualizar para Admin"
            </p>
            
            {email === 'eduardo@tromot.com.br' && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={updateAdminRole}
                disabled={isCreatingAdmin}
              >
                {isCreatingAdmin ? 'Atualizando para admin...' : 'Atualizar para Admin'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
