import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [customerType, setCustomerType] = useState<'lojista_instalador' | 'distribuidor_representante' | 'usuario_final'>('usuario_final');
  const [resetEmail, setResetEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAnalytics, setAcceptAnalytics] = useState(false);
  const { login, signUp, resetPassword, user, profile, loading } = useApp();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      navigate('/', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos para prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro de autenticação",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Verifique seu email e clique no link de confirmação.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!",
        });
        // Navigation will be handled by useEffect when user state updates
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos para prosseguir.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!city || !state) {
      toast({
        title: "Erro",
        description: "Cidade e estado são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);

    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Usuário já existe",
            description: "Este email já está cadastrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Verifique seu email para confirmação.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Link de redefinição enviado para seu email!",
        });
        setResetEmail('');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-tromot-red">
            TROMOT PRO
          </CardTitle>
          <p className="text-muted-foreground">
            Entre ou crie sua conta para continuar
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              <TabsTrigger value="reset">Redefinir</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      Aceito os termos de uso
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="analytics"
                      checked={acceptAnalytics}
                      onCheckedChange={(checked) => setAcceptAnalytics(checked === true)}
                    />
                    <label htmlFor="analytics" className="text-sm text-muted-foreground">
                      Aceito o uso de analytics
                    </label>
                  </div>
                </div>
                
                 <Button
                   type="submit"
                   className="w-full bg-tromot-red hover:bg-tromot-red/90"
                   disabled={formLoading}
                 >
                   {formLoading ? 'Entrando...' : 'Entrar'}
                 </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Input
                    type="tel"
                    placeholder="WhatsApp (opcional)"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Estado *"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Cidade *"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Qual é o seu perfil? *</Label>
                  <RadioGroup
                    value={customerType}
                    onValueChange={(value: 'lojista_instalador' | 'distribuidor_representante' | 'usuario_final') => setCustomerType(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lojista_instalador" id="lojista" />
                      <Label htmlFor="lojista">Lojista/Instalador</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="distribuidor_representante" id="distribuidor" />
                      <Label htmlFor="distribuidor">Distribuidor/Representante</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="usuario_final" id="usuario" />
                      <Label htmlFor="usuario">Usuário Final</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signup-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    />
                    <label htmlFor="signup-terms" className="text-sm text-muted-foreground">
                      Aceito os termos de uso
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signup-analytics"
                      checked={acceptAnalytics}
                      onCheckedChange={(checked) => setAcceptAnalytics(checked === true)}
                    />
                    <label htmlFor="signup-analytics" className="text-sm text-muted-foreground">
                      Aceito o uso de analytics
                    </label>
                  </div>
                </div>
                
                 <Button
                   type="submit"
                   className="w-full bg-tromot-red hover:bg-tromot-red/90"
                   disabled={formLoading}
                 >
                   {formLoading ? 'Criando conta...' : 'Criar conta'}
                 </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                 <Button
                   type="submit"
                   className="w-full bg-tromot-red hover:bg-tromot-red/90"
                   disabled={formLoading}
                 >
                   {formLoading ? 'Enviando...' : 'Enviar link de redefinição'}
                 </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}