
-- Índice para acelerar contagem por autor e status
create index if not exists idx_posts_author_status on public.posts (author_id, status);

-- Função para retornar leaderboard de instalações (posts aprovados)
create or replace function public.get_installation_leaderboard(limit_rows integer default 100)
returns table (
  user_id uuid,
  name text,
  avatar_url text,
  role user_role,
  posts_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with counts as (
    select author_id as user_id, count(*)::int as posts_count
    from public.posts
    where status = 'approved'
    group by author_id
  )
  select p.user_id, p.name, p.avatar_url, p.role, c.posts_count
  from counts c
  join public.profiles p on p.user_id = c.user_id
  order by c.posts_count desc
  limit coalesce(limit_rows, 100)
$$;

comment on function public.get_installation_leaderboard is
'Retorna ranking de usuários por quantidade de posts aprovados, incluindo dados públicos do perfil.';
