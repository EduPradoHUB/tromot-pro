-- Inserir usuário admin@tromot.com na tabela de autenticação
-- O password_hash é para a senha 'demo123'
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,  
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@tromot.com',
  '$2a$10$5j7tq8zGa9v.q8yIUZyH7.YvCvDK8m6KsDV0Q1L.Hl6OZvFJ6qO1S', -- hash para 'demo123' 
  now(),
  now(),
  now(),
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = now(),
  confirmation_token = '',
  email_change_token_new = '',
  recovery_token = '';

-- Atualizar o perfil existente para usar o ID do usuário de autenticação
UPDATE profiles 
SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@tromot.com')
WHERE email = 'admin@tromot.com';