import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { AvatarUpload } from '@/components/AvatarUpload';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { profile, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '',
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

  const emailOptIn = (profile as any)?.email_notifications_opt_in ?? true;

  const handleToggleEmailOptIn = async (checked: boolean) => {
    try {
      await updateProfile({ email_notifications_opt_in: checked } as any);
      toast({
        title: checked ? 'Emails ativados' : 'Emails desativados',
        description: checked
          ? 'Você vai receber novidades de produto por email.'
          : 'Você não vai mais receber novidades de produto por email.',
      });
    } catch (error) {
      console.error('Erro ao atualizar preferência de email:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a preferência.', variant: 'destructive' });
    }
  };

  const formatWhatsapp = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSaveProfile = async () => {
    const digits = (editData.whatsapp || '').replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 11) {
      toast({
        title: "WhatsApp inválido",
        description: "Use o formato XX XXXXX-XXXX (com DDD).",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateProfile({
        name: editData.name,
        whatsapp: digits ? formatWhatsapp(digits) : null,
        city: editData.city,
        state: editData.state,
      });
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
                      value={editData.whatsapp}
                      onChange={(e) => setEditData(prev => ({ ...prev, whatsapp: formatWhatsapp(e.target.value) }))}
                      placeholder="WhatsApp (XX XXXXX-XXXX)"
                      inputMode="tel"
                      maxLength={13}
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

        <Card className="shadow-card mt-4">
          <CardHeader>
            <CardTitle className="text-base">Notificações por email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-opt-in">Novidades de produto</Label>
                <p className="text-xs text-muted-foreground">
                  Produto novo, manual atualizado ou alteração em produtos que você acompanha.
                </p>
              </div>
              <Switch id="email-opt-in" checked={emailOptIn} onCheckedChange={handleToggleEmailOptIn} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}