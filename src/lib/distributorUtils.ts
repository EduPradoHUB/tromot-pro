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
 * Busca distribuidores com dados mascarados (seguro para exibição geral)
 */
export const fetchDistributorsPublic = async (state?: string, city?: string): Promise<DistributorPublic[]> => {
  try {
    let query = supabase
      .from('distributors_public')
      .select('*')
      .eq('active', true);

    if (state && city) {
      query = query.or(`and(state.eq.${state},city.eq.${city}),and(state.eq.${state},cover_entire_state.eq.true)`);
    } else if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar distribuidores públicos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar distribuidores públicos:', error);
    throw error;
  }
};

/**
 * Obtém dados completos de contato de um distribuidor específico
 * Registra o acesso para auditoria de segurança
 */
export const getDistributorContact = async (distributorId: string): Promise<DistributorContact | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_distributor_contact', {
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