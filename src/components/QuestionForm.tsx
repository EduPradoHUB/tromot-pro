import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface QuestionFormProps {
  productId: string;
}

export function QuestionForm({ productId }: QuestionFormProps) {
  const { currentUser, submitQuestion } = useApp();
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer uma pergunta.",
        variant: "destructive",
      });
      return;
    }

    if (!question.trim()) {
      toast({
        title: "Erro",
        description: "Digite sua pergunta.",
        variant: "destructive",
      });
      return;
    }

    submitQuestion(productId, question.trim());
    
    toast({
      title: "Sucesso",
      description: "Sua pergunta foi enviada!",
    });

    setQuestion('');
  };

  if (!currentUser) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>Faça login para fazer uma pergunta</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="question" className="text-sm font-medium mb-2 block">
          Fazer uma pergunta
        </label>
        <Textarea
          id="question"
          placeholder="Digite sua dúvida sobre a instalação..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Enviar Pergunta
      </Button>
    </form>
  );
}