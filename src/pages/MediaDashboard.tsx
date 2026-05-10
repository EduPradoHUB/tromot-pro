import * as React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MousePointer, Target } from 'lucide-react';
import { AdminBroadcastCard } from '@/components/notifications/AdminBroadcastCard';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { supabase } from '@/integrations/supabase/client';

export default function MediaDashboard() {
  const {
    currentUser,
    advertisements,
  } = useApp();

  const SLOT_LABELS: Record<string, string> = {
    home_hero: 'Home Hero',
    product_banner: 'Product Banner',
    feed_sponsored: 'Feed Sponsored',
  };

  const [impressionsData, setImpressionsData] = React.useState<Array<{ date: string; impressions: number; clicks: number }>>([]);

  React.useEffect(() => {
    const load = async () => {
      const start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .in('event_type', ['ad_impression', 'ad_click'])
        .gte('created_at', start.toISOString());

      const days: Array<{ date: string; label: string }> = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days.push({ date: key, label });
      }
      const bucket: Record<string, { impressions: number; clicks: number }> = {};
      days.forEach((d) => (bucket[d.date] = { impressions: 0, clicks: 0 }));
      (data || []).forEach((e: any) => {
        const k = new Date(e.created_at).toISOString().slice(0, 10);
        if (!bucket[k]) return;
        if (e.event_type === 'ad_impression') bucket[k].impressions += 1;
        else if (e.event_type === 'ad_click') bucket[k].clicks += 1;
      });
      setImpressionsData(days.map((d) => ({ date: d.label, ...bucket[d.date] })));
    };
    load();
  }, []);

  if (!currentUser || currentUser.role !== 'ADM') {
    return <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar o dashboard de mídia.
          </p>
        </div>
      </div>;
  }
  const activeAds = advertisements.filter(ad => ad.status === 'active');
  const totalImpressions = advertisements.reduce((sum, ad) => sum + ad.impressions_count, 0);
  const totalClicks = advertisements.reduce((sum, ad) => sum + ad.clicks_count, 0);
  const overallCTR = totalImpressions > 0 ? totalClicks / totalImpressions * 100 : 0;

  // Real performance per slot, aggregated from advertisements
  const slotMap: Record<string, { impressions: number; clicks: number }> = {};
  advertisements.forEach((ad) => {
    const key = ad.slot;
    if (!slotMap[key]) slotMap[key] = { impressions: 0, clicks: 0 };
    slotMap[key].impressions += ad.impressions_count || 0;
    slotMap[key].clicks += ad.clicks_count || 0;
  });
  const slotPerformanceData = Object.entries(slotMap).map(([slot, v]) => ({
    slot: SLOT_LABELS[slot] || slot,
    impressions: v.impressions,
    clicks: v.clicks,
    ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
  }));
  const chartConfig: ChartConfig = {
    impressions: {
      label: "Impressões",
      color: "hsl(var(--primary))"
    },
    clicks: {
      label: "Cliques",
      color: "hsl(var(--secondary))"
    }
  };
  return <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Mídia</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho dos anúncios e campanhas
          </p>
        </div>
        <Button onClick={() => window.location.href = '/admin'}>
          Nova Campanha
        </Button>
      </div>

      {/* Sistema de Notificações - Apenas para ADMIN */}
      <div className="mb-8">
        <AdminBroadcastCard />
        <NotificationPreferences />
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAds.length}</div>
            <p className="text-xs text-muted-foreground">
              {advertisements.length - activeAds.length} pausadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões Totais</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques Totais</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">cliques / impressões</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Impressões e Cliques */}
        <Card>
          <CardHeader>
            <CardTitle>Impressões e Cliques (Últimos 7 dias)</CardTitle>
            <CardDescription>
              Acompanhe o volume de impressões e cliques diários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={impressionsData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="impressions" fill="var(--color-impressions)" radius={4} />
                <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance por Slot */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Slot</CardTitle>
            <CardDescription>
              CTR por tipo de posicionamento de anúncio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slotPerformanceData.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados de slots ainda.</p>
              )}
              {slotPerformanceData.map((slot, index) => <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{slot.slot}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.impressions.toLocaleString()} impressões • {slot.clicks} cliques
                    </p>
                  </div>
                  <Badge variant="outline">
                    {slot.ctr.toFixed(2)}% CTR
                  </Badge>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas Ativas</CardTitle>
          <CardDescription>
            Gerencie suas campanhas publicitárias ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anunciante</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Impressões</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisements.map(ad => {
              const ctr = ad.impressions_count > 0 ? ad.clicks_count / ad.impressions_count * 100 : 0;
              return <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.advertiser}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ad.slot === 'home_hero' ? 'Home Hero' : ad.slot === 'product_banner' ? 'Product Banner' : 'Feed Sponsored'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{ad.impressions_count.toLocaleString()}</TableCell>
                    <TableCell>{ad.clicks_count}</TableCell>
                    <TableCell>{ctr.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                        {ad.status === 'active' ? 'Ativa' : ad.status === 'inactive' ? 'Pausada' : 'Finalizada'}
                      </Badge>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
}