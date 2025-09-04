-- Remover a política atual que permite acesso público
DROP POLICY IF EXISTS "Todos podem ver distribuidores ativos" ON public.distributors;

-- Criar nova política que exige autenticação para ver distribuidores
CREATE POLICY "Usuários autenticados podem ver distribuidores ativos" 
ON public.distributors 
FOR SELECT 
USING (active = true AND auth.uid() IS NOT NULL);

-- Manter a política de administração para ADMs
-- (já existe: "ADMs podem gerenciar distribuidores")