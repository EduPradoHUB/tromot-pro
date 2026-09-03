import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Loader2, Mail, Send } from 'lucide-react'

// email_notification_settings / product_notifications ainda não estão no
// types.ts gerado (mesma observação de KnowledgeBase.tsx) — daqui vem o
// `as any`.

interface Settings {
  novo_produto_modo: 'automatico' | 'manual'
  manual_atualizado_modo: 'automatico' | 'manual'
  produto_alterado_modo: 'automatico' | 'manual'
}

interface Notification {
  id: string
  event_type: 'novo_produto' | 'manual_atualizado' | 'produto_alterado'
  product_id: string
  status: 'pending' | 'sent' | 'skipped'
  recipients_count: number | null
  created_at: string
  sent_at: string | null
  products?: { name: string } | null
}

const EVENT_LABELS: Record<string, string> = {
  novo_produto: 'Produto novo',
  manual_atualizado: 'Manual atualizado',
  produto_alterado: 'Produto alterado',
}

export default function ProductNotifications() {
  const { profile } = useApp()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const [{ data: settingsData }, { data: notifData }] = await Promise.all([
      (supabase as any).from('email_notification_settings').select('*').eq('id', true).single(),
      (supabase as any)
        .from('product_notifications')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setSettings(settingsData ?? null)
    setNotifications(notifData ?? [])
    setLoading(false)
  }

  async function toggleModo(campo: keyof Settings, ligado: boolean) {
    if (!settings) return
    const novoValor = ligado ? 'automatico' : 'manual'
    setSettings({ ...settings, [campo]: novoValor })
    const { error } = await (supabase as any)
      .from('email_notification_settings')
      .update({ [campo]: novoValor })
      .eq('id', true)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      carregar()
    }
  }

  async function enviarAgora(notification: Notification) {
    setSendingId(notification.id)
    try {
      const { data, error } = await supabase.functions.invoke('send-pending-notification', {
        body: { notificationId: notification.id },
      })
      if (error) throw error
      toast({ title: 'Enviado', description: `Email enviado para ${data?.recipients ?? 0} cliente(s).` })
      carregar()
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    } finally {
      setSendingId(null)
    }
  }

  if (profile && !['ADM', 'Técnico Tromot'].includes(profile.role)) {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a ADM/Técnico Tromot.</div>
  }

  const pendentes = notifications.filter((n) => n.status === 'pending')
  const enviadas = notifications.filter((n) => n.status === 'sent')

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Mail className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Notificações de Produto por Email</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de envio por tipo de evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !settings ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Produto novo</Label>
                  <p className="text-xs text-muted-foreground">Quando você cadastra um produto novo e ativo</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{settings.novo_produto_modo === 'automatico' ? 'Automático' : 'Manual'}</span>
                  <Switch checked={settings.novo_produto_modo === 'automatico'} onCheckedChange={(v) => toggleModo('novo_produto_modo', v)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Manual atualizado</Label>
                  <p className="text-xs text-muted-foreground">Quando um produto ganha manual novo ou atualizado</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{settings.manual_atualizado_modo === 'automatico' ? 'Automático' : 'Manual'}</span>
                  <Switch checked={settings.manual_atualizado_modo === 'automatico'} onCheckedChange={(v) => toggleModo('manual_atualizado_modo', v)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Produto alterado</Label>
                  <p className="text-xs text-muted-foreground">Nome, descrição, categoria, foto, compatibilidade ou link de compra</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{settings.produto_alterado_modo === 'automatico' ? 'Automático' : 'Manual'}</span>
                  <Switch checked={settings.produto_alterado_modo === 'automatico'} onCheckedChange={(v) => toggleModo('produto_alterado_modo', v)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                No modo manual, a mudança fica pendente aqui embaixo até você clicar em "Enviar agora".
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-medium mb-2">Pendentes ({pendentes.length})</h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma notificação pendente.</p>
        ) : (
          <div className="space-y-2">
            {pendentes.map((n) => (
              <Card key={n.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.products?.name ?? 'Produto removido'}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_LABELS[n.event_type]} · {new Date(n.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => enviarAgora(n)} disabled={sendingId === n.id} className="gap-1">
                    {sendingId === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-medium mb-2">Histórico de envios</h2>
        {enviadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum email enviado ainda.</p>
        ) : (
          <div className="space-y-2">
            {enviadas.map((n) => (
              <Card key={n.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.products?.name ?? 'Produto removido'}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_LABELS[n.event_type]} · enviado {n.sent_at ? new Date(n.sent_at).toLocaleString('pt-BR') : ''}
                    </p>
                  </div>
                  <Badge variant="secondary">{n.recipients_count ?? 0} cliente(s)</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
