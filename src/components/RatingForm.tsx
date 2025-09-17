import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
// Temporarily disabled to fix React hooks conflicts
// import { toast } from '@/hooks/use-toast';

interface RatingFormProps {
  productId: string;
}

export function RatingForm({ productId }: RatingFormProps) {
  const { currentUser, submitRating } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      // Temporarily using alert instead of toast to fix React hooks conflicts
      alert("Você precisa estar logado para avaliar.");
      return;
    }

    if (rating === 0) {
      // Temporarily using alert instead of toast to fix React hooks conflicts
      alert("Selecione uma nota para o produto.");
      return;
    }

    submitRating(productId, rating, comment);
    
    // Temporarily using alert instead of toast to fix React hooks conflicts
    alert("Sua avaliação foi enviada!");

    setRating(0);
    setComment('');
  };

  if (!currentUser) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>Faça login para avaliar este produto</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Sua avaliação</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="text-sm font-medium mb-2 block">
          Comentário (opcional)
        </label>
        <Textarea
          id="comment"
          placeholder="Conte sua experiência com o produto..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Enviar Avaliação
      </Button>
    </form>
  );
}