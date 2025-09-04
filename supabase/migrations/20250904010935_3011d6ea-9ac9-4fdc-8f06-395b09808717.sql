-- Inserir conteúdo padrão para a seção de busca rápida
INSERT INTO public.editable_content (section, title, description)
VALUES (
  'quick-search',
  'Busca Rápida por Veículo',
  'Encontre produtos compatíveis com seu veículo'
) 
ON CONFLICT (section) DO NOTHING;