-- Adicionar campo "fora de produção" na tabela products
ALTER TABLE public.products 
ADD COLUMN out_of_production boolean NOT NULL DEFAULT false;