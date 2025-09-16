import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Package, User, LogOut, Menu, BarChart3, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Temporarily disable Avatar to fix React hooks conflicts  
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Temporarily disable DropdownMenu to fix React hooks conflicts
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { EditableContent } from '@/components/EditableContent';
interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  console.log('🏗️ Renderizando Layout...');
  
  const {
    profile,
    logout,
    getEditableContent,
    editableContent
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Footer editable content states
  const [footerDescription, setFooterDescription] = React.useState('App para instaladores e técnicos de produtos eletrônicos automotivos.');
  const [supportTitle, setSupportTitle] = React.useState('Suporte');
  const [legalTitle, setLegalTitle] = React.useState('Legal');
  const [copyright, setCopyright] = React.useState('© 2025 Tromot Indústria Eletrônica. Todos os direitos reservados.');

  // Update footer content when editable content changes
  React.useEffect(() => {
    const descContent = getEditableContent('footer-description');
    if (descContent?.description) {
      setFooterDescription(descContent.description);
    }

    const supportContent = getEditableContent('footer-support-title');
    if (supportContent?.title) {
      setSupportTitle(supportContent.title);
    }

    const legalContent = getEditableContent('footer-legal-title');
    if (legalContent?.title) {
      setLegalTitle(legalContent.title);
    }

    const copyrightContent = getEditableContent('footer-copyright');
    if (copyrightContent?.description) {
      setCopyright(copyrightContent.description);
    }
  }, [getEditableContent, editableContent]);
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const isActive = (path: string) => location.pathname === path;
const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Manuais', path: '/manuais', icon: Search },
    ...(profile?.role === 'ADM' ? [
      { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
      { name: 'Admin', path: '/admin', icon: Package },
      { name: 'Mídia', path: '/midia', icon: Smartphone },
      { name: 'Usuários', path: '/usuarios', icon: User }
    ] : profile?.role === 'Técnico Tromot' ? [
      { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
      { name: 'Técnico', path: '/tecnico', icon: Package }
    ] : [])
  ];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between bg-stone-50">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" alt="Tromot Logo" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-bold text-primary">PRO</span>
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
            {profile ? (
              <div className="flex items-center space-x-2">
                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  {/* Simple Avatar Replacement */}
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{profile.name}</span>
                </div>
                
                {/* Quick Actions */}
                <div className="hidden md:flex items-center space-x-1">
                  {profile?.role === 'ADM' && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/midia">
                          <Smartphone className="h-4 w-4 mr-1" />
                          Mídia
                        </Link>
                      </Button>
                    </>
                  )}
                  {profile?.role === 'Técnico Tromot' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/tecnico">
                        <Package className="h-4 w-4 mr-1" />
                        Técnico
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/perfil">
                      <User className="h-4 w-4 mr-1" />
                      Perfil
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Sair
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild>
                <Link to="/login">Entrar</Link>
              </Button>
            )}

            {/* Mobile Menu Button - Simple Navigation */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/perfil">
                  <Menu className="h-5 w-5" />
                </Link>
              </Button>
            </div>
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
                <div className="flex items-center space-x-2">
                  <img src="/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png" alt="Tromot Logo" className="h-12 w-auto object-contain" />
                  <span className="text-2xl font-bold text-primary">PRO</span>
                </div>
              </div>
              <EditableContent
                section="footer-description"
                description={footerDescription}
                descriptionClassName="text-sm text-muted-foreground"
                onContentUpdate={(content) => setFooterDescription(content.description || footerDescription)}
              />
            </div>
            <div>
              <EditableContent
                section="footer-support-title"
                title={supportTitle}
                titleClassName="font-semibold mb-4"
                onContentUpdate={(content) => setSupportTitle(content.title || supportTitle)}
              />
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
              <EditableContent
                section="footer-legal-title"
                title={legalTitle}
                titleClassName="font-semibold mb-4"
                onContentUpdate={(content) => setLegalTitle(content.title || legalTitle)}
              />
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
          <EditableContent
            section="footer-copyright"
            description={copyright}
            descriptionClassName="mt-8 pt-8 border-t text-center text-sm text-muted-foreground"
            onContentUpdate={(content) => setCopyright(content.description || copyright)}
          />
        </div>
      </footer>
    </div>;
};