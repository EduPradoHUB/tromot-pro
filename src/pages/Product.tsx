import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Star, 
  MessageCircle,
  Camera,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { PostCard } from '@/components/PostCard';
import { RatingForm } from '@/components/RatingForm';
import { QuestionForm } from '@/components/QuestionForm';
import { PostUploadModal } from '@/components/PostUploadModal';
import { Product, Post, Rating, Question } from '@/lib/types';
import AdSlot from '@/components/AdSlot';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, posts, ratings, questions, currentUser, trackEvent, answerQuestion } = useApp();
  const [product, setProduct] = useState<any>(null);
  const [productPosts, setProductPosts] = useState<Post[]>([]);
  const [productRatings, setProductRatings] = useState<Rating[]>([]);
  const [productQuestions, setProductQuestions] = useState<Question[]>([]);
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        setProductPosts(posts.filter(p => p.product_id === id && p.status === 'approved'));
        setProductRatings(ratings.filter(r => r.product_id === id));
        setProductQuestions(questions.filter(q => q.product_id === id));
        trackEvent({ type: 'view_product', product_id: id, user_id: currentUser?.id });
      } else {
        navigate('/catalogo');
      }
    }
  }, [id, products, posts, ratings, questions, navigate, trackEvent, currentUser?.id]);

  const handleManualAccess = () => {
    if (product) {
      trackEvent({ type: 'view_manual', product_id: product.id, user_id: currentUser?.id });
      if (product.manual_url) {
        window.open(product.manual_url, '_blank');
      }
    }
  };

  const handleAnswerSubmit = (questionId: string) => {
    const answer = answerText[questionId];
    if (answer?.trim()) {
      answerQuestion(questionId, answer.trim());
      setAnswerText(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const canAnswerQuestions = currentUser?.role === 'Técnico Tromot' || currentUser?.role === 'ADM';

  if (!product) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/catalogo')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/catalogo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">Código: {product.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="space-y-4">
                  <div>
                    <Badge className="mb-2">{product.category}</Badge>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= product.rating_average
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.rating_count} avaliações)
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{product.description}</p>
                  
                  {/* Compatibility */}
                  <div>
                    <h3 className="font-medium mb-2">Compatibilidade</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.compatibility.map((vehicle) => (
                        <Badge key={vehicle.id} variant="outline">
                          {vehicle.brand} {vehicle.model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual and Video */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual */}
            {product.manual_url && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {product.manual_type === 'pdf' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                    Manual de Instalação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleManualAccess} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Acessar Manual
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Video */}
            {product.video_url && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Vídeo Demonstrativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Button variant="outline" size="lg">
                      <Play className="h-5 w-5 mr-2" />
                      Assistir Vídeo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Banner Publicitário */}
            <AdSlot 
              slot="product_banner" 
              className="mb-6"
              productId={id}
            />
          </div>

          {/* Tabs for Posts, Reviews, Questions */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">
                <Camera className="h-4 w-4 mr-2" />
                Instalações ({productPosts.length})
              </TabsTrigger>
              <TabsTrigger value="questions">
                <HelpCircle className="h-4 w-4 mr-2" />
                Dúvidas ({productQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                Avaliações ({productRatings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Instalações da Comunidade</h3>
                {currentUser && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPostModal(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Compartilhar Instalação
                  </Button>
                )}
              </div>
              {productPosts.length > 0 ? (
                <div className="space-y-4">
                  {productPosts.map((post, index) => (
                    <div key={post.id}>
                      <PostCard post={post} />
                      {/* Anúncio patrocinado a cada 3 posts */}
                      {(index + 1) % 3 === 0 && (
                        <div className="mt-4">
                          <AdSlot 
                            slot="feed_sponsored" 
                            productId={id}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="shadow-card">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhuma instalação compartilhada ainda. Seja o primeiro!
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="space-y-4">
                {productQuestions.map((question) => (
                  <Card key={question.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{question.author_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{question.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(question.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm">{question.question}</p>
                        </div>
                      </div>

                      {question.answer && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                T
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{question.answer_by}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Técnico Tromot
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {question.answered_at && new Date(question.answered_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{question.answer}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {!question.answer && canAnswerQuestions && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-3">
                            <textarea
                              placeholder="Digite sua resposta..."
                              className="w-full p-3 text-sm border rounded-lg resize-none"
                              rows={3}
                              value={answerText[question.id] || ''}
                              onChange={(e) => setAnswerText(prev => ({ ...prev, [question.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAnswerSubmit(question.id)}
                              disabled={!answerText[question.id]?.trim()}
                            >
                              Responder
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Fazer uma pergunta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionForm productId={product.id} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {productRatings.length > 0 && (
                <div className="space-y-4">
                  {productRatings.map((rating) => (
                    <Card key={rating.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{rating.author_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{rating.author_name}</span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${
                                        star <= rating.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{rating.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avaliar Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RatingForm productId={product.id} />
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          {productRatings.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Avaliações Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productRatings.slice(0, 3).map((rating) => (
                  <div key={rating.id} className="border-b border-border/50 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{rating.author_name}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm">{rating.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rating.comment}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PostUploadModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        productId={product.id}
      />
    </div>
  );
}