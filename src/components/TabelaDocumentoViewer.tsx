import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TabelaDocumentoViewerProps {
  fileUrl: string
  onDownload?: () => void
}

export default function TabelaDocumentoViewer({ fileUrl, onDownload }: TabelaDocumentoViewerProps) {
  const [rows, setRows] = useState<string[][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error('Falha ao baixar o arquivo')
        const buffer = await response.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: '' })
        if (!active) return
        setRows(data.map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))))
      } catch {
        if (active) setError('Não foi possível ler esta planilha. Tente baixar o arquivo original.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [fileUrl])

  const [header, ...body] = rows.length ? rows : [[]]
  const columnCount = Math.max(header?.length ?? 0, ...body.map((row) => row.length), 0)

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return body
    return body.filter((row) => row.join(' ').toLocaleLowerCase('pt-BR').includes(term))
  }, [body, search])

  if (loading) {
    return <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" />Carregando planilha...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        {onDownload && <Button variant="outline" className="gap-2" onClick={onDownload}><Download className="h-4 w-4" />Baixar arquivo original</Button>}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na tabela (produto, código...)" />
        </div>
        {onDownload && <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={onDownload}><Download className="h-4 w-4" />Baixar arquivo original</Button>}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>{Array.from({ length: columnCount }).map((_, index) => (
              <th key={index} className="whitespace-nowrap border-b px-3 py-2 text-left font-semibold">{header?.[index] || `Coluna ${index + 1}`}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-muted/30">
                {Array.from({ length: columnCount }).map((_, cellIndex) => (
                  <th key={cellIndex} scope={cellIndex === 0 ? 'row' : undefined} className="whitespace-nowrap border-b px-3 py-2 text-left font-normal">{row[cellIndex] ?? ''}</th>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma linha encontrada.</div>}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} linha(s) exibida(s).</p>
    </div>
  )
}
