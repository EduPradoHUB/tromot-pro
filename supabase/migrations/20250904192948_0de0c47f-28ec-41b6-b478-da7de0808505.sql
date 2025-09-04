-- Adicionar role "Suporte Tromot" ao enum user_role
ALTER TYPE user_role ADD VALUE 'Suporte Tromot';

-- Atualizar políticas para incluir Suporte Tromot nas permissões de gerenciamento de produtos
DROP POLICY IF EXISTS "ADMs e Técnicos podem gerenciar produtos" ON public.products;
CREATE POLICY "ADMs e Técnicos podem gerenciar produtos" 
ON public.products 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role])
));

-- Atualizar políticas para incluir Suporte Tromot nas permissões de gerenciamento de categorias
DROP POLICY IF EXISTS "ADMs e Técnicos podem gerenciar categorias" ON public.categories;
CREATE POLICY "ADMs e Técnicos podem gerenciar categorias" 
ON public.categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role])
));