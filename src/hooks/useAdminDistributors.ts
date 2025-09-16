import * as React from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';

type Distributor = Database['public']['Tables']['distributors']['Row'];
type DistributorInsert = Database['public']['Tables']['distributors']['Insert'];

/**
 * Hook específico para admins acessarem dados completos de distribuidores
 * Usado apenas em contextos administrativos
 */
export const useAdminDistributors = () => {
  const [distributors, setDistributors] = React.useState<Distributor[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('name');

      if (error) throw error;
      setDistributors(data || []);
    } catch (error) {
      console.error('Erro ao buscar distribuidores (admin):', error);
    } finally {
      setLoading(false);
    }
  };

  const createDistributor = async (data: DistributorInsert): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    
    await fetchDistributors(); // Refresh list
    return distributor;
  };

  const updateDistributor = async (id: string, data: Partial<DistributorInsert>): Promise<Distributor> => {
    const { data: distributor, error } = await supabase
      .from('distributors')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await fetchDistributors(); // Refresh list
    return distributor;
  };

  const deleteDistributor = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    await fetchDistributors(); // Refresh list
  };

  React.useEffect(() => {
    fetchDistributors();
  }, []);

  return {
    distributors,
    loading,
    createDistributor,
    updateDistributor,
    deleteDistributor,
    refetch: fetchDistributors
  };
};