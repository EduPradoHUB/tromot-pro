-- Atualizar política RLS da tabela categories para permitir que técnicos também gerenciem categorias
DROP POLICY IF EXISTS "ADMs podem gerenciar categorias" ON public.categories;

CREATE POLICY "ADMs e Técnicos podem gerenciar categorias" 
ON public.categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = ANY(ARRAY['ADM'::user_role, 'Técnico Tromot'::user_role])
  )
);