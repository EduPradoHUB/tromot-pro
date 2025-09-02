import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Package, User, LogOut, Menu, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const {
    profile,
    logout
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const isActive = (path: string) => location.pathname === path;
  const navigationItems = [{
    name: 'Home',
    path: '/',
    icon: Home
  }, {
    name: 'Manuais',
    path: '/manuais',
    icon: Search
  }, ...(profile?.role === 'ADM' ? [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: BarChart3
  }, {
    name: 'Admin',
    path: '/admin',
    icon: Package
  }, {
    name: 'Mídia',
    path: '/midia',
    icon: Package
  }, {
    name: 'Usuários',
    path: '/usuarios',
    icon: User
  }] : [])];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" alt="Tromot Logo" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map(item => <Link key={item.path} to={item.path} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>)}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {profile ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                      <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border shadow-lg" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                  {profile?.role === 'ADM' && <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/midia" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Dashboard de Mídia</span>
                        </Link>
                      </DropdownMenuItem>
                    </>}
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button asChild>
                <Link to="/login">Entrar</Link>
              </Button>}

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background border shadow-lg" align="end">
                {navigationItems.map(item => <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-0">
        <div className="container py-[20px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                <img src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" alt="Tromot Logo" className="h-12 w-auto object-contain mb-2" />
              </div>
              <p className="text-sm text-muted-foreground">
                App para instaladores e técnicos de produtos eletrônicos automotivos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="tel:+5516993032002" className="hover:text-foreground">
                    (16) 99303-2002
                  </a>
                </li>
                <li>
                  <a href="mailto:suporte@tromot.com" className="hover:text-foreground">
                    suporte@tromot.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/termos" className="hover:text-foreground">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/privacidade" className="hover:text-foreground">
                    Política de Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Tromot Indústria Eletrônica. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>;
};