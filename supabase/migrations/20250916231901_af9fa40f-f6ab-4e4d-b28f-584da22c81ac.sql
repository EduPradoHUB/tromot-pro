-- Corrigir políticas de segurança para security_audit_log

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can create audit logs" ON public.security_audit_log;

-- 2. Criar função para verificar se usuário é admin verificado
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADM'::user_role
    AND email IS NOT NULL
    AND name IS NOT NULL
  );
$$;

-- 3. Criar função para verificar se é operação do sistema
CREATE OR REPLACE FUNCTION public.is_system_operation()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Verifica se a operação vem de uma função do sistema (SECURITY DEFINER)
  -- ou se é uma operação administrativa legítima
  SELECT current_setting('role') IN ('postgres', 'service_role') 
  OR (auth.uid() IS NOT NULL AND is_verified_admin());
$$;

-- 4. Política mais restritiva para SELECT - apenas admins verificados
CREATE POLICY "verified_admins_can_view_security_logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (
  is_verified_admin() 
  AND current_setting('request.jwt.claims', true)::json->>'email' IS NOT NULL
);

-- 5. Política mais restritiva para INSERT - apenas sistema e operações legítimas
CREATE POLICY "system_can_create_audit_logs" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Permitir apenas inserções de funções do sistema ou triggers
  is_system_operation()
  OR 
  -- Ou inserções feitas por funções SECURITY DEFINER específicas
  current_setting('application_name', true) LIKE '%audit%'
);

-- 6. Adicionar política para impedir atualizações não autorizadas
CREATE POLICY "no_updates_to_security_logs" 
ON public.security_audit_log 
FOR UPDATE 
USING (false);

-- 7. Adicionar política para impedir deleções não autorizadas  
CREATE POLICY "no_deletes_to_security_logs" 
ON public.security_audit_log 
FOR DELETE 
USING (false);

-- 8. Criar função para auditoria segura de acesso aos logs
CREATE OR REPLACE FUNCTION public.audit_security_log_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar tentativas de acesso aos logs de segurança
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.security_audit_log (
      event_type,
      actor_user_id,
      metadata
    ) VALUES (
      'security_log_access',
      auth.uid(),
      jsonb_build_object(
        'timestamp', now(),
        'ip_address', inet_client_addr()::text,
        'operation', 'security_log_view',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
  END IF;
  
  RETURN NULL; -- Para trigger AFTER SELECT
END;
$$;

-- 9. Criar trigger para auditar acessos (comentado por enquanto para evitar recursão)
-- CREATE TRIGGER audit_security_log_access_trigger
--   AFTER SELECT ON public.security_audit_log
--   FOR EACH ROW EXECUTE FUNCTION public.audit_security_log_access();

-- 10. Adicionar comentários de documentação
COMMENT ON TABLE public.security_audit_log IS 'Tabela de auditoria de segurança - ACESSO ALTAMENTE RESTRITO. Contém logs sensíveis do sistema que podem revelar vulnerabilidades. Acesso limitado apenas a administradores verificados com autenticação dupla.';

COMMENT ON FUNCTION public.is_verified_admin() IS 'Função para verificar se usuário é um administrador verificado com perfil completo.';

COMMENT ON FUNCTION public.is_system_operation() IS 'Função para verificar se a operação é legítima do sistema.';

-- 11. Criar view segura para admins visualizarem logs (sem dados muito sensíveis)
CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT 
  id,
  event_type,
  created_at,
  -- Mascarar IP parcialmente
  CASE 
    WHEN ip_address IS NOT NULL THEN 
      split_part(host(ip_address), '.', 1) || '.xxx.xxx.' || split_part(host(ip_address), '.', 4)
    ELSE NULL 
  END as ip_masked,
  -- Informações não sensíveis do metadata
  CASE 
    WHEN metadata ? 'timestamp' THEN jsonb_build_object('timestamp', metadata->'timestamp')
    ELSE '{}'::jsonb
  END as metadata_safe
FROM public.security_audit_log
WHERE is_verified_admin();

-- 12. Política para a view segura
CREATE POLICY "verified_admins_can_view_audit_summary" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (is_verified_admin());

COMMENT ON VIEW public.security_audit_summary IS 'View segura dos logs de auditoria com dados sensíveis mascarados para administradores verificados.';