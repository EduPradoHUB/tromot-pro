-- Tabela de pedidos (registro local para comissao e relatorios)
create table if not exists pedidos (
  id           uuid primary key default gen_random_uuid(),
  bling_id     bigint,                        -- ID gerado no Bling apos envio
  vendedor_id  uuid references auth.users(id) on delete set null,
  cliente_bling_id bigint not null,
  cliente_nome text not null,
  valor_total  numeric(12,2) not null default 0,
  observacoes  text,
  status       text default 'enviado',        -- enviado | aprovado | faturado | cancelado
  status_bling text,                          -- status sincronizado do Bling via webhook
  itens_json   jsonb,                         -- snapshot dos itens no momento do pedido
  comissao_pct numeric(5,2) default 3.0,      -- % de comissao do vendedor (editavel pelo admin)
  comissao_valor numeric(12,2) generated always as (valor_total * comissao_pct / 100) stored,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table pedidos enable row level security;

-- Vendedor ve somente seus pedidos
create policy "vendedor_ve_seus_pedidos"
  on pedidos for select
  using (
    vendedor_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "vendedor_insere_pedido"
  on pedidos for insert
  with check (vendedor_id = auth.uid());

create policy "admin_atualiza_pedido"
  on pedidos for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Indexes
create index if not exists pedidos_vendedor_id_idx on pedidos(vendedor_id);
create index if not exists pedidos_created_at_idx on pedidos(created_at desc);
create index if not exists pedidos_bling_id_idx on pedidos(bling_id);

-- View de comissoes por vendedor e mes (usada no relatorio)
create or replace view relatorio_comissao as
select
  p.vendedor_id,
  pr.full_name   as vendedor_nome,
  date_trunc('month', p.created_at) as mes,
  count(*)       as total_pedidos,
  sum(p.valor_total) as valor_total,
  sum(p.comissao_valor) as total_comissao
from pedidos p
left join profiles pr on pr.id = p.vendedor_id
where p.status != 'cancelado'
group by p.vendedor_id, pr.full_name, date_trunc('month', p.created_at)
order by mes desc, total_comissao desc;
