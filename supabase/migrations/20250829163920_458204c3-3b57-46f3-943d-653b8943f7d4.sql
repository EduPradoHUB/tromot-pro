-- Criar usuário admin usando uma função que simula o signup
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Primeiro, tentar encontrar se o usuário já existe
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@tromot.com';
  
  -- Se não existir, gerar um ID único
  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();
    
    -- Inserir na tabela auth.users (método simplificado para teste)
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@tromot.com',
      crypt('demo123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Administrador Tromot"}',
      false
    );
  END IF;
  
  -- Inserir ou atualizar o profile
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (admin_user_id, 'Administrador Tromot', 'admin@tromot.com', 'ADM'::user_role)
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
END $$;