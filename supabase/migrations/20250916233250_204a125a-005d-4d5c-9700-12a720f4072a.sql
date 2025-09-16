-- Atualizar usuários existentes sem customer_type definido
UPDATE public.profiles 
SET customer_type = 'usuario_final'
WHERE customer_type IS NULL;

-- Definir valor padrão para novos usuários
ALTER TABLE public.profiles 
ALTER COLUMN customer_type SET DEFAULT 'usuario_final';