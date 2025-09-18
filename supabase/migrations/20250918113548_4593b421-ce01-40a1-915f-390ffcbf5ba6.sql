-- Adicionar campo para múltiplas fotos aos posts
ALTER TABLE public.posts 
ADD COLUMN photos_urls text[] DEFAULT ARRAY[]::text[];

-- Migrar dados existentes do photo_url para photos_urls
UPDATE public.posts 
SET photos_urls = ARRAY[photo_url] 
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Tornar o campo photo_url opcional (manter por compatibilidade temporária)
ALTER TABLE public.posts 
ALTER COLUMN photo_url DROP NOT NULL;