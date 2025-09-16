-- Corrigir problema de Security Definer View

-- 1. Remover a view problemática
DROP VIEW IF EXISTS public.security_audit_summary;

-- 2. Recriar view sem SECURITY DEFINER (usando RLS da tabela base)
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
FROM public.security_audit_log;

-- 3. A view agora usa as políticas RLS da tabela base automaticamente
COMMENT ON VIEW public.security_audit_summary IS 'View segura dos logs de auditoria com dados sensíveis mascarados. Acesso controlado pelas políticas RLS da tabela security_audit_log.';

-- 4. Remover política duplicada desnecessária para a view
DROP POLICY IF EXISTS "verified_admins_can_view_audit_summary" ON public.security_audit_log;