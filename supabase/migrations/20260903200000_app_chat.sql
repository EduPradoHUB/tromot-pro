-- ============================================================
-- Chat com a IA de Suporte dentro do próprio app (sem precisar do WA)
-- ============================================================
-- Espelha whatsapp_conversations/whatsapp_messages, mas identificado
-- por session_id (gerado no navegador do cliente, funciona mesmo sem
-- login) em vez de telefone. Quando o cliente está logado, user_id e
-- contact_info (whatsapp/email do perfil) já vêm preenchidos, então a
-- IA não precisa perguntar contato antes de escalar.

CREATE TABLE public.app_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_info TEXT,                    -- whatsapp/email informado (anônimo) ou copiado do perfil
  state TEXT,
  city TEXT,
  distributor_id UUID REFERENCES public.distributors(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'escalated', 'resolved')),
  needs_human BOOLEAN NOT NULL DEFAULT false,
  escalation_reason TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_app_chat_conversations_updated_at
  BEFORE UPDATE ON public.app_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.app_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.app_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX app_chat_messages_conversation_idx ON public.app_chat_messages (conversation_id, created_at);

ALTER TABLE public.app_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_chat_messages ENABLE ROW LEVEL SECURITY;

-- Só ADM lê pelo painel (aba Conversas) — a leitura/escrita "de
-- verdade" (enviar mensagem, carregar histórico do próprio cliente)
-- passa pela edge function app-chat com service_role, igual ao padrão
-- já usado no WhatsApp.
CREATE POLICY "ADMs podem ler conversas do chat do app"
ON public.app_chat_conversations FOR SELECT
USING (public.is_verified_admin());

CREATE POLICY "ADMs podem atualizar status do chat do app"
ON public.app_chat_conversations FOR UPDATE
USING (public.is_verified_admin())
WITH CHECK (public.is_verified_admin());

CREATE POLICY "ADMs podem ler mensagens do chat do app"
ON public.app_chat_messages FOR SELECT
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
      'action', 'app_chat',
      'description', 'Criadas app_chat_conversations e app_chat_messages (chat com a IA de Suporte dentro do app)',
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
