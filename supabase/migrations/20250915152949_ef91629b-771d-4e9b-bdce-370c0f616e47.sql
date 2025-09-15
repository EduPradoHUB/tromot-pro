-- Primeiro, vamos corrigir a migração anterior

-- Criar view segura para distribuidores com dados mascarados (sem RLS policy na view)
CREATE OR REPLACE VIEW public.distributors_public AS
SELECT 
  d.id,
  d.name,
  d.state,
  d.city,
  d.cover_entire_state,
  d.active,
  d.created_at,
  -- Mascarar dados sensíveis usando função existente
  (mask_sensitive_data(d.phone, d.whatsapp))::jsonb ->> 'phone_masked' as phone_display,
  (mask_sensitive_data(d.phone, d.whatsapp))::jsonb ->> 'whatsapp_masked' as whatsapp_display,
  -- Indicar se tem contato disponível sem expor os dados
  CASE WHEN d.phone IS NOT NULL OR d.whatsapp IS NOT NULL THEN true ELSE false END as has_contact
FROM public.distributors d
WHERE d.active = true;

-- Função segura para obter dados completos de contato do distribuidor
CREATE OR REPLACE FUNCTION public.get_distributor_contact(distributor_id uuid)
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;
  
  -- Verificar se o distributor existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.distributors 
    WHERE distributors.id = distributor_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Distribuidor não encontrado ou inativo';
  END IF;
  
  -- Registrar acesso para auditoria
  PERFORM log_distributor_access(
    distributor_id, 
    'contact_access',
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', inet_client_addr()
    )
  );
  
  -- Retornar dados completos do distribuidor
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

-- Atualizar política RLS da tabela distributors para ser mais restritiva
DROP POLICY IF EXISTS "Usuários com localização podem ver distribuidores" ON public.distributors;

-- Nova política mais restritiva - apenas ADMs podem ver dados completos
CREATE POLICY "ADMs podem ver distribuidores completos"
ON public.distributors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADM'::user_role
  )
);

-- Comentários para documentar a segurança
COMMENT ON VIEW public.distributors_public IS 'View segura com dados de contato mascarados para prevenir harvesting de informações sensíveis';
COMMENT ON FUNCTION public.get_distributor_contact(uuid) IS 'Função segura para acessar dados completos de contato com logging de auditoria';

-- Atualizar constraint de logs para incluir novos tipos de acesso
ALTER TABLE public.distributor_access_logs 
DROP CONSTRAINT IF EXISTS valid_access_types;

ALTER TABLE public.distributor_access_logs 
ADD CONSTRAINT valid_access_types 
CHECK (access_type IN ('view', 'contact_access', 'search'));