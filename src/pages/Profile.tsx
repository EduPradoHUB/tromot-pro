import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { AvatarUpload } from '@/components/AvatarUpload';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { profile, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    whatsapp: profile?.whatsapp || '',
    city: profile?.city || '',
    state: profile?.state || ''
  });

  const handleAvatarUpload = async (avatarUrl: string) => {
    try {
      await updateProfile({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile) {
      setEditData({
        name: profile.name || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        city: profile.city || '',
        state: profile.state || ''
      });
    }
  }, [profile]);

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
            <div className="flex justify-between items-center">
              <CardTitle>Meu Perfil</CardTitle>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              >
                {isEditing ? "Salvar" : "Editar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
              <AvatarUpload 
                currentAvatar={profile.avatar_url || undefined}
                userName={profile.name}
                onUploadComplete={handleAvatarUpload}
              />
              <div className="text-center sm:text-left flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome"
                    />
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefone"
                    />
                    <Input
                      value={editData.whatsapp}
                      onChange={(e) => setEditData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="WhatsApp"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editData.state}
                        onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Estado"
                      />
                      <Input
                        value={editData.city}
                        onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    <p className="text-muted-foreground">{profile.email}</p>
                    {profile.phone && (
                      <p className="text-muted-foreground">{profile.phone}</p>
                    )}
                    {profile.whatsapp && (
                      <p className="text-muted-foreground">WhatsApp: {profile.whatsapp}</p>
                    )}
                    {profile.city && profile.state && (
                      <p className="text-muted-foreground">{profile.city}, {profile.state}</p>
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}