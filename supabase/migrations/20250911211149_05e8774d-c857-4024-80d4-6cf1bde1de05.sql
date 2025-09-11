-- Adicionar campo visible na tabela editable_content
ALTER TABLE public.editable_content 
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;