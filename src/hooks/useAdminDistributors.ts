import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';

type Distributor = Database['public']['Tables']['distributors']['Row'];
type DistributorInsert = Database['public']['Tables']['distributors']['Insert'];

/**
 * Hook específico para admins acessarem dados completos de distribuidores
 * Usado apenas em contextos administrativos
 */
export const useAdminDistributors = () => {
  console.log('🔧 useAdminDistributors: Iniciando hook');
  
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDistributors = async () => {
    console.log('🔧 useAdminDistributors: Buscando distribuidores');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('name');

      if (error) throw error;
      setDistributors(data || []);
      console.log('✅ useAdminDistributors: Distribuidores carregados:', data?.length);
    } catch (error) {
      console.error('❌ useAdminDistributors: Erro ao buscar distribuidores:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDistributor = async (data: DistributorInsert): Promise<Distributor> => {
    console.log('🔧 useAdminDistributors: Criando distribuidor');
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
    console.log('🔧 useAdminDistributors: Atualizando distribuidor:', id);
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
    console.log('🔧 useAdminDistributors: Deletando distribuidor:', id);
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    await fetchDistributors(); // Refresh list
  };

  useEffect(() => {
    console.log('🔧 useAdminDistributors: useEffect chamado');
    fetchDistributors();
  }, []);

  console.log('🔧 useAdminDistributors: Retornando dados');
  return {
    distributors,
    loading,
    createDistributor,
    updateDistributor,
    deleteDistributor,
    refetch: fetchDistributors
  };
};