import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Eye, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useApp } from '@/contexts/AppContext';
import { categories, brands } from '@/lib/data';

export default function Catalog() {
  const { legacyProducts: products, vehicles, trackEvent } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todos');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Aplicar filtros da URL na inicialização
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const brandParam = urlParams.get('brand');
    const modelParam = urlParams.get('model');
    const yearParam = urlParams.get('year');
    
    if (brandParam && brandParam !== 'Todos') setSelectedBrand(brandParam);
    if (modelParam && modelParam !== 'Todos') setSelectedModel(modelParam);
    if (yearParam && yearParam !== 'Todos') setSelectedYear(yearParam);
  }, []);

  const availableModels = selectedBrand && selectedBrand !== 'Todos'
    ? [...new Set(vehicles.filter(v => v.brand === selectedBrand).map(v => v.model))]
    : [];

  const availableYears = selectedBrand && selectedModel
    ? vehicles.find(v => v.brand === selectedBrand && v.model === selectedModel)?.years || []
    : [];

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Text search
    if (localSearch) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(localSearch.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Vehicle compatibility filter
    if (selectedBrand && selectedBrand !== 'Todos') {
      filtered = filtered.filter(p =>
        p.compatibility.some(v => v.brand === selectedBrand)
      );
    }

    if (selectedModel) {
      filtered = filtered.filter(p =>
        p.compatibility.some(v => v.model === selectedModel)
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(p =>
        p.compatibility.some(v => v.years.includes(selectedYear))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating_average - a.rating_average);
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }, [products, localSearch, selectedCategory, selectedBrand, selectedModel, selectedYear, sortBy]);

  const handleProductView = (productId: string) => {
    trackEvent({ type: 'view_product', product_id: productId });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setSelectedCategory('Todos');
    setSelectedBrand('Todos');
    setSelectedModel('');
    setSelectedYear('');
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Buscar</label>
        <Input
          placeholder="Nome, código ou descrição..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Categoria</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg">
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Marca do Veículo</label>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg">
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBrand && selectedBrand !== 'Todos' && (
        <div>
          <label className="text-sm font-medium mb-2 block">Modelo</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o modelo" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="">Todos os modelos</SelectItem>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedModel && (
        <div>
          <label className="text-sm font-medium mb-2 block">Ano</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="">Todos os anos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Limpar Filtros
      </Button>
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Catálogo de Produtos</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Caixa de pesquisa principal */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produtos por nome, código ou descrição..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block w-64 space-y-6">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Filtros</h3>
              <FiltersContent />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile/Tablet Controls */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Refine sua busca pelos produtos
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Ordenar por:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="rating">Avaliação</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`shadow-card hover:shadow-lg transition-shadow ${
                  viewMode === 'list' ? 'flex-row' : ''
                }`}
              >
                <CardContent className={`p-0 ${viewMode === 'list' ? 'flex' : ''}`}>
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list'
                      ? 'w-48 h-36 flex-shrink-0'
                      : 'aspect-[4/3] rounded-t-2xl'
                  }`}>
                    <img
                      src={product.image_url || '/src/assets/photo-unavailable.png'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <Badge variant="secondary" className="bg-background/90">
                        {product.category}
                      </Badge>
                      {product.out_of_production && (
                        <Badge variant="destructive" className="bg-red-500/90 text-white">
                          Fora de produção
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Código: {product.code}
                        </p>
                        {viewMode === 'list' && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}
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

                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Compatível com:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.compatibility.slice(0, 3).map((vehicle, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                        ))}
                        {product.compatibility.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.compatibility.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      asChild
                      onClick={() => handleProductView(product.id)}
                    >
                      <Link to={`/produto/${product.id}`}>
                        Ver Produto
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou buscar por outros termos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}