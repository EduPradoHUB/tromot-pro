-- Inserir conteúdo padrão para a seção de features
INSERT INTO public.editable_content (section, title, subtitle, description)
VALUES (
  'features',
  'Por que usar o TROMOT Pro?',
  NULL,
  'Desenvolvido especialmente para instaladores e técnicos, oferecendo tudo que você precisa em um só lugar.'
) 
ON CONFLICT (section) DO NOTHING;