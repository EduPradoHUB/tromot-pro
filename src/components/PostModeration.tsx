import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Check, X, Eye } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';

export const PostModeration: React.FC = () => {
  const { posts, products, moderatePost } = useApp();
  
  const pendingPosts = posts.filter(post => post.status === 'pending');
  
  const handleApprove = async (postId: string) => {
    try {
      await moderatePost(postId, 'approved');
      console.log("Post aprovado e está visível para todos.");
    } catch (error) {
      console.error("Falha ao aprovar post.");
    }
  };
  
  const handleReject = async (postId: string) => {
    try {
      await moderatePost(postId, 'rejected');
      console.log("Post foi rejeitado e removido da fila.");
    } catch (error) {
      console.error("Falha ao rejeitar post.");
    }
  };
  
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Produto não encontrado';
  };
  
  if (pendingPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum post aguardando moderação.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Posts Pendentes de Moderação</h3>
      
      {pendingPosts.map((post) => {
        // Usar photos_urls se disponível, senão usar photo_url para compatibilidade
        const images = post.photos_urls && post.photos_urls.length > 0 
          ? post.photos_urls 
          : post.photo_url 
          ? [post.photo_url] 
          : [];

        return (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{getProductName(post.product_id)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Por {post.author_name} ({post.author_role})
                  </p>
                </div>
                <Badge variant="secondary">Pendente</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Carrossel de imagens */}
                {images.length > 0 && (
                  <ImageCarousel 
                    images={images}
                    className="max-w-md"
                  />
                )}
                
                <p className="text-sm">{post.caption}</p>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(post.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleReject(post.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};