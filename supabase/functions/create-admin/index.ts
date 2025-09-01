import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    // Verify admin setup token
    if (token !== Deno.env.get('ADMIN_SETUP_TOKEN')) {
      console.log('Invalid admin setup token provided');
      return new Response(
        JSON.stringify({ error: 'Token de configuração inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating admin user with service role client...');

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if admin already exists by listing users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = users.users.find(user => user.email === 'eduardo@tromot.com.br');
    
    if (existingUser) {
      console.log('Admin user already exists, updating profile...');
      
      // Update profile to ensure correct role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: existingUser.id,
          name: 'Eduardo Admin',
          email: 'eduardo@tromot.com.br',
          role: 'ADM'
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário admin já existe e foi atualizado',
          user_id: existingUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new admin user
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'eduardo@tromot.com.br',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        name: 'Eduardo Admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('Admin user created successfully:', newUser.user?.id);

    // Create/update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: newUser.user!.id,
        name: 'Eduardo Admin',
        email: 'eduardo@tromot.com.br',
        role: 'ADM'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('Admin setup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário admin criado com sucesso',
        user_id: newUser.user!.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao criar usuário admin',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});