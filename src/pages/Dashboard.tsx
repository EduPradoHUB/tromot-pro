import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Users, FileText, Heart, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { currentUser, products, ratings } = useApp();

  const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const emptyWeek = () => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), day: WEEK_LABELS[d.getDay()] };
    });
  };

  const [stats, setStats] = useState({ dau: 0, mau: 0, manual_views_today: 0, avg_rating: 0 });
  const [manualAccessData, setManualAccessData] = useState<Array<{ day: string; views: number }>>(
    emptyWeek().map((d) => ({ day: d.day, views: 0 }))
  );
  const [engagementData, setEngagementData] = useState<Array<{ day: string; posts: number; likes: number }>>(
    emptyWeek().map((d) => ({ day: d.day, posts: 0, likes: 0 }))
  );

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const start30 = new Date(now); start30.setDate(now.getDate() - 30);
      const start7 = new Date(now); start7.setDate(now.getDate() - 6); start7.setHours(0, 0, 0, 0);

      const [todayEvents, monthEvents, weekManualEvents, weekPosts, weekLikes, ratingsAgg] = await Promise.all([
        supabase.from('analytics_events').select('user_id, event_type, created_at').gte('created_at', startToday.toISOString()),
        supabase.from('analytics_events').select('user_id').gte('created_at', start30.toISOString()),
        supabase.from('analytics_events').select('created_at').eq('event_type', 'view_manual').gte('created_at', start7.toISOString()),
        supabase.from('posts').select('created_at').gte('created_at', start7.toISOString()),
        supabase.from('post_likes').select('created_at').gte('created_at', start7.toISOString()),
        supabase.from('ratings').select('rating'),
      ]);

      const dauUsers = new Set((todayEvents.data || []).map((e: any) => e.user_id).filter(Boolean));
      const mauUsers = new Set((monthEvents.data || []).map((e: any) => e.user_id).filter(Boolean));
      const manualViewsToday = (todayEvents.data || []).filter((e: any) => e.event_type === 'view_manual').length;
      const ratingsArr = (ratingsAgg.data || []).map((r: any) => Number(r.rating)).filter((n) => !isNaN(n));
      const avgRating = ratingsArr.length ? ratingsArr.reduce((s, n) => s + n, 0) / ratingsArr.length : 0;

      setStats({
        dau: dauUsers.size,
        mau: mauUsers.size,
        manual_views_today: manualViewsToday,
        avg_rating: avgRating,
      });

      const week = emptyWeek();
      const bucket: Record<string, { views: number; posts: number; likes: number }> = {};
      week.forEach((d) => (bucket[d.date] = { views: 0, posts: 0, likes: 0 }));
      (weekManualEvents.data || []).forEach((e: any) => {
        const k = new Date(e.created_at).toISOString().slice(0, 10);
        if (bucket[k]) bucket[k].views += 1;
      });
      (weekPosts.data || []).forEach((p: any) => {
        const k = new Date(p.created_at).toISOString().slice(0, 10);
        if (bucket[k]) bucket[k].posts += 1;
      });
      (weekLikes.data || []).forEach((l: any) => {
        const k = new Date(l.created_at).toISOString().slice(0, 10);
        if (bucket[k]) bucket[k].likes += 1;
      });

      setManualAccessData(week.map((d) => ({ day: d.day, views: bucket[d.date].views })));
      setEngagementData(week.map((d) => ({ day: d.day, posts: bucket[d.date].posts, likes: bucket[d.date].likes })));
    };
    load();
  }, []);

  if (!currentUser || currentUser.role !== 'ADM') {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito para administradores.</p>
      </div>
    );
  }

  // Real category distribution from products
  const palette = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))'];
  const catCounts = products.reduce<Record<string, number>>((acc, p) => {
    const key = (p.category || 'Sem categoria').trim() || 'Sem categoria';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const topCats = catEntries.slice(0, 4);
  const otherTotal = catEntries.slice(4).reduce((s, [, v]) => s + v, 0);
  const categoryData = [
    ...topCats.map(([name, value], i) => ({ name, value, color: palette[i] })),
    ...(otherTotal > 0 ? [{ name: 'Outros', value: otherTotal, color: palette[4] }] : []),
  ];

  const topProducts = products
    .sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0))
    .slice(0, 10);

  const recentRatings = ratings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Métricas e insights do Tromot Pro</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dau}</div>
            <p className="text-xs text-muted-foreground">usuários ativos hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MAU</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mau}</div>
            <p className="text-xs text-muted-foreground">usuários ativos no mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manuais Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manual_views_today}</div>
            <p className="text-xs text-muted-foreground">visualizações hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">de 5.0 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Acessos a Manuais (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={manualAccessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Engajamento (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="hsl(var(--primary))" name="Posts" />
                <Bar dataKey="likes" fill="hsl(var(--secondary))" name="Likes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Produtos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top 10 Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.code}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.rating_count} avaliações
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Ratings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Avaliações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRatings.map((rating) => (
              <div key={rating.id} className="border-b border-border/50 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{rating.author_name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{rating.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rating.comment}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}