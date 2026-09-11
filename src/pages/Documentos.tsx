import { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink, Loader2, Search, Star, Table2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TabelaDocumentoViewer from '@/components/TabelaDocumentoViewer'
import { categoryLabel, documentCategories, documentIcon, type TromotDocument } from '@/lib/documents'

const spreadsheetTypes = ['xlsx', 'xls', 'csv']
const isSpreadsheet = (document: TromotDocument) => spreadsheetTypes.includes((document.file_type || '').toLowerCase())

export default function Documentos() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<TromotDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ document: TromotDocument; url: string } | null>(null)

  useEffect(() => {
    async function loadDocuments() {
      const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
      if (error) toast({ title: 'Erro ao carregar documentos', description: error.message, variant: 'destructive' })
      else setDocuments((data ?? []) as TromotDocument[])
      setLoading(false)
    }
    void loadDocuments()
  }, [toast])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return documents
    return documents.filter((document) => `${document.title} ${document.description ?? ''} ${categoryLabel(document.category)}`.toLocaleLowerCase('pt-BR').includes(term))
  }, [documents, search])

  async function signUrl(document: TromotDocument, download: boolean) {
    const options = download ? { download: `${document.title}.${document.file_type || 'arquivo'}` } : undefined
    const { data, error } = await supabase.storage.from('documentos').createSignedUrl(document.file_url, 300, options)
    if (error || !data?.signedUrl) {
      toast({ title: 'Não foi possível abrir o arquivo', description: error?.message, variant: 'destructive' })
      return null
    }
    return data.signedUrl
  }

  async function accessDocument(document: TromotDocument, download: boolean) {
    setOpeningId(document.id)
    const url = await signUrl(document, download)
    setOpeningId(null)
    if (!url) return
    if (!download && isSpreadsheet(document)) {
      setViewer({ document, url })
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const prices = filtered.filter((document) => document.category === 'tabela_precos')
  const remainingCategories = documentCategories.filter((category) => category.value !== 'tabela_precos')

  function DocumentCard({ document, featured = false }: { document: TromotDocument; featured?: boolean }) {
    const Icon = documentIcon(document.file_type)
    return (
      <Card className={featured ? 'border-primary/30 bg-primary/[0.04]' : ''}>
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${featured ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><Icon className="h-5 w-5" /></div>
            <div className="min-w-0"><h3 className="font-semibold leading-snug">{document.title}</h3><div className="mt-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{document.file_type?.toUpperCase() || 'ARQUIVO'}</Badge><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('pt-BR').format(new Date(document.created_at))}</span></div></div>
          </div>
          {document.description && <p className="text-sm text-muted-foreground">{document.description}</p>}
          <div className="mt-auto flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" disabled={openingId === document.id} onClick={() => void accessDocument(document, false)}>{openingId === document.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isSpreadsheet(document) ? <Table2 className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}{isSpreadsheet(document) ? 'Ver tabela' : 'Abrir'}</Button>
            <Button size="sm" variant="outline" className="gap-2" disabled={openingId === document.id} onClick={() => void accessDocument(document, true)}><Download className="h-4 w-4" />Baixar</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <main className="container max-w-6xl space-y-8 py-8">
      <header className="space-y-4"><div><h1 className="text-3xl font-bold">Documentos</h1><p className="text-muted-foreground">Materiais comerciais e arquivos oficiais da TROMOT.</p></div><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, descrição ou categoria" /></div></header>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : (
        <>
          <section className="space-y-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-5 sm:p-6">
            <div className="flex items-center gap-2"><Star className="h-5 w-5 fill-primary text-primary" /><div><h2 className="text-xl font-bold">Tabela de Preços</h2><p className="text-sm text-muted-foreground">Arquivos mais recentes para consulta rápida.</p></div></div>
            {prices.length ? <div className="grid gap-4 md:grid-cols-2">{prices.map((document) => <DocumentCard key={document.id} document={document} featured />)}</div> : <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma tabela de preços disponível.</p>}
          </section>

          {remainingCategories.map((category) => {
            const categoryDocuments = filtered.filter((document) => document.category === category.value)
            if (!categoryDocuments.length) return null
            return <section key={category.value} className="space-y-4"><h2 className="text-xl font-semibold">{category.label}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categoryDocuments.map((document) => <DocumentCard key={document.id} document={document} />)}</div></section>
          })}

          {!filtered.length && search && <div className="py-10 text-center text-muted-foreground">Nenhum documento encontrado para “{search}”.</div>}
        </>
      )}
    </main>
  )
}