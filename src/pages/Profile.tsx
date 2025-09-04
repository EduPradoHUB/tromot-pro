import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { AvatarUpload } from '@/components/AvatarUpload';

export default function Profile() {
  const { profile, updateProfile } = useApp();

  const handleAvatarUpload = async (avatarUrl: string) => {
    try {
      await updateProfile({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
    }
  };

  if (!profile) {
    return (
      <div className="container py-8">
        <p>Você precisa estar logado para ver o perfil.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
              <AvatarUpload 
                currentAvatar={profile.avatar_url || undefined}
                userName={profile.name}
                onUploadComplete={handleAvatarUpload}
              />
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                {profile.phone && (
                  <p className="text-muted-foreground">{profile.phone}</p>
                )}
                {profile.whatsapp && (
                  <p className="text-muted-foreground">WhatsApp: {profile.whatsapp}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge>{profile.role}</Badge>
                  {profile.customer_type && (
                    <Badge variant="outline">
                      {profile.customer_type === 'lojista_instalador' && 'Lojista/Instalador'}
                      {profile.customer_type === 'distribuidor_representante' && 'Distribuidor/Representante'}
                      {profile.customer_type === 'usuario_final' && 'Usuário Final'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}