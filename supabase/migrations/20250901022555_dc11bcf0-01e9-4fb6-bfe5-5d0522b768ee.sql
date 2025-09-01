
-- 1) Tabela de roles e função has_role (sem recursão)

-- Criar tabela de papéis por usuário (reutilizando o enum existente public.user_role)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Função para checar papel (bypass RLS via SECURITY DEFINER)
create or replace function public.has_role(_user_id uuid, _role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

revoke all on function public.has_role(uuid, public.user_role) from public;
grant execute on function public.has_role(uuid, public.user_role) to authenticated;

-- Policies para user_roles
-- Admin pode gerenciar todos os roles
create policy if not exists "Admins can manage user_roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'ADM'))
with check (public.has_role(auth.uid(), 'ADM'));

-- Usuário pode ver seus próprios roles
create policy if not exists "Users can read own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());


-- 2) Corrigir RLS de profiles removendo recursão

-- Garantir RLS habilitado
alter table public.profiles enable row level security;

-- Dropar TODAS as policies existentes na tabela profiles (evita recursão herdada)
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.polname);
  end loop;
end $$;

-- Policies simples por dono
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (user_id = auth.uid());

-- Policies para admins (sem recursão, usando has_role)
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'ADM'));

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'ADM'))
with check (public.has_role(auth.uid(), 'ADM'));

-- Índice único pelo user_id (evita duplicidade de perfil)
create unique index if not exists profiles_user_id_unique on public.profiles(user_id);

-- 3) Semear o papel de ADM para o usuário do e-mail informado
-- OBS: se o usuário ainda não existir em auth.users, este insert não afetará nenhuma linha (sem erro)
insert into public.user_roles (user_id, role)
select u.id, 'ADM'::public.user_role
from auth.users u
where u.email = 'eduardo@tromot.com.br'
on conflict do nothing;

-- Opcional: refletir também em profiles.role para compatibilidade com o app atual
update public.profiles p
set role = 'ADM'::public.user_role
from auth.users u
where p.user_id = u.id
  and u.email = 'eduardo@tromot.com.br';
