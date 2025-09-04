-- 1) Criar ENUM para o tipo de usuário
CREATE TYPE public.customer_type AS ENUM (
  'lojista_instalador',
  'distribuidor_representante',
  'usuario_final'
);

-- 2) Adicionar colunas ao perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_type public.customer_type,
  ADD COLUMN IF NOT EXISTS whatsapp text;