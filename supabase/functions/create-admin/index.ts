
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

    console.log('Creating/updating admin user with service role client...');

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, try to create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'eduardo@tromot.com.br',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        name: 'Eduardo Tromot'
      }
    });

    if (userError) {
      if (userError.message.includes('User already registered')) {
        console.log('User already exists, finding and updating profile...');
        
        // Find existing user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'eduardo@tromot.com.br');
        
        if (existingUser) {
          // Update profile to ADM role
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'ADM' })
            .eq('user_id', existingUser.id);

          if (updateError) {
            console.error('Error updating profile role:', updateError);
            throw updateError;
          }

          console.log('Profile updated to ADM successfully');

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Usuário existente atualizado para ADM com sucesso' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error('Error creating user:', userError);
        throw userError;
      }
    } else {
      console.log('Admin user created successfully');
      
      // The profile should be created automatically by the trigger
      // But let's update the role to ADM
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'ADM' })
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Error updating new user role:', updateError);
        // Don't throw here, user was created successfully
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário admin criado com sucesso! Use email: eduardo@tromot.com.br e senha: 123456' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao criar/atualizar usuário admin',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
