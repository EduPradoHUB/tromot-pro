import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/custom-alert-dialog';
import { Trash2, Users as UsersIcon, UserCheck, UserCog } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Users() {
  const { fetchAllProfiles, updateUserRole } = useApp();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await fetchAllProfiles();
      setProfiles(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'ADM' | 'Técnico Tromot' | 'Cliente') => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setProfiles(prev => 
        prev.map(profile => 
          profile.user_id === userId 
            ? { ...profile, role: newRole }
            : profile
        )
      );
      
      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o papel do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const { error: invokeError } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (invokeError) {
        throw new Error('Erro ao banir usuário');
      }

      // Remove from local state
      setProfiles(prev => prev.filter(profile => profile.user_id !== userId));
      
      toast({
        title: "Sucesso",
        description: `Usuário ${userName} foi banido com sucesso!`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível banir o usuário.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const roleStats = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const customerTypeStats = profiles.reduce((acc, profile) => {
      if (profile.customer_type) {
        acc[profile.customer_type] = (acc[profile.customer_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return { roleStats, customerTypeStats };
  }, [profiles]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADM':
        return 'destructive';
      case 'Técnico Tromot':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os papéis dos usuários do sistema
            </p>
          </div>
          <Button onClick={loadProfiles} variant="outline">
            Atualizar
          </Button>
        </div>

        {/* Estatísticas de Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.roleStats['ADM'] || 0}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.roleStats['Técnico Tromot'] || 0}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.roleStats['Cliente'] || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas por Tipo de Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lojistas/Instaladores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.customerTypeStats['lojista_instalador'] || 0}</div>
              <p className="text-xs text-muted-foreground">profissionais do setor</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distribuidores/Representantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.customerTypeStats['distribuidor_representante'] || 0}</div>
              <p className="text-xs text-muted-foreground">parceiros comerciais</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Usuários Finais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.customerTypeStats['usuario_final'] || 0}</div>
              <p className="text-xs text-muted-foreground">consumidores</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{profile.name}</h3>
                        {profile.customer_type && (
                          <Badge variant="secondary" className="text-xs">
                            {profile.customer_type === 'lojista_instalador' && 'Lojista/Instalador'}
                            {profile.customer_type === 'distribuidor_representante' && 'Distribuidor/Representante'}
                            {profile.customer_type === 'usuario_final' && 'Usuário Final'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{profile.email}</p>
                      {profile.phone && (
                        <p className="text-sm text-muted-foreground">📞 {profile.phone}</p>
                      )}
                      {profile.whatsapp && (
                        <a 
                          href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:underline"
                        >
                          💬 {profile.whatsapp}
                        </a>
                      )}
                      {profile.city && profile.state && (
                        <p className="text-sm text-muted-foreground">📍 {profile.city}, {profile.state}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {profile.role}
                    </Badge>
                    
                    <div className="relative">
                      <select
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.user_id, e.target.value as 'ADM' | 'Técnico Tromot' | 'Cliente')}
                        className="w-[180px] h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="Cliente">Cliente</option>
                        <option value="Técnico Tromot">Técnico Tromot</option>
                        <option value="ADM">ADM</option>
                      </select>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Banir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Banimento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja banir o usuário <strong>{profile.name}</strong>?
                            Esta ação é irreversível e o usuário será permanentemente removido do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(profile.user_id, profile.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirmar Banimento
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Criado em: {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>Última atualização: {new Date(profile.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}