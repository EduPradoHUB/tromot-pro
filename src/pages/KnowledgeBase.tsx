import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Pencil, BrainCircuit, ImagePlus, X } from 'lucide-react'

// A tabela knowledge_base ainda não está no types.ts gerado pelo Supabase
// (mesma situação de `clientes`/`bling_tokens`/`pedidos` no restante do
// projeto) — por isso o cast `as any`, seguindo o padrão já usado em
// BlingConfig.tsx. Depois de rodar a geração de tipos, isso pode ser
// removido.

interface KnowledgeEntry {
  id: string
  title: string
  situation: string
  solution: string
  category: string | null
  image_url: string | null
  status: string
  created_at: string
}

const emptyForm = { title: '', situation: '', solution: '', category: '' }

export default function KnowledgeBase() {
  const { profile } = useApp()
  const { toast } = useToast()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    carregarEntradas()
  }, [])

  async function carregarEntradas() {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('knowledge_base')
      .select('id, title, situation, solution, category, image_url, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao carregar base de conhecimento', description: error.message, variant: 'destructive' })
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }

  function iniciarEdicao(entry: KnowledgeEntry) {
    setEditingId(entry.id)
    setForm({
      title: entry.title,
      situation: entry.situation,
      solution: entry.solution,
      category: entry.category ?? '',
    })
    setImagePreview(entry.image_url)
    setImageFile(null)
  }

  function cancelarEdicao() {
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
  }

  async function salvar() {
    if (!form.title.trim() || !form.situation.trim() || !form.solution.trim()) {
      toast({ title: 'Preencha título, situação e solução', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      let imageUrl = imagePreview

      if (imageFile) {
        const path = `${Date.now()}-${imageFile.name}`
        const { data, error } = await supabase.storage
          .from('knowledge-base')
          .upload(path, imageFile, { cacheControl: '3600', upsert: true })
        if (error) throw error
        imageUrl = supabase.storage.from('knowledge-base').getPublicUrl(data.path).data.publicUrl
      }

      const payload = {
        title: form.title.trim(),
        situation: form.situation.trim(),
        solution: form.solution.trim(),
        category: form.category.trim() || null,
        image_url: imageUrl,
      }

      let knowledgeBaseId = editingId

      if (editingId) {
        const { error } = await (supabase as any).from('knowledge_base').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { data, error } = await (supabase as any).from('knowledge_base').insert(payload).select('id').single()
        if (error) throw error
        knowledgeBaseId = data.id
      }

      // Gera/atualiza o embedding em segundo plano (a IA só encontra esta
      // entrada por busca semântica depois que isso terminar).
      const { error: embedError } = await supabase.functions.invoke('kb-embed', {
        body: { knowledgeBaseId },
      })
      if (embedError) {
        toast({
          title: 'Salvo, mas o embedding falhou',
          description: 'A entrada foi salva, mas a IA pode não encontrá-la ainda. ' + embedError.message,
          variant: 'destructive',
        })
      } else {
        toast({ title: editingId ? 'Entrada atualizada' : 'Entrada adicionada à base de conhecimento' })
      }

      cancelarEdicao()
      carregarEntradas()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Remover esta entrada da base de conhecimento?')) return
    const { error } = await (supabase as any).from('knowledge_base').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id))
    }
  }

  if (profile && !['ADM', 'Técnico Tromot'].includes(profile.role)) {
    return (
      <div className="container py-10 text-center text-muted-foreground">
        Acesso restrito a ADM e Técnico Tromot.
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Base de Conhecimento da IA</h1>
          <p className="text-sm text-muted-foreground">
            Cada caso que você ensina aqui fica disponível para a IA de suporte do WhatsApp encontrar sozinha, mesmo instalações fora dos manuais oficiais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Editar entrada' : 'Nova entrada'}</CardTitle>
          <CardDescription>Descreva a situação como o cliente perguntaria, e a solução como você explicaria.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Título curto (ex: Instalação do canceller em farol com módulo CAN)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            placeholder="Categoria (opcional, ex: iluminacao, audio, canceller)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Textarea
            placeholder="Situação: o que o cliente perguntou ou o problema que ele tinha"
            value={form.situation}
            onChange={(e) => setForm((f) => ({ ...f, situation: e.target.value }))}
            rows={3}
          />
          <Textarea
            placeholder="Solução: sua orientação passo a passo"
            value={form.solution}
            onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
            rows={5}
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer border rounded-md px-3 py-2 hover:bg-accent">
              <ImagePlus className="w-4 h-4" />
              {imageFile || imagePreview ? 'Trocar foto' : 'Anexar foto (opcional)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
              />
            </label>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-md border" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={salvar} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Salvar alterações' : 'Adicionar à base de conhecimento'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={cancelarEdicao}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Entradas cadastradas ({entries.length})</h2>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrada ainda. Adicione o primeiro caso acima.</p>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4 flex justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{entry.title}</p>
                    {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.situation}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(entry)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => excluir(entry.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
