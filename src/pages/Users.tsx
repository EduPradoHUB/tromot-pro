import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/custom-alert-dialog';
import { Trash2 } from 'lucide-react';
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Call edge function to delete user
      const response = await fetch(`https://bclktrcbwpwsxksbhqsv.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao banir usuário');
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
        description: error instanceof Error ? error.message : "Não foi possível banir o usuário.",
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