-- Inserir conteúdo padrão para os cards de features
INSERT INTO public.editable_content (section, title, description) VALUES
('feature-card-1', 'Manuais Sempre Disponíveis', 'Acesse manuais de instalação em PDF ou imagem, sempre atualizados e organizados por produto.'),
('feature-card-2', 'Rede Colaborativa', 'Compartilhe suas instalações, veja o trabalho de outros técnicos e aprenda com a comunidade.'),
('feature-card-3', 'Busca Inteligente', 'Encontre produtos compatíveis com qualquer veículo de forma rápida e precisa.')
ON CONFLICT (section) DO NOTHING;