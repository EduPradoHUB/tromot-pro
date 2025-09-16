import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Flag } from 'lucide-react';
import { Post } from '@/lib/types';
import { useApp } from '@/contexts/AppContext';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { likePost, reportPost, currentUser } = useApp();

  const handleLike = () => {
    if (!currentUser) return;
    likePost(post.id);
  };

  const handleReport = () => {
    if (!currentUser) return;
    reportPost(post.id);
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{post.author_name}</span>
              <Badge variant="outline" className="text-xs">
                {post.author_role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <img
          src={post.photo_url}
          alt="Foto da instalação"
          className="w-full h-48 object-cover rounded-lg mb-3"
        />

        <p className="text-sm mb-3">{post.caption}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!currentUser || post.liked_by_user}
            className="flex items-center gap-1 text-muted-foreground hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 ${
                post.liked_by_user ? 'fill-red-500 text-red-500' : ''
              }`}
            />
            {post.likes_count}
          </Button>

          {currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              className="text-muted-foreground hover:text-orange-500"
            >
              <Flag className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}