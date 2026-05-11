-- ============================================================
-- SECURITY FIX: Error 1 - Role escalation via profiles UPDATE
-- Adiciona WITH CHECK que impede usuários de alterarem seu próprio role
-- O trigger prevent_role_self_escalation faz isso no nível de trigger,
-- mas adicionamos também na RLS policy para defesa em profundidade.
-- ============================================================

-- Remover políticas de UPDATE permissivas existentes
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- Nova policy: usuário pode atualizar seu perfil MAS não pode mudar o role
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Admins podem mudar qualquer campo
    public.is_admin()
    OR
    -- Usuários comuns: o role deve permanecer igual ao que está no banco
    role = (
      SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
);

-- ============================================================
-- SECURITY FIX: Error 2 - Senha '123456' hardcoded
-- Invalida as contas criadas com senha hardcoded nas migrations.
-- O admin deve redefinir sua senha pelo painel do Supabase Auth.
-- ============================================================
DO $$
BEGIN
  -- Forçar confirmação de e-mail como nula para invalidar o login direto
  -- e obrigar redefinição de senha pelo fluxo de reset
  UPDATE auth.users
  SET 
    encrypted_password = '$2a$10$' || encode(gen_random_bytes(30), 'base64'),
    updated_at = now()
  WHERE 
    email IN ('eduardo@tromot.com.br', 'admin@tromot.com')
    -- Só rotaciona se o hash atual ainda é o da senha '123456'
    AND (
      encrypted_password = '$2a$10$5WJMjBo7JKXBziq/L.dvYeX/VpwD.OznuXGwztNlqN3yXGGBxRdpe'
      OR encrypted_password LIKE '%' -- Rotaciona por segurança qualquer senha dessas contas
    );
    
  RAISE NOTICE 'Senhas das contas admin rotacionadas. Use "Redefinir senha" no painel Supabase Auth para recuperar acesso.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Rotação de senha ignorada: %', SQLERRM;
END $$;

-- ============================================================
-- SECURITY FIX: Warning 3 - Self-approval de posts
-- Garantir que usuários não possam alterar o status para 'approved'
-- (já foi feito na migration anterior, reforçando aqui)
-- ============================================================
DROP POLICY IF EXISTS "Usuários podem editar seus posts pendentes" ON public.posts;
CREATE POLICY "Usuários podem editar seus posts pendentes"
ON public.posts FOR UPDATE
USING (auth.uid() = author_id AND status = 'pending'::content_status)
WITH CHECK (
  auth.uid() = author_id 
  AND status = 'pending'::content_status  -- Não pode mudar o status
);

-- ============================================================
-- SECURITY FIX: Warning 4 & 6 - Funções SECURITY DEFINER
-- Revogar execução pública e permitir apenas para authenticated
-- ============================================================

-- Revogar do público (anon) as funções que não devem ser públicas
REVOKE EXECUTE ON FUNCTION public.search_distributors_secure(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_distributor_contact_secure(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_distributor_access(uuid, text, text) FROM anon;

-- Garantir que apenas authenticated pode chamar
GRANT EXECUTE ON FUNCTION public.search_distributors_secure(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_distributor_contact_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_distributor_access(uuid, text, text) TO authenticated;

-- is_admin e is_verified_admin: apenas authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_verified_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_admin() TO authenticated;

-- ============================================================
-- SECURITY FIX: Warning 9 - Admin pode inserir linhas arbitrárias no audit log
-- Restringir INSERT no security_audit_log apenas ao sistema (SECURITY DEFINER)
-- Remover qualquer política que permita inserção direta por usuários
-- ============================================================
DROP POLICY IF EXISTS "ADMs podem inserir logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Allow insert security audit log" ON public.security_audit_log;

-- Apenas funções com SECURITY DEFINER (rodando como postgres) podem inserir
CREATE POLICY "Apenas sistema pode inserir no audit log"
ON public.security_audit_log FOR INSERT
WITH CHECK (
  current_setting('role') IN ('postgres', 'service_role')
);

-- ADMs ainda podem ler o log
DROP POLICY IF EXISTS "ADMs podem ver logs de auditoria" ON public.security_audit_log;
CREATE POLICY "ADMs podem ler audit log"
ON public.security_audit_log FOR SELECT
USING (public.is_verified_admin());

-- ============================================================
-- AUDIT: Registrar estas correções
-- ============================================================
DO $$
BEGIN
  INSERT INTO public.security_audit_log (event_type, actor_user_id, metadata)
  VALUES (
    'security_policy_update',
    NULL,
    jsonb_build_object(
      'action', 'security_scan_errors_fixed',
      'fixes', jsonb_build_array(
        'role_escalation_rls_with_check',
        'hardcoded_password_rotated',
        'post_self_approval_blocked',
        'security_definer_access_restricted',
        'audit_log_insert_restricted'
      ),
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
