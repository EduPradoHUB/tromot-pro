-- ============================================================
-- SECURITY FIX: Corrigir política permissiva de armazenamento
-- Apenas ADMs devem poder fazer WRITE direto nos buckets admin
-- ============================================================

-- Garantir que a política de analytics exige user_id correto
DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can create analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- ============================================================
-- SECURITY FIX: Rota /tecnico - adicionar RLS reforçado na tabela
-- O frontend já checa o role, mas garantir no banco também
-- ============================================================

-- Técnicos e Suporte só podem criar/editar produtos (não deletar)
-- ADM já tem acesso full via a policy existente "ADMs e Técnicos podem gerenciar produtos"
-- Nenhuma alteração necessária pois o RLS já aplica corretamente

-- ============================================================
-- SECURITY FIX: Prevenir escalada de role via profiles
-- Trigger já adicionado na migration anterior, garantir função
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'ADM'::user_role
  );
$$;

-- ============================================================
-- AUDIT: Registrar esta correção de segurança
-- ============================================================
DO $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    actor_user_id,
    metadata
  ) VALUES (
    'security_policy_update',
    NULL,
    jsonb_build_object(
      'action', 'migration_security_fixes',
      'description', 'Applied security fixes: analytics user_id enforcement, is_admin function hardening',
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignorar se tabela não existir ainda
  NULL;
END $$;
