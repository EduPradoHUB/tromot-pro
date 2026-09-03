import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

const SESSION_KEY = 'tromot_chat_session_id'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

const STARTER_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Olá! Sou a assistente de suporte da TROMOT. Pode perguntar sobre produtos, manuais, compra ou instalação.',
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isOpen])

  async function handleOpen() {
    setIsOpen(true)
    if (historyLoaded) return
    setHistoryLoaded(true)
    try {
      const sessionId = getSessionId()
      const { data, error } = await supabase.functions.invoke('app-chat', {
        body: { sessionId, loadHistory: true },
      })
      if (!error && data?.messages?.length > 0) {
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
      } else {
        setMessages([STARTER_MESSAGE])
      }
    } catch {
      setMessages([STARTER_MESSAGE])
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const sessionId = getSessionId()
      const { data, error } = await supabase.functions.invoke('app-chat', {
        body: { sessionId, message: text },
      })
      if (error || data?.error) throw new Error(data?.error || error?.message)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Deu um problema para responder agora. Tenta de novo em instantes, ou fala com a gente pelo WhatsApp.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[520px] flex flex-col shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-tromot-red text-white rounded-t-lg">
            <span className="font-medium">Suporte TROMOT</span>
            <button onClick={() => setIsOpen(false)} aria-label="Fechar chat">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 p-3 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              disabled={sending}
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg bg-tromot-red hover:bg-tromot-red/90"
          onClick={handleOpen}
          aria-label="Falar com o suporte"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
