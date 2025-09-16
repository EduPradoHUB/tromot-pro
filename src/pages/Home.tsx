import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Star, Eye, Download, Smartphone, ScanLine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useApp } from '@/contexts/AppContext';
import AdSlot from '@/components/AdSlot';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { BarcodeScannerDialog } from '@/components/BarcodeScannerDialog';
import { EditableContent } from '@/components/EditableContent';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  console.log('🏠 Renderizando componente Home...');
  console.log('🔍 Verificando useApp...', typeof useApp);
  
  const appContext = useApp();
  console.log('✅ useApp funcionando!', appContext);
  
  const {
    banners,
    legacyProducts: products,
    trackEvent,
    findProductByBarcode,
    getEditableContent,
    editableContent
  } = appContext;
  
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);
  
  const [heroContent, setHeroContent] = React.useState({
    title: 'Soluções Eletrônicas',
    subtitle: 'para Instaladores',
    description: 'Acesse manuais, compartilhe instalações e encontre suporte técnico especializado.'
  });

  const [featuresContent, setFeaturesContent] = React.useState({
    title: 'Por que usar o TROMOT Pro?',
    description: 'Desenvolvido especialmente para instaladores e técnicos, oferecendo tudo que você precisa em um só lugar.'
  });

  const [featureCard1, setFeatureCard1] = React.useState({
    title: 'Manuais Sempre Disponíveis',
    description: 'Acesse manuais de instalação em PDF ou imagem, sempre atualizados e organizados por produto.'
  });

  const [featureCard2, setFeatureCard2] = React.useState({
    title: 'Rede Colaborativa', 
    description: 'Compartilhe suas instalações, veja o trabalho de outros técnicos e aprenda com a comunidade.'
  });

  const [featureCard3, setFeatureCard3] = React.useState({
    title: 'Busca Inteligente',
    description: 'Encontre qualquer produto, veículo ou categoria de forma rápida e precisa em todo o app.'
  });

  const [quickSearchContent, setQuickSearchContent] = React.useState({
    title: 'Busca Geral',
    description: 'Pesquise produtos, veículos e categorias em todo o app'
  });

  // Plugin autoplay para carrossel
  const autoplayPlugin = React.useCallback(() => Autoplay({
    delay: 2000,
    stopOnInteraction: true
  }), []);
  
  const handleQuickSearch = () => {
    if (globalSearch.trim()) {
      // Navigate to catalog with search query
      navigate(`/manuais?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };
  
  const handleProductView = (productId: string) => {
    trackEvent({
      type: 'view_product',
      product_id: productId
    });
  };
  
  const handleBarcodeDetected = async (barcode: string) => {
    const product = await findProductByBarcode(barcode);
    if (product) {
      navigate(`/produto/${product.id}`);
      toast({
        title: "Produto encontrado!",
        description: `Navegando para ${product.name}`
      });
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Nenhum produto encontrado com o código ${barcode}`,
        variant: "destructive"
      });
    }
  };
  
  const latestProducts = products.slice(0, 6);

  // Update hero content when editable content changes
  React.useEffect(() => {
    const content = getEditableContent('hero');
    if (content) {
      setHeroContent({
        title: content.title || 'Soluções Eletrônicas',
        subtitle: content.subtitle || 'para Instaladores',
        description: content.description || 'Acesse manuais, compartilhe instalações e encontre suporte técnico especializado.'
      });
    }
  }, [getEditableContent, editableContent]);

  // Update features content when editable content changes
  React.useEffect(() => {
    const content = getEditableContent('features');
    if (content) {
      setFeaturesContent({
        title: content.title || 'Por que usar o TROMOT Pro?',
        description: content.description || 'Desenvolvido especialmente para instaladores e técnicos, oferecendo tudo que você precisa em um só lugar.'
      });
    }
  }, [getEditableContent, editableContent]);

  // Update feature cards content when editable content changes
  React.useEffect(() => {
    const content1 = getEditableContent('feature-card-1');
    if (content1) {
      setFeatureCard1({
        title: content1.title || 'Manuais Sempre Disponíveis',
        description: content1.description || 'Acesse manuais de instalação em PDF ou imagem, sempre atualizados e organizados por produto.'
      });
    }

    const content2 = getEditableContent('feature-card-2');
    if (content2) {
      setFeatureCard2({
        title: content2.title || 'Rede Colaborativa',
        description: content2.description || 'Compartilhe suas instalações, veja o trabalho de outros técnicos e aprenda com a comunidade.'
      });
    }

    const content3 = getEditableContent('feature-card-3');
    if (content3) {
      setFeatureCard3({
        title: content3.title || 'Busca Inteligente',
        description: content3.description || 'Encontre qualquer produto, veículo ou categoria de forma rápida e precisa em todo o app.'
      });
    }
  }, [getEditableContent, editableContent]);

  // Update quick search content when editable content changes
  React.useEffect(() => {
    const content = getEditableContent('quick-search');
    if (content) {
      setQuickSearchContent({
        title: content.title || 'Busca Geral',
        description: content.description || 'Pesquise produtos, veículos e categorias em todo o app'
      });
    }
  }, [getEditableContent, editableContent]);
  
  return (
    <div>
      {/* Hero Section with Banner */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative container py-[10px]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <EditableContent
                section="hero"
                title={heroContent.title}
                subtitle={heroContent.subtitle}
                description={heroContent.description}
                titleClassName="text-4xl md:text-6xl font-bold leading-tight"
                subtitleClassName="block text-primary"
                descriptionClassName="text-xl text-white/90 max-w-md"
                onContentUpdate={(content) => setHeroContent({
                  title: content.title || heroContent.title,
                  subtitle: content.subtitle || heroContent.subtitle,
                  description: content.description || heroContent.description
                })}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => setShowBarcodeScanner(true)}>
                  <ScanLine className="mr-2 h-5 w-5" />
                  Escanear Código de Barras
                </Button>
                <PWAInstallButton 
                  className="border-white hover:bg-white text-primary hover:text-primary"
                >
                  Instalar App
                </PWAInstallButton>
              </div>
            </div>

            {/* Featured Banner */}
            {banners.length > 0 && (
              <div className="lg:flex justify-center hidden">
                <AdSlot slot="home_hero" className="w-80" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Admin Banners Section */}
      {banners.length > 0 && (
        <section className="sm:container px-0">
          {banners.length === 1 ? (
            <div className="flex justify-center">
              <div className="aspect-[4/5] w-full max-w-sm sm:max-w-md overflow-hidden shadow-card">
                <img 
                  src={banners[0].image_url} 
                  alt={banners[0].title} 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => banners[0].link_url && window.open(banners[0].link_url, '_blank')} 
                />
              </div>
            </div>
          ) : (
            <Carousel className="w-full max-w-4xl mx-auto" plugins={[autoplayPlugin()]}>
              <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
                {banners.map(banner => (
                  <CarouselItem key={banner.id} className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <div className="aspect-[4/5] overflow-hidden shadow-card">
                      <img 
                        src={banner.image_url} 
                        alt={banner.title} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                        onClick={() => banner.link_url && window.open(banner.link_url, '_blank')} 
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          )}
        </section>
      )}

      {/* Quick Search */}
      {getEditableContent('quick-search')?.visible !== false && (
        <section className="container mt-12">
          <Card className="shadow-card">
            <CardContent className="p-6">
            <div className="text-center mb-6">
              <EditableContent
                section="quick-search"
                title={quickSearchContent.title}
                description={quickSearchContent.description}
                titleClassName="text-2xl font-bold mb-2"
                descriptionClassName="text-muted-foreground"
                onContentUpdate={(content) => setQuickSearchContent({
                  title: content.title || quickSearchContent.title,
                  description: content.description || quickSearchContent.description
                })}
              />
            </div>
            
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Digite sua pesquisa: produtos, veículos, categorias..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickSearch();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleQuickSearch} disabled={!globalSearch.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      )}

      {/* Latest Products Carousel */}
      <section className="container mt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Produtos</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/manuais">
              Ver Todos
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {latestProducts.map(product => (
              <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] relative overflow-hidden rounded-t-2xl">
                      <img 
                        src={product.image_url || '/src/assets/photo-unavailable.png'} 
                        alt={product.name} 
                        className="w-full h-full object-contain bg-muted/30" 
                      />
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-background/90">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Código: {product.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">
                            {product.rating_average}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            ({product.rating_count})
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          {product.compatibility.length}
                        </div>
                      </div>

                      <Button className="w-full" asChild onClick={() => handleProductView(product.id)}>
                        <Link to={`/produto/${product.id}`}>
                          Ver Produto
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      {/* Features */}
      <section className="container py-[16px] mt-12">
        <div className="text-center mb-12">
          <EditableContent
            section="features"
            title={featuresContent.title}
            description={featuresContent.description}
            titleClassName="text-3xl font-bold mb-4"
            descriptionClassName="text-muted-foreground max-w-2xl mx-auto"
            onContentUpdate={(content) => setFeaturesContent({
              title: content.title || featuresContent.title,
              description: content.description || featuresContent.description
            })}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <EditableContent
                section="feature-card-1"
                title={featureCard1.title}
                description={featureCard1.description}
                titleClassName="font-semibold mb-2"
                descriptionClassName="text-sm text-muted-foreground"
                onContentUpdate={(content) => setFeatureCard1({
                  title: content.title || featureCard1.title,
                  description: content.description || featureCard1.description
                })}
              />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <EditableContent
                section="feature-card-2"
                title={featureCard2.title}
                description={featureCard2.description}
                titleClassName="font-semibold mb-2"
                descriptionClassName="text-sm text-muted-foreground"
                onContentUpdate={(content) => setFeatureCard2({
                  title: content.title || featureCard2.title,
                  description: content.description || featureCard2.description
                })}
              />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <EditableContent
                section="feature-card-3"
                title={featureCard3.title}
                description={featureCard3.description}
                titleClassName="font-semibold mb-2"
                descriptionClassName="text-sm text-muted-foreground"
                onContentUpdate={(content) => setFeatureCard3({
                  title: content.title || featureCard3.title,
                  description: content.description || featureCard3.description
                })}
              />
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </div>
  );
}