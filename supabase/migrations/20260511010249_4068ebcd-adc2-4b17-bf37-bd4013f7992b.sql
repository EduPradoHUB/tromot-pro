
-- 1) Bloquear escalação de privilégios em profiles: recriar política UPDATE com freeze de role
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own_no_role_change"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 2) Remover política permissiva de INSERT em security_audit_log que permitia bypass via application_name
DROP POLICY IF EXISTS "system_can_create_audit_logs" ON public.security_audit_log;

CREATE POLICY "only_system_can_insert_audit_logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_system_operation());
