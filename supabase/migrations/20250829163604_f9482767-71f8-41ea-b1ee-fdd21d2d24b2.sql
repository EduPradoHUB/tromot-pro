-- Inserir usuário admin de teste
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@tromot.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Inserir profile correspondente
INSERT INTO public.profiles (user_id, name, email, role)
SELECT 
  id, 
  'Administrador Tromot', 
  'admin@tromot.com', 
  'ADM'::user_role
FROM auth.users 
WHERE email = 'admin@tromot.com';