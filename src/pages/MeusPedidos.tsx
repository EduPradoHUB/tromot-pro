import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';

interface Pedido {
  id: string;
  cliente_nome: string | null;
  valor_total: number;
  comissao: number;
  status: string;
  created_at: string;
}

const brl = (v: number) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MeusPedidos() {
  const { user, profile } = useApp();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from('pedidos')
        .select('id, cliente_nome, valor_total, comissao, status, created_at')
        .order('created_at', { ascending: false });

      if (profile?.role !== 'ADM' && user?.id) {
        query = query.eq('vendedor_id', user.id);
      }

      const { data } = await query;
      setPedidos((data as Pedido[]) || []);
      setLoading(false);
    };
    load();
  }, [user?.id, profile?.role]);

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground text-sm">
            {profile?.role === 'ADM' ? 'Todos os pedidos registrados' : 'Pedidos criados por você'}
          </p>
        </div>
        <Button asChild>
          <Link to="/novo-pedido">
            <Plus className="h-4 w-4 mr-1" />
            Novo Pedido
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Nenhum pedido encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <Card key={p.id} className="shadow-card">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.cliente_nome || 'Cliente não informado'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{brl(p.valor_total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="font-semibold">{brl(p.comissao)}</p>
                  </div>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
