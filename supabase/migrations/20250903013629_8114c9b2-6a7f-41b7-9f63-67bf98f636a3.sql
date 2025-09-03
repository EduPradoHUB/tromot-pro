-- Adicionar campos de segmentação para anúncios
ALTER TABLE public.advertisements 
ADD COLUMN target_type text DEFAULT 'all' CHECK (target_type IN ('all', 'category', 'products')),
ADD COLUMN target_category text,
ADD COLUMN target_products jsonb DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.advertisements.target_type IS 'Tipo de segmentação: all (todos), category (categoria específica), products (produtos específicos)';
COMMENT ON COLUMN public.advertisements.target_category IS 'Categoria alvo quando target_type = category';
COMMENT ON COLUMN public.advertisements.target_products IS 'Array de IDs de produtos quando target_type = products';