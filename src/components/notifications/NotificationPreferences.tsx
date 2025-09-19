import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { NotificationPreferences as INotificationPreferences, NotificationTemplate } from '@/types/notifications';
import { toast } from '@/hooks/use-toast';

const NOTIFICATIONS_ENABLED = true; // Feature flag
const AUTO_NOTIFY_ON_CONTENT_CHANGE = 'auto_notify_on_content_change';
const NOTIFICATION_TEMPLATES = 'notification_templates';

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'manual_updated',
    label: 'Manual atualizado',
    template: 'Manual atualizado: {{titulo}}'
  },
  {
    id: 'product_updated', 
    label: 'Produto atualizado',
    template: 'Produto atualizado: {{nome}}'
  }
];

export function NotificationPreferences() {
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);

  useEffect(() => {
    // Carregar preferências do localStorage
    const savedAutoNotify = localStorage.getItem(AUTO_NOTIFY_ON_CONTENT_CHANGE);
    const savedTemplates = localStorage.getItem(NOTIFICATION_TEMPLATES);

    if (savedAutoNotify !== null) {
      setAutoNotifyEnabled(JSON.parse(savedAutoNotify));
    }

    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('[notifications] Erro ao carregar templates:', error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(AUTO_NOTIFY_ON_CONTENT_CHANGE, JSON.stringify(autoNotifyEnabled));
      localStorage.setItem(NOTIFICATION_TEMPLATES, JSON.stringify(templates));

      console.log('[notifications] Preferências salvas:', {
        autoNotifyEnabled,
        templates
      });

      toast({
        title: "Preferências salvas!",
        description: "Configurações de notificação atualizadas",
      });
    } catch (error) {
      console.error('[notifications] Erro ao salvar preferências:', error);
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar preferências",
        variant: "destructive"
      });
    }
  };

  const handleTemplateChange = (id: string, newTemplate: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, template: newTemplate } : template
    ));
  };

  if (!NOTIFICATIONS_ENABLED) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferências de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-notify">Ativar notificações automáticas</Label>
            <p className="text-sm text-muted-foreground">
              Enviar notificação quando manuais ou produtos forem atualizados
            </p>
          </div>
          <Switch
            id="auto-notify"
            checked={autoNotifyEnabled}
            onCheckedChange={setAutoNotifyEnabled}
          />
        </div>

        <div className="space-y-4">
          <Label>Templates de Mensagem</Label>
          {templates.map(template => (
            <div key={template.id} className="space-y-2">
              <Label htmlFor={template.id} className="text-sm font-medium">
                {template.label}
              </Label>
              <Input
                id={template.id}
                value={template.template}
                onChange={(e) => handleTemplateChange(template.id, e.target.value)}
                placeholder="Digite o template da mensagem..."
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Use {`{{titulo}}`} ou {`{{nome}}`} para inserir dados dinâmicos
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Preferências
        </Button>
      </CardContent>
    </Card>
  );
}