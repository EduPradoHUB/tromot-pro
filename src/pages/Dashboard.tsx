import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Users, FileText, Heart, Star, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, getDashboardStats, products, ratings, posts } = useApp();

  if (!currentUser || currentUser.role !== 'ADM') {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito para administradores.</p>
      </div>
    );
  }

  const stats = getDashboardStats();
  
  // Mock data for charts
  const manualAccessData = [
    { day: 'Seg', views: 45 },
    { day: 'Ter', views: 62 },
    { day: 'Qua', views: 38 },
    { day: 'Qui', views: 71 },
    { day: 'Sex', views: 89 },
    { day: 'Sáb', views: 34 },
    { day: 'Dom', views: 28 },
  ];

  const engagementData = [
    { day: 'Seg', posts: 3, likes: 15 },
    { day: 'Ter', posts: 5, likes: 28 },
    { day: 'Qua', posts: 2, likes: 12 },
    { day: 'Qui', posts: 7, likes: 35 },
    { day: 'Sex', posts: 4, likes: 22 },
    { day: 'Sáb', posts: 6, likes: 31 },
    { day: 'Dom', posts: 3, likes: 18 },
  ];

  const categoryData = [
    { name: 'Alarmes', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Vidros Elétricos', value: 25, color: 'hsl(var(--secondary))' },
    { name: 'Travas', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Sensores', value: 15, color: 'hsl(var(--muted))' },
    { name: 'Outros', value: 5, color: 'hsl(var(--border))' },
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