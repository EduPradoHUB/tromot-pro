import { File, FileArchive, FileImage, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react'

export const documentCategories = [
  { value: 'tabela_precos', label: 'Tabela de Preços' },
  { value: 'politica_comercial', label: 'Política Comercial' },
  { value: 'politica_frete', label: 'Política de Frete' },
  { value: 'politica_trocas', label: 'Política de Trocas' },
  { value: 'ficha_cadastral', label: 'Ficha Cadastral' },
  { value: 'catalogo', label: 'Catálogo' },
  { value: 'outro', label: 'Outros' },
] as const

export type DocumentCategory = typeof documentCategories[number]['value']

export interface TromotDocument {
  id: string
  title: string
  category: DocumentCategory
  description: string | null
  file_url: string
  file_type: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export function categoryLabel(value: string) {
  return documentCategories.find((category) => category.value === value)?.label ?? 'Outros'
}

export function documentIcon(fileType?: string | null): LucideIcon {
  const extension = fileType?.toLowerCase()
  if (extension === 'pdf' || extension === 'doc' || extension === 'docx' || extension === 'txt') return FileText
  if (extension === 'xls' || extension === 'xlsx' || extension === 'csv') return FileSpreadsheet
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'webp') return FileImage
  if (extension === 'zip' || extension === 'rar' || extension === '7z') return FileArchive
  return File
}

export function fileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || 'arquivo'
}

export function safeFileName(fileName: string) {
  const extension = fileName.includes('.') ? `.${fileExtension(fileName)}` : ''
  const base = fileName.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return `${base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80)}${extension}`
}