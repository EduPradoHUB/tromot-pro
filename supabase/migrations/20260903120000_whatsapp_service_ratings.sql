-- ============================================================
-- Avaliações de atendimento da IA de Suporte (WhatsApp)
-- ============================================================
-- Cada vez que a IA encerra um atendimento e o cliente dá uma nota de
-- 1 a 5, uma linha é gravada aqui. Como whatsapp_conversations tem uma
-- linha só por telefone (reaproveitada em vários atendimentos ao longo
-- do tempo), esta tabela separada é o que dá o histórico de avaliações
-- por cliente (não só a última).

CREATE TABLE public.service_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX service_ratings_conversation_idx ON public.service_ratings (conversation_id, created_at DESC);
CREATE INDEX service_ratings_phone_idx ON public.service_ratings (phone, created_at DESC);

ALTER TABLE public.service_ratings ENABLE ROW LEVEL SECURITY;

-- Só ADM lê pelo painel (aba Conversas); só a edge function
-- (whatsapp-webhook, com service_role) grava uma avaliação nova.
CREATE POLICY "ADMs podem ler avaliações de atendimento"
ON public.service_ratings FOR SELECT
USING (public.is_verified_admin());

-- ============================================================
-- AUDIT
-- ============================================================
DO $$
BEGIN
  INSERT INTO public.security_audit_log (event_type, actor_user_id, metadata)
  VALUES (
    'schema_migration',
    NULL,
    jsonb_build_object(
      'action', 'whatsapp_service_ratings',
      'description', 'Criada tabela service_ratings (avaliações de 1 a 5 do atendimento da IA de Suporte via WhatsApp)',
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
