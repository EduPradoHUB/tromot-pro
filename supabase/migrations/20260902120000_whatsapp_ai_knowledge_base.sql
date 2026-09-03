-- ============================================================
-- IA de Suporte Técnico via WhatsApp
-- Base de conhecimento (RAG com pgvector) + histórico de conversas
-- ============================================================

-- 1. Extensão pgvector (schema "extensions", já no search_path do projeto)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- 2. Base de conhecimento (o que você ensina para a IA)
-- ============================================================
-- Dimensão do vetor: 1024, compatível com o modelo de embeddings
-- "voyage-3" (recomendado). Se trocar de modelo/dimensão, ajuste aqui
-- e reprocesse os embeddings existentes (veja ARCHITECTURE_WHATSAPP_IA.md).
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  situation TEXT NOT NULL,       -- a pergunta/cenário (ex: "como instalar X no Y sem chicote pronto")
  solution TEXT NOT NULL,        -- sua orientação/solução em texto
  category TEXT,                 -- ex: 'iluminacao', 'audio', 'canceller', 'geral'
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  image_url TEXT,                -- foto opcional (ex: chicote, pinagem)
  embedding extensions.vector(1024),
  status content_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_base_embedding_idx ON public.knowledge_base
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX knowledge_base_category_idx ON public.knowledge_base (category);
CREATE INDEX knowledge_base_product_idx ON public.knowledge_base (product_id);

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Só ADM e Técnico Tromot administram a base de conhecimento.
-- O bot do WhatsApp lê usando a service_role key (bypassa RLS), então
-- não existe policy pública/anônima aqui de propósito.
CREATE POLICY "ADMs e Técnicos gerenciam a base de conhecimento"
ON public.knowledge_base FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot')
  )
);

-- Função de busca semântica (chamada pela edge function whatsapp-webhook
-- via service_role, e também reaproveitável no admin se precisar).
CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  query_embedding extensions.vector(1024),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  situation TEXT,
  solution TEXT,
  category TEXT,
  product_id UUID,
  image_url TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    kb.id, kb.title, kb.situation, kb.solution, kb.category, kb.product_id, kb.image_url,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.status = 'active'
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Nenhum grant para anon/authenticated: só service_role chama esta função
-- (a edge function usa a service key). Reforça que dados de instalação
-- não vazam por consulta direta do app público.
REVOKE ALL ON FUNCTION public.match_knowledge_base(extensions.vector, float, int) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 3. Link de compra por produto (loja Tray: tromotstore.com.br)
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_url TEXT;
COMMENT ON COLUMN public.products.store_url IS 'URL da página do produto em https://tromotstore.com.br/ (enviada pela IA do WhatsApp quando o cliente quer comprar)';

-- ============================================================
-- 4. Conversas e mensagens do WhatsApp (histórico + auditoria)
-- ============================================================
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,          -- número normalizado (ex: 5516999998888)
  customer_name TEXT,
  customer_type public.customer_type,  -- lojista_instalador / distribuidor_representante / usuario_final
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

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'document', 'audio', 'video')),
  tool_name TEXT,          -- quando role = 'tool', qual ferramenta foi usada
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_messages_conversation_idx ON public.whatsapp_messages (conversation_id, created_at);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Só ADM (via painel) pode LER as conversas — nunca escrever direto
-- (só a edge function, com service_role, grava mensagens).
CREATE POLICY "ADMs podem ler conversas do WhatsApp"
ON public.whatsapp_conversations FOR SELECT
USING (public.is_verified_admin());

CREATE POLICY "ADMs podem atualizar status/escalonamento"
ON public.whatsapp_conversations FOR UPDATE
USING (public.is_verified_admin())
WITH CHECK (public.is_verified_admin());

CREATE POLICY "ADMs podem ler mensagens do WhatsApp"
ON public.whatsapp_messages FOR SELECT
USING (public.is_verified_admin());

-- ============================================================
-- 5. Bucket de storage para fotos anexadas à base de conhecimento
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ADMs e Técnicos podem enviar fotos da base de conhecimento"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot')
  )
);

CREATE POLICY "Fotos da base de conhecimento são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base');

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
      'action', 'whatsapp_ai_knowledge_base',
      'description', 'Criadas tabelas knowledge_base, whatsapp_conversations, whatsapp_messages, coluna products.store_url, extensão pgvector e função match_knowledge_base',
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
