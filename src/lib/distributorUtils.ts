import { supabase } from "@/integrations/supabase/client";

// Tipo para dados públicos mascarados do distribuidor
export type DistributorPublic = {
  id: string;
  name: string;
  state: string;
  city: string;
  cover_entire_state: boolean;
  active: boolean;
  created_at: string;
  phone_display: string | null;
  whatsapp_display: string | null;
  has_contact: boolean;
};

// Tipo para dados completos do distribuidor
export type DistributorContact = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  state: string;
  city: string;
  cover_entire_state: boolean;
};

/**
 * Busca distribuidores com dados mascarados (seguro para exibição por região)
 * Tenta usar função segura primeiro, com fallback para consulta básica não autenticada
 */
export const fetchDistributorsPublic = async (state?: string, city?: string): Promise<DistributorPublic[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // First try the secure function only for authenticated users
    const { data, error } = session?.user
      ? await supabase.rpc('search_distributors_secure', {
          p_state: state || null,
          p_city: city || null
        })
      : { data: null, error: { message: 'Usuário não autenticado' } };

    if (error) {
      // Fallback only when state was provided. NEVER return all distributors
      // — that would expose distributors of other regions to the user.
      if (!state) {
        return [];
      }

      let query = supabase
        .from('distributors')
        .select('id, name, state, city, cover_entire_state, active, created_at')
        .eq('active', true)
        .eq('state', state);

      if (city) {
        // Match exact city OR distributors that cover the entire state
        query = query.or(`city.eq.${city},cover_entire_state.eq.true`);
      }

      const { data: basicData, error: basicError } = await query.limit(50);

      if (basicError) {
        console.error('Erro ao buscar distribuidores básicos:', basicError);
        return [];
      }

      return (basicData || []).map(distributor => ({
        ...distributor,
        phone_display: null,
        whatsapp_display: null,
        has_contact: false,
      }));
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar distribuidores públicos:', error);
    // Return empty array instead of throwing to prevent breaking the entire app
    return [];
  }
};

/**
 * Obtém dados completos de contato de um distribuidor específico
 * Agora usando função segura que verifica localização do usuário
 */
export const getDistributorContact = async (distributorId: string): Promise<DistributorContact | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_distributor_contact_secure', {
        distributor_id: distributorId
      });

    if (error) {
      console.error('Erro ao obter contato do distribuidor:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro ao obter contato do distribuidor:', error);
    throw error;
  }
};

/**
 * Registra acesso a distribuidor para auditoria
 */
export const logDistributorAccess = async (
  distributorId: string,
  accessType: 'view' | 'contact_access' | 'search',
  userLocation?: { city?: string; state?: string }
) => {
  try {
    const { error } = await supabase
      .rpc('log_distributor_access', {
        p_distributor_id: distributorId,
        p_access_type: accessType,
        p_user_location: userLocation ? JSON.stringify(userLocation) : null
      });

    if (error) {
      console.error('Erro ao registrar acesso ao distribuidor:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar acesso ao distribuidor:', error);
  }
};