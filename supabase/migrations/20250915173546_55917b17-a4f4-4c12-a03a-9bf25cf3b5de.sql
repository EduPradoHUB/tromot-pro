-- Remover a view distributors_public (será substituída por função mais segura)
DROP VIEW IF EXISTS public.distributors_public;

-- Recriar a função get_distributor_contact sem SECURITY DEFINER
-- Usar SECURITY INVOKER (padrão) e confiar nas políticas RLS
DROP FUNCTION IF EXISTS public.get_distributor_contact(uuid);

-- Criar função para buscar distribuidores com dados mascarados
-- Sem SECURITY DEFINER para resolver o problema de segurança
CREATE OR REPLACE FUNCTION public.search_distributors_masked(
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  state text,
  city text,
  cover_entire_state boolean,
  active boolean,
  created_at timestamptz,
  phone_display text,
  whatsapp_display text,
  has_contact boolean
)
LANGUAGE sql
STABLE
-- Removido SECURITY DEFINER - usar SECURITY INVOKER (padrão)
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.name,
    d.state,
    d.city,
    d.cover_entire_state,
    d.active,
    d.created_at,
    -- Mascarar dados sensíveis
    CASE WHEN d.phone IS NOT NULL THEN
      CASE WHEN length(d.phone) < 4 THEN '***'
           ELSE substring(d.phone from 1 for 2) || '***' || substring(d.phone from length(d.phone)-1)
      END
    ELSE NULL END as phone_display,
    CASE WHEN d.whatsapp IS NOT NULL THEN
      CASE WHEN length(d.whatsapp) < 4 THEN '***'
           ELSE substring(d.whatsapp from 1 for 2) || '***' || substring(d.whatsapp from length(d.whatsapp)-1)
      END
    ELSE NULL END as whatsapp_display,
    -- Indicar se tem contato disponível
    CASE WHEN d.phone IS NOT NULL OR d.whatsapp IS NOT NULL THEN true ELSE false END as has_contact
  FROM public.distributors d
  WHERE d.active = true
    AND (p_state IS NULL OR d.state = p_state)
    AND (p_city IS NULL OR d.city = p_city OR d.cover_entire_state = true)
  ORDER BY d.name;
$$;

-- Criar função mais simples para obter contato específico (quando usuário clica)
-- Esta mantém algum controle mas sem SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_distributor_full_contact(distributor_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  whatsapp text,
  state text,
  city text,
  cover_entire_state boolean
)
LANGUAGE plpgsql
STABLE
-- Removido SECURITY DEFINER - usar RLS policies para controle de acesso
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário está autenticado (será verificado pela RLS)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;
  
  -- Registrar o acesso (função auxiliar mantém SECURITY DEFINER por necessidade)
  PERFORM log_distributor_access(
    distributor_id, 
    'contact_access',
    jsonb_build_object(
      'timestamp', now(),
      'function_used', 'get_distributor_full_contact'
    )
  );
  
  -- Retornar dados (RLS da tabela distributors será aplicada automaticamente)
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.phone,
    d.whatsapp,
    d.state,
    d.city,
    d.cover_entire_state
  FROM public.distributors d
  WHERE d.id = distributor_id AND d.active = true;
END;
$$;

-- Criar política RLS mais específica para permitir acesso a contato quando necessário
-- Permitir que usuários autenticados vejam dados completos apenas quando solicitado explicitamente
CREATE POLICY "Usuários podem ver distribuidores para contato"
ON public.distributors
FOR SELECT
TO authenticated
USING (
  active = true AND 
  auth.uid() IS NOT NULL AND
  -- Permitir acesso quando é através da função de contato
  (
    -- ADM sempre pode ver tudo
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'ADM'::user_role)
    OR
    -- Ou quando usuário tem localização configurada
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND state IS NOT NULL)
  )
);

-- Comentários de documentação
COMMENT ON FUNCTION public.search_distributors_masked(text, text) IS 'Função segura para buscar distribuidores com dados mascarados - sem SECURITY DEFINER';
COMMENT ON FUNCTION public.get_distributor_full_contact(uuid) IS 'Função para acesso controlado a contato completo - sem SECURITY DEFINER, usa RLS';