import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';

export default function Profile() {
  const { profile } = useApp();

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
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                {profile.phone && (
                  <p className="text-muted-foreground">{profile.phone}</p>
                )}
                <Badge className="mt-2">{profile.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}