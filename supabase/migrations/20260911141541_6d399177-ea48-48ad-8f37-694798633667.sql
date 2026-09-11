
-- CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bling_id bigint NOT NULL UNIQUE,
  nome text NOT NULL,
  documento text,
  email text,
  telefone text,
  cidade text,
  uf text,
  cep text,
  endereco text,
  situacao text DEFAULT 'A',
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam clientes"
ON public.clientes FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADM')
WITH CHECK (public.get_current_user_role() = 'ADM');

CREATE POLICY "Vendedores veem clientes"
ON public.clientes FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'Vendedor');

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bling_id bigint,
  vendedor_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_bling_id bigint,
  cliente_nome text,
  valor_total numeric NOT NULL DEFAULT 0,
  comissao numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'enviado',
  observacoes text,
  itens_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam pedidos"
ON public.pedidos FOR ALL TO authenticated
USING (public.get_current_user_role() = 'ADM')
WITH CHECK (public.get_current_user_role() = 'ADM');

CREATE POLICY "Vendedores veem os proprios pedidos"
ON public.pedidos FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'Vendedor' AND vendedor_id = auth.uid());

CREATE POLICY "Vendedores criam os proprios pedidos"
ON public.pedidos FOR INSERT TO authenticated
WITH CHECK (public.get_current_user_role() = 'Vendedor' AND vendedor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON public.pedidos(vendedor_id);

CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLING TOKENS (uso interno / service role)
CREATE TABLE IF NOT EXISTS public.bling_tokens (
  id integer PRIMARY KEY,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bling_tokens TO authenticated;
GRANT ALL ON public.bling_tokens TO service_role;

ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins consultam status do token Bling"
ON public.bling_tokens FOR SELECT TO authenticated
USING (public.get_current_user_role() = 'ADM');
