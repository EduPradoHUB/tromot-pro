import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Check, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PostModeration: React.FC = () => {
  const { posts, products, moderatePost } = useApp();
  const { toast } = useToast();
  
  const pendingPosts = posts.filter(post => post.status === 'pending');
  
  const handleApprove = async (postId: string) => {
    try {
      await moderatePost(postId, 'approved');
      toast({
        title: "Post aprovado",
        description: "Post foi aprovado e está visível para todos."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar post.",
        variant: "destructive"
      });
    }
  };
  
  const handleReject = async (postId: string) => {
    try {
      await moderatePost(postId, 'rejected');
      toast({
        title: "Post rejeitado",
        description: "Post foi rejeitado e removido da fila.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao rejeitar post.",
        variant: "destructive"
      });
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
      
      {pendingPosts.map((post) => (
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
              <div className="aspect-video w-full max-w-md">
                <img 
                  src={post.photo_url} 
                  alt="Post do usuário"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              
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
      ))}
    </div>
  );
};