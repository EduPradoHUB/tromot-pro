import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Star, 
  ScanLine,
  LogIn,
  Camera,
  MessageCircle,
  Lock,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { BarcodeScannerDialog } from '@/components/BarcodeScannerDialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PublicProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, findProductByBarcode } = useApp();
  const [product, setProduct] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        // Fallback: busca direto no Supabase para evitar redirect
        // quando a lista global ainda não carregou (ex.: link compartilhado)
        let cancelled = false;
        (async () => {
          const { data } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('status', 'active')
            .maybeSingle();
          if (cancelled) return;
          if (data) {
            setProduct(data);
          } else if (products.length > 0) {
            navigate('/manuais-publico');
          }
        })();
        return () => { cancelled = true; };
      }
    }
  }, [id, products, navigate]);

  const handleManualAccess = () => {
    if (product?.manual_url) {
      window.open(product.manual_url, '_blank');
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    const foundProduct = await findProductByBarcode(barcode);
    
    if (foundProduct) {
      navigate(`/manual/${foundProduct.id}`);
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Nenhum produto encontrado com o código ${barcode}`,
        variant: "destructive",
      });
    }
  };

  // Helper functions for video URL processing
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVimeoId = (url: string) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const isDirectVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url);
  };

  const handleShare = async () => {
    if (!product) return;
    
    const PUBLIC_BASE = "https://pro.tromot.com";
    const shareUrl = `${PUBLIC_BASE}/manual/${product.id}`;
    const shareData = {
      title: product.name,
      text: `Veja o manual de instalação: ${product.name}`,
      url: shareUrl,
    };
    
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "Link copiado!", 
          description: "Cole e envie para seu cliente" 
        });
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast({ 
          title: "Link copiado!", 
          description: "Cole e envie para seu cliente" 
        });
      }
    }
  };

  if (!product) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/manuais-publico')}>
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
      <div className="flex items-start gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/manuais-publico')} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">Código: {product.code}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBarcodeScanner(true)}
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Escanear
          </Button>
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
                  src={product.image_url || '/src/assets/photo-unavailable.png'}
                  alt={product.name}
                  className="w-full aspect-square object-contain bg-muted/30 rounded-lg"
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
                  
                  {/* Product Code and EAN */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Código:</span>
                      <Badge variant="secondary">{product.code}</Badge>
                    </div>
                    {product.barcode_ean && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">EAN13:</span>
                        <Badge variant="secondary">{product.barcode_ean}</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Compatibility */}
                  <div>
                    <h3 className="font-medium mb-2">Compatibilidade</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.compatibility.map((vehicle: any) => (
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
            {product.no_manual_available ? (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Manual de Instalação
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="text-center text-muted-foreground py-4">
                    Manual digital não disponível
                  </div>
                </CardContent>
              </Card>
            ) : product.manual_url ? (
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
                <CardContent className="py-4">
                  <Button onClick={handleManualAccess} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Acessar Manual
                  </Button>
                </CardContent>
              </Card>
            ) : null}

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
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {!showInlinePlayer ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={() => setShowInlinePlayer(true)}
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Assistir Vídeo
                        </Button>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="absolute top-2 right-2 z-10"
                          onClick={() => setShowInlinePlayer(false)}
                        >
                          Fechar
                        </Button>
                        {(() => {
                          const youtubeId = getYouTubeId(product.video_url);
                          const vimeoId = getVimeoId(product.video_url);
                          
                          if (youtubeId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else if (vimeoId) {
                            return (
                              <iframe
                                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                                className="w-full h-full rounded-lg"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else if (isDirectVideoFile(product.video_url)) {
                            return (
                              <video
                                src={product.video_url}
                                className="w-full h-full rounded-lg object-cover"
                                controls
                                autoPlay
                              />
                            );
                          } else {
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <p className="text-sm text-muted-foreground text-center">
                                  Não foi possível carregar o vídeo inline
                                </p>
                                <Button 
                                  variant="outline"
                                  onClick={() => window.open(product.video_url, '_blank')}
                                >
                                  Abrir em nova aba
                                </Button>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conteúdo bloqueado - CTA para cadastro */}
          <Card className="shadow-card border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Conteúdo Exclusivo para Cadastrados</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Fotos de Instalação</p>
                    <p className="text-xs text-muted-foreground">Veja como outros instalaram</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Dúvidas e Respostas</p>
                    <p className="text-xs text-muted-foreground">Pergunte aos técnicos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Avaliações</p>
                    <p className="text-xs text-muted-foreground">Veja opiniões de usuários</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-tromot-red hover:bg-tromot-red/90">
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Criar Conta Grátis
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/login">
                    Já tenho conta - Entrar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CTA Card */}
          <Card className="shadow-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Acesso Completo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre-se para ver fotos de instalação, fazer perguntas e avaliar produtos.
              </p>
              <Button asChild className="w-full bg-tromot-red hover:bg-tromot-red/90">
                <Link to="/login">
                  Cadastrar Agora
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Scan another product */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Buscar outro produto</h3>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Escanear Código de Barras
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ou <Link to="/manuais-publico" className="text-primary hover:underline">voltar ao catálogo</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </div>
  );
}
