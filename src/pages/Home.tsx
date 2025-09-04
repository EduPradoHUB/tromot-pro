import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Star, Eye, Download, Smartphone, ScanLine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useApp } from '@/contexts/AppContext';
import { brands } from '@/lib/data';
import AdSlot from '@/components/AdSlot';
import { usePWA } from '@/hooks/usePWA';
import { BarcodeScannerDialog } from '@/components/BarcodeScannerDialog';
import { AppDownloadDialog } from '@/components/AppDownloadDialog';
import { EditableContent } from '@/components/EditableContent';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  const {
    banners,
    legacyProducts: products,
    vehicles,
    trackEvent,
    findProductByBarcode,
    getEditableContent,
    editableContent
  } = useApp();
  const {
    isInstallable,
    isInstalled,
    installApp
  } = usePWA();
  const navigate = useNavigate();
  const [searchBrand, setSearchBrand] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showAppDownload, setShowAppDownload] = useState(false);
  const [heroContent, setHeroContent] = useState({
    title: 'Soluções Eletrônicas',
    subtitle: 'para Instaladores',
    description: 'Acesse manuais, compartilhe instalações e encontre suporte técnico especializado.'
  });

  const [featuresContent, setFeaturesContent] = useState({
    title: 'Por que usar o TROMOT Pro?',
    description: 'Desenvolvido especialmente para instaladores e técnicos, oferecendo tudo que você precisa em um só lugar.'
  });

  // Show app download popup after 3 seconds if not installed
  React.useEffect(() => {
    if (!isInstalled) {
      const timer = setTimeout(() => {
        setShowAppDownload(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  // Plugin autoplay para carrossel
  const autoplayPlugin = useCallback(() => Autoplay({
    delay: 2000,
    stopOnInteraction: true
  }), []);
  
  const availableModels = searchBrand ? vehicles.filter(v => v.brand === searchBrand).map(v => v.model) : [];
  const availableYears = searchBrand && searchModel ? vehicles.find(v => v.brand === searchBrand && v.model === searchModel)?.years || [] : [];
  
  const handleQuickSearch = () => {
    if (searchBrand || searchModel || searchYear) {
      // Navigate to catalog with filters
      window.location.href = `/manuais?brand=${searchBrand}&model=${searchModel}&year=${searchYear}`;
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
  
  return <div>
      {/* Hero Section with Banner */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative container md:py-32 py-[10px]">
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
                {isInstallable && !isInstalled && <Button size="lg" variant="outline" className="border-white hover:bg-white hover:text-primary text-white" onClick={installApp}>
                    <Smartphone className="mr-2 h-5 w-5" />
                    Instalar App
                  </Button>}
              </div>
            </div>

            {/* Featured Banner */}
            {banners.length > 0 && <div className="lg:flex justify-center hidden">
                <AdSlot slot="home_hero" className="w-80" />
              </div>}
          </div>
        </div>
      </section>

      {/* Admin Banners Section */}
      {banners.length > 0 && <section className="sm:container px-0">
          {banners.length === 1 ? <div className="flex justify-center">
              <div className="aspect-[4/5] w-full max-w-sm sm:max-w-md overflow-hidden shadow-card">
                <img src={banners[0].image_url} alt={banners[0].title} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => banners[0].link_url && window.open(banners[0].link_url, '_blank')} />
              </div>
            </div> : <Carousel className="w-full max-w-4xl mx-auto" plugins={[autoplayPlugin()]}>
               <CarouselContent className="-ml-1 sm:-ml-2 md:-ml-4">
                 {banners.map(banner => <CarouselItem key={banner.id} className="pl-1 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                     <div className="aspect-[4/5] overflow-hidden shadow-card">
                       <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => banner.link_url && window.open(banner.link_url, '_blank')} />
                     </div>
                   </CarouselItem>)}
               </CarouselContent>
               <CarouselPrevious className="hidden sm:flex" />
               <CarouselNext className="hidden sm:flex" />
             </Carousel>}
         </section>}

      {/* Quick Search */}
      <section className="container mt-12">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Busca Rápida por Veículo</h2>
              <p className="text-muted-foreground">
                Encontre produtos compatíveis com seu veículo
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <Select value={searchBrand} onValueChange={setSearchBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  {brands.filter(b => b !== 'Todos').map(brand => <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={searchModel} onValueChange={setSearchModel} disabled={!searchBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  {availableModels.map(model => <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={searchYear} onValueChange={setSearchYear} disabled={!searchModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  {availableYears.map(year => <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Button onClick={handleQuickSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

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
            {latestProducts.map(product => <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] relative overflow-hidden rounded-t-2xl">
                      <img src={product.image_url || '/src/assets/photo-unavailable.png'} alt={product.name} className="w-full h-full object-cover" />
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
              </CarouselItem>)}
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
              <h3 className="font-semibold mb-2">Manuais Sempre Disponíveis</h3>
              <p className="text-sm text-muted-foreground">
                Acesse manuais de instalação em PDF ou imagem, sempre atualizados e organizados por produto.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Rede Colaborativa</h3>
              <p className="text-sm text-muted-foreground">
                Compartilhe suas instalações, veja o trabalho de outros técnicos e aprenda com a comunidade.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Busca Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Encontre produtos compatíveis com qualquer veículo de forma rápida e precisa.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner} onBarcodeDetected={handleBarcodeDetected} />
      
      {/* App Download Dialog */}
      <AppDownloadDialog open={showAppDownload} onOpenChange={setShowAppDownload} />
    </div>;
}