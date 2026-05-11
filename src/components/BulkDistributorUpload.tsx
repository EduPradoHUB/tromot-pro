import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/CustomDialog';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAdminDistributors } from '@/hooks/useAdminDistributors';

interface ParsedDistributor {
  name: string;
  state: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  cover_entire_state: boolean;
  active: boolean;
  isValid: boolean;
  errors: string[];
}

interface Props {
  trigger?: React.ReactNode;
}

const HEADERS = ['name', 'state', 'city', 'phone', 'whatsapp', 'cover_entire_state', 'active'];

const toBool = (v: any, def = true): boolean => {
  if (v === undefined || v === null || v === '') return def;
  const s = String(v).trim().toLowerCase();
  return ['true', '1', 'sim', 'yes', 'y', 's', 'x'].includes(s);
};

export const BulkDistributorUpload: React.FC<Props> = ({ trigger }) => {
  const { toast } = useToast();
  const { createDistributor, refetch } = useAdminDistributors();
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedDistributor[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      HEADERS,
      ['Distribuidora Exemplo', 'SP', 'Campinas', '(19) 3272-2973', '(19) 99999-9999', 'false', 'true'],
      ['Cobertura Estadual', 'RS', '', '51 99806-2451', '51 99806-2451', 'true', 'true'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Distribuidores');
    XLSX.writeFile(wb, 'template_distribuidores_tromot.xlsx');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
      const result: ParsedDistributor[] = rows.map((r) => {
        const name = String(r.name ?? r.nome ?? '').trim();
        const state = String(r.state ?? r.estado ?? '').trim().toUpperCase();
        const city = String(r.city ?? r.cidade ?? '').trim() || undefined;
        const phone = String(r.phone ?? r.telefone ?? '').trim() || undefined;
        const whatsapp = String(r.whatsapp ?? '').trim() || undefined;
        const cover_entire_state = toBool(r.cover_entire_state ?? r.cobertura_estadual, false);
        const active = toBool(r.active ?? r.ativo, true);
        const errors: string[] = [];
        if (!name) errors.push('Nome obrigatório');
        if (!state || state.length !== 2) errors.push('Estado (UF) inválido');
        if (!cover_entire_state && !city) errors.push('Cidade obrigatória quando não cobre estado inteiro');
        return { name, state, city, phone, whatsapp, cover_entire_state, active, isValid: errors.length === 0, errors };
      });
      setParsed(result);
    } catch (err) {
      toast({ title: 'Erro ao ler arquivo', description: 'Verifique o formato do arquivo', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    const valid = parsed.filter((p) => p.isValid);
    if (!valid.length) {
      toast({ title: 'Nenhum distribuidor válido', variant: 'destructive' });
      return;
    }
    setImporting(true);
    setProgress(0);
    let ok = 0, fail = 0;
    for (let i = 0; i < valid.length; i++) {
      const d = valid[i];
      try {
        await createDistributor({
          name: d.name,
          state: d.state,
          city: d.cover_entire_state ? null : (d.city ?? null),
          phone: d.phone ?? null,
          whatsapp: d.whatsapp ?? null,
          cover_entire_state: d.cover_entire_state,
          active: d.active,
        });
        ok++;
      } catch (e) {
        fail++;
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }
    setImporting(false);
    toast({ title: 'Importação concluída', description: `${ok} criados, ${fail} falharam` });
    await refetch();
    if (fail === 0) {
      setOpen(false);
      setParsed([]);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const validCount = parsed.filter((p) => p.isValid).length;

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Distribuidores em Massa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar template
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar arquivo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Colunas esperadas: <code>name, state, city, phone, whatsapp, cover_entire_state, active</code>.
              Use UF de 2 letras (ex.: SP, RS). Para cobertura estadual marque <code>cover_entire_state=true</code>.
            </div>

            {parsed.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{parsed.length} linhas</Badge>
                  <Badge className="bg-green-600">{validCount} válidos</Badge>
                  <Badge variant="destructive">{parsed.length - validCount} com erro</Badge>
                </div>

                <div className="border rounded-md max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>UF</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Estadual</TableHead>
                        <TableHead>Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            {p.isValid ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-destructive" />}
                          </TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.state}</TableCell>
                          <TableCell>{p.city || '-'}</TableCell>
                          <TableCell>{p.phone || '-'}</TableCell>
                          <TableCell>{p.whatsapp || '-'}</TableCell>
                          <TableCell>{p.cover_entire_state ? 'Sim' : 'Não'}</TableCell>
                          <TableCell className="text-xs text-destructive">{p.errors.join('; ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {importing && <Progress value={progress} />}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setParsed([]); if (fileRef.current) fileRef.current.value = ''; }} disabled={importing}>
                    Limpar
                  </Button>
                  <Button onClick={handleImport} disabled={importing || validCount === 0}>
                    {importing ? `Importando... ${progress}%` : `Importar ${validCount} distribuidores`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
