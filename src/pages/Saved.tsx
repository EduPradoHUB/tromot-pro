import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useSavedProducts } from '@/hooks/useSavedProducts';
import { SaveProductButton } from '@/components/SaveProductButton';

export default function Saved() {
  const { legacyProducts: products } = useApp();
  const { savedIds } = useSavedProducts();

  const savedProducts = useMemo(
    () => products.filter((p) => savedIds.includes(p.id)),
    [products, savedIds]
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bookmark className="h-7 w-7 text-primary" />
          Salvos
        </h1>
        <p className="text-muted-foreground">
          {savedProducts.length} produto{savedProducts.length !== 1 ? 's' : ''} salvo{savedProducts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum produto salvo</h3>
          <p className="text-muted-foreground mb-6">
            Toque no botão Salvar em qualquer produto para acessá-lo rapidamente aqui.
          </p>
          <Button asChild>
            <Link to="/manuais">Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedProducts.map((product) => (
            <Card key={product.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-[4/3] rounded-t-2xl">
                  <img
                    src={product.image_url || '/src/assets/photo-unavailable.png'}
                    alt={product.name}
                    className="w-full h-full object-contain bg-muted/30"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    <Badge variant="secondary" className="bg-background/90">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <SaveProductButton
                      productId={product.id}
                      productName={product.name}
                      variant="icon"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Código: {product.code}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{product.rating_average}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({product.rating_count})
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 mr-1" />
                      {product.compatibility.length} veículos
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/produto/${product.id}`}>Ver Produto</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}