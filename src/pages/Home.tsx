import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Star, Eye, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useApp } from '@/contexts/AppContext';
import { brands } from '@/lib/data';
import AdSlot from '@/components/AdSlot';
import { usePWA } from '@/hooks/usePWA';
export default function Home() {
  const {
    banners,
    products,
    vehicles,
    trackEvent
  } = useApp();
  
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [searchBrand, setSearchBrand] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const availableModels = searchBrand ? vehicles.filter(v => v.brand === searchBrand).map(v => v.model) : [];
  const availableYears = searchBrand && searchModel ? vehicles.find(v => v.brand === searchBrand && v.model === searchModel)?.years || [] : [];
  const handleQuickSearch = () => {
    if (searchBrand || searchModel || searchYear) {
      // Navigate to catalog with filters
      window.location.href = `/catalogo?brand=${searchBrand}&model=${searchModel}&year=${searchYear}`;
    }
  };
  const handleProductView = (productId: string) => {
    trackEvent({
      type: 'view_product',
      product_id: productId
    });
  };
  const latestProducts = products.slice(0, 6);
  return <div className="space-y-12">
      {/* Hero Section with Banner */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative container py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Soluções Eletrônicas
                <span className="block text-primary">para Instaladores</span>
              </h1>
              <p className="text-xl text-white/90 max-w-md">
                Acesse manuais, compartilhe instalações e encontre suporte técnico especializado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/catalogo">
                    Explorar Manuais
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {isInstallable && !isInstalled && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white hover:bg-white hover:text-primary text-white"
                    onClick={installApp}
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Instalar App
                  </Button>
                )}
                {!isInstallable && !isInstalled && (
                  <Button size="lg" variant="outline" className="border-white hover:bg-white hover:text-primary text-white">
                    Ver Manuais
                  </Button>
                )}
              </div>
            </div>

            {/* Featured Banner */}
            {banners.length > 0 && <div className="lg:flex justify-center hidden">
                <AdSlot slot="home_hero" className="w-80" />
              </div>}
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="container">
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
      <section className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Novidades</h2>
            <p className="text-muted-foreground">
              Últimos produtos adicionados ao catálogo
            </p>
          </div>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {latestProducts.map(product => <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] relative overflow-hidden rounded-t-2xl">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
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
                          {product.compatibility.length} veículos
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
      <section className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Por que usar o Tromot Pro?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desenvolvido especialmente para instaladores e técnicos, oferecendo tudo que você precisa em um só lugar.
          </p>
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
    </div>;
}