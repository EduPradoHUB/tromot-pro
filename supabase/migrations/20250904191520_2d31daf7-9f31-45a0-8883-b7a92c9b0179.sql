-- Adicionar auditoria de acesso às informações de distribuidores
CREATE TABLE IF NOT EXISTS public.distributor_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  distributor_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view_phone', 'view_whatsapp', 'view_details')),
  user_location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.distributor_access_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os logs
CREATE POLICY "ADMs podem ver todos os logs de acesso"
ON public.distributor_access_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'ADM'::user_role
));

-- Política para usuários criarem logs de acesso
CREATE POLICY "Usuários podem criar logs de acesso"
ON public.distributor_access_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função para registrar acesso a distribuidor
CREATE OR REPLACE FUNCTION public.log_distributor_access(
  p_distributor_id UUID,
  p_access_type TEXT,
  p_user_location JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.distributor_access_logs (
    user_id,
    distributor_id,
    access_type,
    user_location
  ) VALUES (
    auth.uid(),
    p_distributor_id,
    p_access_type,
    p_user_location
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar política dos distribuidores para ser mais restritiva
-- Só permite acesso se o usuário tem localização definida
DROP POLICY IF EXISTS "Usuários autenticados podem ver distribuidores ativos" ON public.distributors;

CREATE POLICY "Usuários com localização podem ver distribuidores"
ON public.distributors 
FOR SELECT 
USING (
  active = true 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.state IS NOT NULL OR profiles.role = 'ADM'::user_role)
  )
);