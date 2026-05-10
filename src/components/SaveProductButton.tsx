import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedProducts } from '@/hooks/useSavedProducts';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  productName?: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export const SaveProductButton: React.FC<Props> = ({
  productId,
  productName,
  variant = 'full',
  className,
}) => {
  const { isSaved, toggleSaved } = useSavedProducts();
  const saved = isSaved(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggleSaved(productId);
    toast({
      title: nowSaved ? 'Produto salvo' : 'Removido dos salvos',
      description: nowSaved
        ? `${productName ?? 'Produto'} foi adicionado em Salvos.`
        : `${productName ?? 'Produto'} foi removido de Salvos.`,
    });
  };

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleClick}
        aria-label={saved ? 'Remover dos salvos' : 'Salvar produto'}
        className={cn('bg-background/90 backdrop-blur', className)}
      >
        {saved ? (
          <BookmarkCheck className="h-4 w-4 text-primary" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className={className}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-2" />
          Salvo
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          Salvar
        </>
      )}
    </Button>
  );
};