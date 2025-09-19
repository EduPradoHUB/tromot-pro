import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Users, Tag } from 'lucide-react';
import { useBroadcastNotification } from '@/hooks/useBroadcastNotification';

const NOTIFICATIONS_ENABLED = true; // Feature flag

export function AdminBroadcastCard() {
  const [message, setMessage] = useState('');
  const [deeplink, setDeeplink] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'tags'>('all');
  const [tags, setTags] = useState('');

  const mutation = useBroadcastNotification();

  const handleSubmit = () => {
    const payload = {
      message: message.trim(),
      deeplink: deeplink.trim() || undefined,
      audience: {
        type: audienceType,
        tags: audienceType === 'tags' ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
      }
    };

    mutation.mutate(payload);
  };

  const isDisabled = !message.trim() || message.length > 240 || mutation.isPending;
  const remainingChars = 240 - message.length;

  if (!NOTIFICATIONS_ENABLED) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Notificação Manual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Máximo 240 caracteres</span>
            <span className={remainingChars < 0 ? 'text-destructive' : ''}>
              {remainingChars} restantes
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deeplink">Link interno (opcional)</Label>
          <Input
            id="deeplink"
            placeholder="/produtos/123"
            value={deeplink}
            onChange={(e) => setDeeplink(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Audiência</Label>
          <Select value={audienceType} onValueChange={(value: 'all' | 'tags') => setAudienceType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Todos os usuários
                </div>
              </SelectItem>
              <SelectItem value="tags">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Por tags
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {audienceType === 'tags' && (
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              placeholder="instalador, técnico, cliente"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full"
        >
          {mutation.isPending ? 'Enviando...' : 'Enviar Notificação'}
        </Button>
      </CardContent>
    </Card>
  );
}