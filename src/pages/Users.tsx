import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
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
                      <h3 className="text-lg font-semibold">{profile.name}</h3>
                      <p className="text-muted-foreground">{profile.email}</p>
                      {profile.phone && (
                        <p className="text-sm text-muted-foreground">{profile.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {profile.role}
                    </Badge>
                    
                    <Select
                      value={profile.role}
                      onValueChange={(value: 'ADM' | 'Técnico Tromot' | 'Cliente') => 
                        handleRoleChange(profile.user_id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Técnico Tromot">Técnico Tromot</SelectItem>
                        <SelectItem value="ADM">ADM</SelectItem>
                      </SelectContent>
                    </Select>
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