import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Star, 
  Heart, 
  MessageCircle,
  Share2,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Product, Post, Rating } from '@/lib/types';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, posts, ratings, currentUser, trackEvent } = useApp();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [productPosts, setProductPosts] = useState<Post[]>([]);
  const [productRatings, setProductRatings] = useState<Rating[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        setProductPosts(posts.filter(p => p.product_id === id));
        setProductRatings(ratings.filter(r => r.product_id === id));
        trackEvent({ type: 'view_product', product_id: id });
      } else {
        navigate('/catalogo');
      }
    }
  }, [id, products, posts, ratings, navigate, trackEvent]);

  const handleManualAccess = () => {
    if (product) {
      trackEvent({ type: 'view_manual', product_id: product.id });
      if (product.manual_url) {
        window.open(product.manual_url, '_blank');
      }
    }
  };

  const handleRatingSubmit = () => {
    if (!currentUser) {
      toast({
        title: "Login necessário",
        description: "Faça login para avaliar produtos.",
        variant: "destructive",
      });
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Avaliação enviada!",
      description: "Sua avaliação foi registrada com sucesso.",
    });

    setNewRating(0);
    setNewComment('');
  };

  const handlePostInstallation = () => {
    if (!currentUser) {
      toast({
        title: "Login necessário",
        description: "Faça login para postar instalações.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Em breve!",
      description: "Funcionalidade de upload de fotos será implementada em breve.",
    });
  };

  if (!product) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Produto não encontrado</h2>
          <p className="text-muted-foreground">O produto que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Header */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-96 flex-shrink-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2">{product.category}</Badge>
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        {product.name}
                      </h1>
                      <p className="text-muted-foreground mb-4">
                        Código: <span className="font-mono">{product.code}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="flex items-center mr-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= product.rating_average
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold mr-2">{product.rating_average}</span>
                    <span className="text-muted-foreground">
                      ({product.rating_count} avaliações)
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    {product.description}
                  </p>

                  {/* Compatibility */}
                  <div>
                    <h3 className="font-semibold mb-3">Compatibilidade</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.compatibility.map((vehicle, index) => (
                        <Badge key={index} variant="outline">
                          {vehicle.brand} {vehicle.model} ({vehicle.years.join(', ')})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Manual de Instalação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.manual_url ? (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center">
                    {product.manual_type === 'pdf' ? (
                      <FileText className="h-8 w-8 text-red-500 mr-3" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-green-500 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">
                        Manual - {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Formato: {product.manual_type?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleManualAccess}>
                    <Download className="mr-2 h-4 w-4" />
                    Acessar Manual
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Manual não disponível para este produto</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Section - Only show if video_url exists */}
          {product.video_url && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="mr-2 h-5 w-5" />
                  Vídeo Demonstrativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Vídeo demonstrativo disponível
                    </p>
                    <Button asChild>
                      <a href={product.video_url} target="_blank" rel="noopener noreferrer">
                        Assistir Vídeo
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Installation Posts */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Instalações da Comunidade
                </CardTitle>
                <Button onClick={handlePostInstallation}>
                  Postar Minha Instalação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productPosts.length > 0 ? (
                <div className="space-y-6">
                  {productPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{post.author_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {post.author_role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <img
                        src={post.photo_url}
                        alt="Instalação"
                        className="w-full rounded-lg mb-3"
                      />
                      <p className="mb-3">{post.caption}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <button className="flex items-center space-x-1 hover:text-foreground">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>Comentar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seja o primeiro a postar uma instalação deste produto!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating & Reviews */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Avaliar Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Sua avaliação:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          star <= newRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Escreva sua opinião sobre o produto..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleRatingSubmit} className="w-full">
                Enviar Avaliação
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Avaliações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {productRatings.length > 0 ? (
                <div className="space-y-4">
                  {productRatings.slice(0, 3).map((rating) => (
                    <div key={rating.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{rating.author_name}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rating.comment}
                      </p>
                      {rating !== productRatings[productRatings.length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma avaliação ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}