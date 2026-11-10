INSERT INTO public.editable_content (section, title, description, visible)
SELECT 'banner-carousel', 'Carrossel de Banners', 'Faixa de banners rotativos na página inicial', true
WHERE NOT EXISTS (SELECT 1 FROM public.editable_content WHERE section = 'banner-carousel');

INSERT INTO public.editable_content (section, title, description, visible)
SELECT 'blog', 'Blog em Destaque', 'Artigo mais recente do blog exibido na página inicial', true
WHERE NOT EXISTS (SELECT 1 FROM public.editable_content WHERE section = 'blog');