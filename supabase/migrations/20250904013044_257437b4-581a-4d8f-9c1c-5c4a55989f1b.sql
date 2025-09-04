-- Adicionar campo para indicar quando produto não tem manual disponível
ALTER TABLE public.products 
ADD COLUMN no_manual_available BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.products.no_manual_available IS 'Indica se o produto não possui manual disponível (será exibido texto informativo ao invés do botão de download)';