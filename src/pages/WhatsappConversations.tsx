import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

// whatsapp_conversations / whatsapp_messages ainda não estão no types.ts
// gerado (mesma observação de KnowledgeBase.tsx) — daqui vem o `as any`.

interface Conversation {
  id: string
  phone: string
  customer_name: string | null
  customer_type: string | null
  state: string | null
  city: string | null
  status: string
  needs_human: boolean
  escalation_reason: string | null
  last_message_at: string
}

interface Message {
  id: string
  role: string
  content: string | null
  created_at: string
}

export default function WhatsappConversations() {
  const { profile } = useApp()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [onlyEscalated, setOnlyEscalated] = useState(false)

  useEffect(() => {
    carregarConversas()
  }, [])

  async function carregarConversas() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('whatsapp_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(100)
    setConversations(data ?? [])
    setLoading(false)
  }

  async function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null)
      return
    }
    setExpanded(id)
    if (!messages[id]) {
      const { data } = await (supabase as any)
        .from('whatsapp_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
      setMessages((prev) => ({ ...prev, [id]: data ?? [] }))
    }
  }

  async function marcarResolvido(id: string) {
    await (supabase as any)
      .from('whatsapp_conversations')
      .update({ status: 'resolved', needs_human: false })
      .eq('id', id)
    carregarConversas()
  }

  if (profile && profile.role !== 'ADM') {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a ADM.</div>
  }

  const list = onlyEscalated ? conversations.filter((c) => c.needs_human) : conversations

  return (
    <div className="container py-8 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Conversas do WhatsApp (IA de Suporte)</h1>
        </div>
        <Button variant={onlyEscalated ? 'default' : 'outline'} size="sm" onClick={() => setOnlyEscalated((v) => !v)}>
          {onlyEscalated ? 'Mostrando só escaladas' : 'Mostrar só escaladas'}
        </Button>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
      ) : (
        list.map((conv) => (
          <Card key={conv.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => toggleExpand(conv.id)}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{conv.customer_name || conv.phone}</p>
                    <Badge variant={conv.status === 'escalated' ? 'destructive' : conv.status === 'resolved' ? 'secondary' : 'default'}>
                      {conv.status}
                    </Badge>
                    {conv.needs_human && (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> precisa de humano</Badge>
                    )}
                    {conv.city && <span className="text-xs text-muted-foreground">{conv.city}/{conv.state}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{conv.phone}</p>
                  {conv.escalation_reason && (
                    <p className="text-sm text-destructive mt-1">Motivo: {conv.escalation_reason}</p>
                  )}
                </div>
                {expanded === conv.id ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </div>

              {expanded === conv.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {(messages[conv.id] ?? []).map((m) => (
                    <div key={m.id} className={`text-sm rounded-md px-3 py-2 max-w-[85%] ${m.role === 'user' ? 'bg-muted' : 'bg-primary/10 ml-auto'}`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                  {conv.needs_human && (
                    <Button size="sm" variant="outline" onClick={() => marcarResolvido(conv.id)}>
                      Marcar como resolvido
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
