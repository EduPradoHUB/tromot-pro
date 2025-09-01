
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

    console.log('Updating admin profile with service role client...');

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, try to find the user by email in profiles table
    const { data: existingProfile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'eduardo@tromot.com.br')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding profile:', findError);
      throw findError;
    }

    if (existingProfile) {
      console.log('Found existing profile, updating role...');
      
      // Update existing profile to ADM role
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'ADM' })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('Error updating profile role:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Perfil atualizado para ADM com sucesso',
          user_id: existingProfile.user_id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Profile not found, user may not exist yet');
      
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não encontrado',
          message: 'Faça login primeiro para criar o perfil, depois tente novamente' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao atualizar usuário admin',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
