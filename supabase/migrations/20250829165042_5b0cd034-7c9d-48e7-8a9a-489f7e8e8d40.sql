-- Corrigir vulnerabilidade de segurança na tabela profiles
-- Remover política atual que permite acesso a todos os profiles
DROP POLICY IF EXISTS "Usuários podem ver todos os profiles" ON public.profiles;

-- Criar nova política restritiva: usuários só podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver apenas seu próprio perfil" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Criar view pública para informações básicas (sem dados pessoais)
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT 
  user_id,
  name,
  avatar_url,
  role,
  created_at
FROM public.profiles;

-- Permitir acesso público à view (apenas dados não sensíveis)
GRANT SELECT ON public.user_public_profiles TO authenticated;
GRANT SELECT ON public.user_public_profiles TO anon;