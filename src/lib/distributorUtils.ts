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
 * Agora usando função sem SECURITY DEFINER para maior segurança
 */
export const fetchDistributorsPublic = async (state?: string, city?: string): Promise<DistributorPublic[]> => {
  try {
    const { data, error } = await supabase
      .rpc('search_distributors_masked', {
        p_state: state || null,
        p_city: city || null
      });

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
 * Obtém dados completos de contato de um distributor específico
 * Agora usando função sem SECURITY DEFINER que usa RLS policies
 */
export const getDistributorContact = async (distributorId: string): Promise<DistributorContact | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_distributor_full_contact', {
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