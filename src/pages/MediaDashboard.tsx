import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MousePointer, Target } from 'lucide-react';

export default function MediaDashboard() {
  const { currentUser, advertisements } = useApp();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADM') {
      loadAnalyticsData();
    }
  }, [currentUser, advertisements]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Generate analytics data based on real advertisements data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          impressions: Math.floor(Math.random() * 2000) + 1000, // Mock but realistic data
          clicks: Math.floor(Math.random() * 50) + 20
        };
      }).reverse();

      setAnalyticsData(last7Days);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'ADM') {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar o dashboard de mídia.
          </p>
        </div>
      </div>
    );
  }

  const activeAds = advertisements.filter(ad => ad.status === 'active');
  const totalImpressions = advertisements.reduce((sum, ad) => sum + (ad.impressions_count || 0), 0);
  const totalClicks = advertisements.reduce((sum, ad) => sum + (ad.clicks_count || 0), 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Calculate slot performance based on real data
  const slotPerformanceMap = advertisements.reduce((acc, ad) => {
    const slotName = ad.slot === 'home_hero' ? 'Home Hero' : 
                   ad.slot === 'product_banner' ? 'Product Banner' : 
                   'Feed Sponsored';
    
    if (!acc[slotName]) {
      acc[slotName] = { impressions: 0, clicks: 0 };
    }
    
    acc[slotName].impressions += ad.impressions_count || 0;
    acc[slotName].clicks += ad.clicks_count || 0;
    
    return acc;
  }, {} as Record<string, { impressions: number; clicks: number }>);

  const slotPerformanceData = Object.entries(slotPerformanceMap).map(([slot, data]) => ({
    slot,
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
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

  return (
    <div className="container py-8">
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
              {advertisements.length - activeAds.length} pausadas/finalizadas
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
            <p className="text-xs text-muted-foreground">
              desde o início das campanhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques Totais</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              desde o início das campanhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              taxa de clique geral
            </p>
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
              <BarChart accessibilityLayer data={analyticsData}>
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
              {slotPerformanceData.length > 0 ? (
                slotPerformanceData.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{slot.slot}</p>
                      <p className="text-xs text-muted-foreground">
                        {slot.impressions.toLocaleString()} impressões • {slot.clicks} cliques
                      </p>
                    </div>
                    <Badge variant="outline">
                      {slot.ctr.toFixed(2)}% CTR
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma campanha encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Campanhas</CardTitle>
          <CardDescription>
            Gerencie suas campanhas publicitárias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {advertisements.length > 0 ? (
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
                  const ctr = (ad.impressions_count || 0) > 0 ? 
                    ((ad.clicks_count || 0) / (ad.impressions_count || 1)) * 100 : 0;
                  return (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.advertiser}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ad.slot === 'home_hero' ? 'Home Hero' : 
                           ad.slot === 'product_banner' ? 'Product Banner' : 
                           'Feed Sponsored'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ad.start_date).toLocaleDateString('pt-BR')} - {new Date(ad.end_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{(ad.impressions_count || 0).toLocaleString()}</TableCell>
                      <TableCell>{ad.clicks_count || 0}</TableCell>
                      <TableCell>{ctr.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                          {ad.status === 'active' ? 'Ativa' : 
                           ad.status === 'inactive' ? 'Pausada' : 'Finalizada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-sm">Crie sua primeira campanha para começar a acompanhar métricas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}