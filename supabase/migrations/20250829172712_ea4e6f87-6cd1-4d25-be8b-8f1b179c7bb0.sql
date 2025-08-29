-- Primeiro, vamos verificar se o usuário já existe e limpar se necessário
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Tentar encontrar o usuário existente na auth.users pelo email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@tromot.com';
    
    -- Se não existe, criar um novo UUID para o usuário
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        -- Inserir diretamente na auth.users com todos os campos necessários
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at,
            is_anonymous
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@tromot.com',
            '$2a$10$5j7tq8zGa9v.q8yIUZyH7.YvCvDK8m6KsDV0Q1L.Hl6OZvFJ6qO1S', -- hash para 'demo123'
            now(),
            NULL,
            '',
            NULL,
            '',
            NULL,
            '',
            '',
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Admin Tromot"}',
            false,
            now(),
            now(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL,
            false
        );
    END IF;
    
    -- Atualizar o profiles para usar o user_id correto
    UPDATE profiles 
    SET user_id = admin_user_id
    WHERE email = 'admin@tromot.com';
    
END $$;