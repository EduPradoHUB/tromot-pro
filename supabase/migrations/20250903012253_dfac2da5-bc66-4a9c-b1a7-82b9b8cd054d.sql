-- Adicionar campo de código de barras aos produtos
ALTER TABLE public.products 
ADD COLUMN barcode_ean TEXT UNIQUE;