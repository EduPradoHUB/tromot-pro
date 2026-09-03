import React, { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, signUp, loginWithGoogle, resetPassword, user, profile, loading } = useApp();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
        setGoogleLoading(false);
      }
      // Em sucesso o navegador é redirecionado para o Google, então não
      // precisamos desligar o loading aqui — a página vai sair do ar.
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      navigate('/', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleLogin = async (e: FormEvent) => {
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

  const handleSignUp = async (e: FormEvent) => {
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
      const { error } = await signUp(email, password, name, customerType, whatsapp, city, state);
      
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

  const handleResetPassword = async (e: FormEvent) => {
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
            Acesso da equipe Tromot e administradores.
            <br />
            <span className="text-xs">Clientes podem usar o app sem cadastro — o cadastro é opcional para postar instalações, salvar manuais e receber notificações.</span>
          </p>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 gap-2"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
          >
            {googleLoading ? (
              'Redirecionando...'
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
                  <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.87 8.87 4.76 12 4.76Z" />
                </svg>
                Entrar com o Google
              </>
            )}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou com email</span>
            </div>
          </div>

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

          {/* Acesso livre ao app */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Não quer se cadastrar?
            </p>
            <Button
              variant="outline"
              className="w-full group border-primary border-[3px] hover:border-primary"
              asChild
            >
              <Link to="/">
                <FileText className="h-4 w-4 mr-2" />
                Acesse Sem Cadastro
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}