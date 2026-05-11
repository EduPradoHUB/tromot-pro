-- ============================================================
-- SECURITY FIX: Error 2 - Role escalation
-- Dropar TODAS as variações de policies UPDATE em profiles
-- e recriar apenas a segura com WITH CHECK anti-escalada
-- ============================================================
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile including roles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;

-- Policy segura: usuário pode atualizar próprio perfil, mas NÃO pode mudar role
CREATE POLICY "users_update_own_profile_no_role_change"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_admin()
    OR role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- Policy para ADMs gerenciarem qualquer perfil (incluindo role)
DROP POLICY IF EXISTS "ADMs podem gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "admins_manage_all_profiles"
ON public.profiles FOR ALL
USING (public.is_verified_admin());
