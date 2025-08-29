-- Criar usuário admin real eduardo@tromot.com.br
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Gerar UUID para o novo usuário admin
    admin_user_id := gen_random_uuid();
    
    -- Inserir na auth.users
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
        'eduardo@tromot.com.br',
        '$2a$10$5WJMjBo7JKXBziq/L.dvYeX/VpwD.OznuXGwztNlqN3yXGGBxRdpe', -- hash para '123456'
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
        '{"name": "Eduardo Admin"}',
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
    
    -- Inserir ou atualizar no profiles
    INSERT INTO profiles (user_id, name, email, role)
    VALUES (admin_user_id, 'Eduardo Admin', 'eduardo@tromot.com.br', 'ADM')
    ON CONFLICT (user_id) DO UPDATE SET
        name = 'Eduardo Admin',
        email = 'eduardo@tromot.com.br',
        role = 'ADM';
    
END $$;