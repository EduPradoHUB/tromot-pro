-- ============================================================
-- Notificações por email (Resend) de novidades de produto
-- ============================================================
-- Quando um produto é criado, ganha um manual novo/atualizado, ou tem uma
-- alteração relevante (nome, descrição, categoria, foto, compatibilidade
-- ou link de compra), o cliente pode receber um email — se ele tiver
-- optado por isso. O envio pode ser automático ou manual, configurável
-- por tipo de evento em email_notification_settings.
--
-- O gatilho fica do lado de fora do banco: um Database Webhook do
-- Supabase (Dashboard → Database → Webhooks) chama a edge function
-- product-change-webhook sempre que a tabela products muda. Preferimos
-- isso a um trigger com pg_net direto no SQL porque evita guardar
-- segredo/URL do projeto dentro da migration (que fica no Git).
-- Veja ARCHITECTURE_WHATSAPP_IA.md para o passo a passo de configuração.

-- ============================================================
-- 1. Preferência de email + token de descadastro por cliente
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications_opt_in BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.profiles.email_notifications_opt_in IS 'Cliente optou por receber emails de novidade de produto (padrão: sim, com link de descadastro em todo email)';
COMMENT ON COLUMN public.profiles.unsubscribe_token IS 'Token usado no link de descadastro do email — não exige login para funcionar';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_unsubscribe_token_idx ON public.profiles (unsubscribe_token);

-- ============================================================
-- 2. Configuração automático/manual, por tipo de evento
-- ============================================================
CREATE TABLE public.email_notification_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),  -- linha única (singleton)
  novo_produto_modo TEXT NOT NULL DEFAULT 'manual' CHECK (novo_produto_modo IN ('automatico', 'manual')),
  manual_atualizado_modo TEXT NOT NULL DEFAULT 'manual' CHECK (manual_atualizado_modo IN ('automatico', 'manual')),
  produto_alterado_modo TEXT NOT NULL DEFAULT 'manual' CHECK (produto_alterado_modo IN ('automatico', 'manual')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.email_notification_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TRIGGER update_email_notification_settings_updated_at
  BEFORE UPDATE ON public.email_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ADMs configuram o modo de notificação por email"
ON public.email_notification_settings FOR ALL
USING (public.is_verified_admin())
WITH CHECK (public.is_verified_admin());

-- ============================================================
-- 3. Fila/histórico de notificações de produto
-- ============================================================
CREATE TABLE public.product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('novo_produto', 'manual_atualizado', 'produto_alterado')),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped')),
  recipients_count INT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX product_notifications_status_idx ON public.product_notifications (status, created_at DESC);
CREATE INDEX product_notifications_product_idx ON public.product_notifications (product_id);

ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

-- Só ADM lê/gerencia pelo painel; só as edge functions (service_role)
-- inserem/atualizam de fato.
CREATE POLICY "ADMs veem e gerenciam a fila de notificações de produto"
ON public.product_notifications FOR ALL
USING (public.is_verified_admin())
WITH CHECK (public.is_verified_admin());

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
      'action', 'product_email_notifications',
      'description', 'Criadas email_notification_settings, product_notifications, profiles.email_notifications_opt_in/unsubscribe_token',
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
