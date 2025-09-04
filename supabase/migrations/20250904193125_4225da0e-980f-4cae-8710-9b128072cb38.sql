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

-- Atualizar política de moderação para incluir Suporte Tromot
DROP POLICY IF EXISTS "Técnicos e ADMs podem responder" ON public.questions;
CREATE POLICY "Técnicos e ADMs podem responder" 
ON public.questions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['ADM'::user_role, 'Técnico Tromot'::user_role, 'Suporte Tromot'::user_role])
));