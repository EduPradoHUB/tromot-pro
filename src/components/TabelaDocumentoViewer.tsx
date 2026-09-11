import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TabelaDocumentoViewerProps {
  fileUrl: string
  onDownload?: () => void
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function isNumeric(value: string) {
  if (!value?.trim()) return false
  return !Number.isNaN(Number(value.replace(/\s/g, '').replace(/^R\$/i, '').replace(/\./g, '').replace(',', '.')))
}

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(/^R\$/i, '').replace(/\./g, '').replace(',', '.'))
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

  const model = useMemo(() => {
    if (!rows.length) return { title: '', columns: [] as string[], groups: [] as { category: string; rows: string[][] }[], numericColumns: [] as boolean[] }

    const filled = (row: string[] = []) => row.filter((cell) => cell?.trim()).length
    const hasTitle = rows.length > 1 && filled(rows[0]) === 1 && filled(rows[1]) > 1
    const title = hasTitle ? (rows[0].find((cell) => cell?.trim()) ?? '') : ''
    const headerRow = hasTitle ? rows[1] : rows[0]
    const body = rows.slice(hasTitle ? 2 : 1)

    const categoryIndex = headerRow.findIndex((cell) => cell?.trim().toLocaleLowerCase('pt-BR') === 'categoria')
    const columnIndexes = headerRow.map((_, index) => index).filter((index) => index !== categoryIndex)
    const columns = columnIndexes.map((index) => headerRow[index]?.trim() || `Coluna ${index + 1}`)

    const numericColumns = columnIndexes.map((index) => {
      const values = body.map((row) => row[index] ?? '').filter((value) => value?.trim())
      if (!values.length) return false
      return values.filter(isNumeric).length / values.length > 0.6
    })

    const groups: { category: string; rows: string[][] }[] = []
    let lastCategory: string | null = null
    for (const row of body) {
      if (!filled(row)) continue
      const category = categoryIndex >= 0 ? (row[categoryIndex]?.trim() || lastCategory || '') : ''
      if (categoryIndex >= 0) lastCategory = category || lastCategory
      const cells = columnIndexes.map((index) => row[index] ?? '')
      const current = groups[groups.length - 1]
      if (!current || current.category !== category) groups.push({ category, rows: [cells] })
      else current.rows.push(cells)
    }

    return { title, columns, groups, numericColumns }
  }, [rows])

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return model.groups
    return model.groups
      .map((group) => ({ ...group, rows: group.rows.filter((row) => row.join(' ').toLocaleLowerCase('pt-BR').includes(term)) }))
      .filter((group) => group.rows.length)
  }, [model.groups, search])

  const totalRows = filteredGroups.reduce((sum, group) => sum + group.rows.length, 0)

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
      {model.title && <h3 className="text-base font-semibold sm:text-lg">{model.title}</h3>}

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
            <tr>{model.columns.map((column, index) => (
              <th key={index} className={`whitespace-nowrap border-b px-3 py-2 font-semibold ${model.numericColumns[index] ? 'text-right' : 'text-left'}`}>{column}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filteredGroups.map((group, groupIndex) => (
              <>
                {group.category && (
                  <tr key={`cat-${groupIndex}`} className="bg-primary/10">
                    <th colSpan={model.columns.length} className="border-b px-3 py-2 text-left text-sm font-bold">{group.category}</th>
                  </tr>
                )}
                {group.rows.map((row, rowIndex) => (
                  <tr key={`${groupIndex}-${rowIndex}`} className="odd:bg-muted/30">
                    {model.columns.map((_, cellIndex) => {
                      const value = row[cellIndex] ?? ''
                      const numeric = model.numericColumns[cellIndex] && isNumeric(value)
                      return (
                        <td key={cellIndex} className={`whitespace-nowrap border-b px-3 py-2 ${numeric ? 'text-right tabular-nums' : 'text-left'}`}>
                          {numeric ? currency.format(toNumber(value)) : value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
        {!totalRows && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma linha encontrada.</div>}
      </div>

      <p className="text-xs text-muted-foreground">{totalRows} linha(s) exibida(s).</p>
    </div>
  )
}
