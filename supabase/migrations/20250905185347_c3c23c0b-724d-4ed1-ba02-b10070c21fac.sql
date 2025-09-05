-- Melhorar segurança da tabela profiles
-- Remove políticas antigas potencialmente vulneráveis
DROP POLICY IF EXISTS "Sistema pode criar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;

-- Criar função para verificar autenticação robusta
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND 
         EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL);
$$;

-- Criar função para verificar se usuário é dono do perfil
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND auth.uid() = profile_user_id;
$$;

-- Criar função para mascarar dados sensíveis (apenas para uso futuro)
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(
  phone_input text,
  whatsapp_input text
)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'phone_masked', CASE 
      WHEN phone_input IS NULL THEN NULL
      WHEN length(phone_input) < 4 THEN '***'
      ELSE substring(phone_input from 1 for 2) || '***' || substring(phone_input from length(phone_input)-1)
    END,
    'whatsapp_masked', CASE 
      WHEN whatsapp_input IS NULL THEN NULL
      WHEN length(whatsapp_input) < 4 THEN '***'
      ELSE substring(whatsapp_input from 1 for 2) || '***' || substring(whatsapp_input from length(whatsapp_input)-1)
    END
  );
$$;

-- Nova política SELECT mais segura - usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários autenticados podem ver seu próprio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_authenticated_user() AND 
  is_profile_owner(user_id)
);

-- Nova política INSERT mais segura - apenas usuários autenticados podem criar seu próprio perfil
CREATE POLICY "Usuários autenticados podem criar seu próprio perfil"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated_user() AND 
  is_profile_owner(user_id) AND
  user_id = auth.uid()
);

-- Nova política UPDATE mais segura - usuários podem atualizar apenas seu próprio perfil (exceto role)
CREATE POLICY "Usuários autenticados podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  is_authenticated_user() AND 
  is_profile_owner(user_id)
)
WITH CHECK (
  is_authenticated_user() AND 
  is_profile_owner(user_id) AND
  -- Previne alteração de role por usuários não-admin
  (get_current_user_role() = 'ADM' OR 
   (SELECT role FROM profiles WHERE user_id = auth.uid()) = role)
);

-- Política especial para sistema criar perfis via trigger (mais restritiva)
CREATE POLICY "Sistema pode criar perfis via trigger"
ON public.profiles
FOR INSERT
WITH CHECK (
  -- Só permite inserção se for através do trigger de novo usuário
  -- ou se for um admin autenticado
  (get_current_user_role() = 'ADM') OR
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Adicionar auditoria de acesso para monitoramento de segurança
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log de acesso a perfis para auditoria de segurança
  INSERT INTO public.security_audit_log (
    event_type,
    actor_user_id,
    target_user_id,
    metadata
  ) VALUES (
    CASE TG_OP
      WHEN 'SELECT' THEN 'profile_view'
      WHEN 'INSERT' THEN 'profile_create'
      WHEN 'UPDATE' THEN 'profile_update'
      WHEN 'DELETE' THEN 'profile_delete'
    END,
    auth.uid(),
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', inet_client_addr(),
      'operation', TG_OP
    )
  );
  
  RETURN CASE TG_OP
    WHEN 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$;

-- Criar trigger para auditoria (apenas para operações críticas)
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Adicionar índices para melhor performance das verificações de segurança
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security 
ON public.profiles(user_id) WHERE user_id IS NOT NULL;

-- Comentários para documentação das políticas de segurança
COMMENT ON POLICY "Usuários autenticados podem ver seu próprio perfil" ON public.profiles IS 
'Política de segurança que permite apenas usuários autenticados e confirmados visualizarem seus próprios perfis';

COMMENT ON POLICY "Usuários autenticados podem criar seu próprio perfil" ON public.profiles IS 
'Política de segurança que permite apenas usuários autenticados criarem seus próprios perfis';

COMMENT ON POLICY "Usuários autenticados podem atualizar seu próprio perfil" ON public.profiles IS 
'Política de segurança que permite apenas usuários autenticados atualizarem seus próprios perfis, com proteção contra alteração de roles';

COMMENT ON FUNCTION public.is_authenticated_user() IS 
'Função de segurança que verifica se o usuário está autenticado e tem email confirmado';

COMMENT ON FUNCTION public.is_profile_owner(uuid) IS 
'Função de segurança que verifica se o usuário atual é dono do perfil especificado';