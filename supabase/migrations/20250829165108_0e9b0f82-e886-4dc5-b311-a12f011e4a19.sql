-- Corrigir o problema da view SECURITY DEFINER
-- Remover a view anterior
DROP VIEW IF EXISTS public.user_public_profiles;

-- Criar uma view mais simples sem security definer
-- Ao invés de uma view, criaremos uma função que retorna apenas dados públicos
CREATE OR REPLACE FUNCTION public.get_user_public_info(user_uuid uuid)
RETURNS TABLE(
  user_id uuid,
  name text,
  avatar_url text,
  role user_role,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.avatar_url, p.role, p.created_at
  FROM profiles p
  WHERE p.user_id = user_uuid;
$$;

-- Permitir execução da função
GRANT EXECUTE ON FUNCTION public.get_user_public_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_public_info(uuid) TO anon;