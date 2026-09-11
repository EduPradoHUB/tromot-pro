import { useEffect, useRef, useState } from 'react'
import { FileUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { categoryLabel, documentCategories, fileExtension, safeFileName, type DocumentCategory, type TromotDocument } from '@/lib/documents'

const emptyForm = { title: '', category: 'tabela_precos' as DocumentCategory, description: '' }

export default function AdminDocumentos() {
  const { profile, user } = useApp()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<TromotDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TromotDocument | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { void loadDocuments() }, [])

  async function loadDocuments() {
    setLoading(true)
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    if (error) toast({ title: 'Erro ao carregar documentos', description: error.message, variant: 'destructive' })
    else setDocuments((data ?? []) as TromotDocument[])
    setLoading(false)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFile(null)
    setDialogOpen(true)
  }

  function startEdit(document: TromotDocument) {
    setEditing(document)
    setForm({ title: document.title, category: document.category, description: document.description ?? '' })
    setFile(null)
    setDialogOpen(true)
  }

  async function saveDocument(event: React.FormEvent) {
    event.preventDefault()
    if (!user || !form.title.trim() || (!editing && !file)) {
      toast({ title: 'Preencha o título e selecione um arquivo', variant: 'destructive' })
      return
    }

    setSaving(true)
    let newPath: string | null = null
    try {
      if (file) {
        newPath = `${user.id}/${Date.now()}-${safeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage.from('documentos').upload(newPath, file, { upsert: false })
        if (uploadError) throw uploadError
      }

      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
        ...(newPath ? { file_url: newPath, file_type: fileExtension(file?.name ?? '') } : {}),
      }

      if (editing) {
        const { error } = await supabase.from('documents').update(payload).eq('id', editing.id)
        if (error) throw error
        if (newPath && editing.file_url !== newPath) await supabase.storage.from('documentos').remove([editing.file_url])
      } else {
        if (!newPath) throw new Error('Selecione um arquivo.')
        const { error } = await supabase.from('documents').insert({ ...payload, file_url: newPath, uploaded_by: user.id })
        if (error) throw error
      }

      toast({ title: editing ? 'Documento atualizado' : 'Documento adicionado' })
      closeDialog()
      await loadDocuments()
    } catch (error) {
      if (newPath) await supabase.storage.from('documentos').remove([newPath])
      toast({ title: 'Erro ao salvar documento', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteDocument(document: TromotDocument) {
    if (!window.confirm(`Excluir “${document.title}”?`)) return
    const { error } = await supabase.from('documents').delete().eq('id', document.id)
    if (error) {
      toast({ title: 'Erro ao excluir documento', description: error.message, variant: 'destructive' })
      return
    }
    const { error: storageError } = await supabase.storage.from('documentos').remove([document.file_url])
    if (storageError) toast({ title: 'Documento excluído, mas o arquivo não pôde ser removido', variant: 'destructive' })
    setDocuments((current) => current.filter((item) => item.id !== document.id))
  }

  if (profile && !['ADM', 'Técnico Tromot'].includes(profile.role)) {
    return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a ADM e Técnico Tromot.</div>
  }

  return (
    <main className="container max-w-6xl space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Documentos</h1>
          <p className="text-sm text-muted-foreground">Cadastre tabelas, políticas, fichas e catálogos para a equipe comercial.</p>
        </div>
        <Button onClick={startCreate} className="gap-2"><Plus className="h-4 w-4" />Novo documento</Button>
      </header>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : documents.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Nenhum documento cadastrado.</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Categoria</TableHead><TableHead>Atualizado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell><p className="font-medium">{document.title}</p><p className="max-w-md truncate text-xs text-muted-foreground">{document.description || document.file_type?.toUpperCase()}</p></TableCell>
                  <TableCell>{categoryLabel(document.category)}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat('pt-BR').format(new Date(document.updated_at))}</TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Editar ${document.title}`} onClick={() => startEdit(document)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Excluir ${document.title}`} onClick={() => void deleteDocument(document)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) closeDialog() }}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar documento' : 'Novo documento'}</DialogTitle><DialogDescription>Informe os dados e selecione o arquivo que será disponibilizado.</DialogDescription></DialogHeader>
          <form onSubmit={saveDocument} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="document-title">Título</Label><Input id="document-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></div>
            <div className="space-y-2"><Label>Categoria</Label><Select value={form.category} onValueChange={(category: DocumentCategory) => setForm((current) => ({ ...current, category }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{documentCategories.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="document-description">Descrição (opcional)</Label><Textarea id="document-description" rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="document-file">Arquivo {editing && '(selecione apenas para substituir)'}</Label><Input ref={fileInputRef} id="document-file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required={!editing} /><p className="text-xs text-muted-foreground">Tamanho máximo: 20 MB.</p></div>
            {file && <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm"><span className="flex min-w-0 items-center gap-2"><FileUp className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{file.name}</span></span><Button type="button" size="icon" variant="ghost" aria-label="Remover arquivo selecionado" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}><X className="h-4 w-4" /></Button></div>}
            <DialogFooter><Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Salvar alterações' : 'Enviar documento'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}