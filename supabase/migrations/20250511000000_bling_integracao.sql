-- Migration: Integração Bling
-- Tabela de tokens OAuth do Bling (apenas service_role acessa)
create table if not exists bling_tokens (
  id          integer primary key default 1,
    access_token  text not null,
      refresh_token text not null,
        expires_at    timestamptz not null,
          updated_at    timestamptz default now()
          );
          alter table bling_tokens enable row level security;
          -- Sem policy = somente service_role acessa

          -- Tabela de clientes sincronizados do Bling
          create table if not exists clientes (
            id          uuid primary key default gen_random_uuid(),
              bling_id    bigint unique not null,
                nome        text not null,
                  documento   text,
                    email       text,
                      telefone    text,
                        cidade      text,
                          uf          char(2),
                            cep         text,
                              endereco    text,
                                situacao    char(1) default 'A',
                                  vendedor_id uuid references auth.users(id) on delete set null,
                                    synced_at   timestamptz,
                                      created_at  timestamptz default now()
                                      );

                                      alter table clientes enable row level security;

                                      -- Vendedor vê somente seus clientes; admin vê todos
                                      create policy "vendedor_ve_seus_clientes"
                                        on clientes for select
                                          using (
                                              vendedor_id = auth.uid()
                                                  or exists (
                                                        select 1 from profiles
                                                              where id = auth.uid() and role = 'admin'
                                                                  )
                                                                    );

                                                                    create policy "vendedor_insere_cliente"
                                                                      on clientes for insert
                                                                        with check (
                                                                            vendedor_id = auth.uid()
                                                                                or exists (
                                                                                      select 1 from profiles
                                                                                            where id = auth.uid() and role = 'admin'
                                                                                                )
                                                                                                  );

                                                                                                  create policy "admin_atualiza_cliente"
                                                                                                    on clientes for update
                                                                                                      using (
                                                                                                          exists (
                                                                                                                select 1 from profiles
                                                                                                                      where id = auth.uid() and role = 'admin'
                                                                                                                          )
                                                                                                                            );
                                                                                                                            
                                                                                                                            -- Index para buscas rápidas
                                                                                                                            create index if not exists clientes_vendedor_id_idx on clientes(vendedor_id);
                                                                                                                            create index if not exists clientes_bling_id_idx on clientes(bling_id);
                                                                                                                            create index if not exists clientes_nome_idx on clientes using gin(to_tsvector('portuguese', nome));
                                                                                                                            
