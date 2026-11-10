import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link2, Download, Loader2 } from 'lucide-react';
import {
  subscribeStandardizer,
  getStandardizerState,
  startStandardization,
  countPending,
  clearStandardizeReport,
} from '@/lib/imageStandardizer';

export const StandardizeImageLinks = ({ onDone }: { onDone?: () => void }) => {
  const state = useSyncExternalStore(subscribeStandardizer, getStandardizerState);
  const [open, setOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [counts, setCounts] = useState<{ total: number; pending: number } | null>(null);
  const [counting, setCounting] = useState(false);

  const running = state.status === 'running' || state.status === 'paused';
  const report = state.report;

  // Conta os pendentes no banco ao abrir o diálogo ou trocar o checkbox
  useEffect(() => {
    if (!open || running) return;
    let cancelled = false;
    setCounting(true);
    countPending(includeInactive)
      .then(c => { if (!cancelled) setCounts(c); })
      .catch(() => { if (!cancelled) setCounts(null); })
      .finally(() => { if (!cancelled) setCounting(false); });
    return () => { cancelled = true; };
  }, [open, includeInactive, running]);

  const run = async () => {
    await startStandardization(includeInactive);
    onDone?.();
  };

  const downloadCsv = () => {
    if (!report) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = ['code,image_url', ...report.rows.map(r => `${esc(r.code)},${esc(r.image_url)}`)].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'links-imagens-produtos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o && !running && report) clearStandardizeReport();
  };

  return (
    <>
    <Button variant="outline" onClick={() => setOpen(true)}><Link2 className="w-4 h-4 mr-2" />Padronizar links das imagens</Button>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Padronizar links das imagens</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cada foto será convertida e salva com link fixo pelo código do produto, com miniatura para as listas.
          Os arquivos antigos não serão apagados. O processamento continua mesmo se você sair desta tela.
        </p>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={includeInactive}
            onCheckedChange={v => setIncludeInactive(v === true)}
            disabled={running}
          />
          Incluir inativos e fora de produção
        </label>

        {!running && !report && (
          <p className="text-sm">
            {counting ? (
              <span className="text-muted-foreground">Contando produtos...</span>
            ) : counts ? (
              counts.pending === 0 ? (
                <strong className="text-green-600">Tudo padronizado ({counts.total} produtos com imagem)</strong>
              ) : (
                <span><strong>{counts.pending}</strong> pendentes de <strong>{counts.total}</strong> produtos</span>
              )
            ) : (
              <span className="text-muted-foreground">Não foi possível contar os produtos.</span>
            )}
          </p>
        )}

        {running && state.total > 0 && (
          <div className="space-y-1">
            <Progress value={(state.done / state.total) * 100} />
            <p className="text-xs text-muted-foreground">
              {state.done} de {state.total}
              {state.status === 'paused' ? ' (pausado)' : ''}
            </p>
          </div>
        )}

        {!running && report && (
          <div className="space-y-2 text-sm">
            <p>Convertidos: <strong>{report.converted}</strong></p>
            <p>Já padronizados: <strong>{report.already}</strong></p>
            <p>Falhas: <strong>{report.failures.length}</strong></p>
            {report.failures.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-md border p-2 text-xs space-y-1">
                {report.failures.map((f, i) => <li key={i}><strong>{f.code}</strong>: {f.reason}</li>)}
              </ul>
            )}
            {report.rows.length > 0 && (
              <Button variant="outline" onClick={downloadCsv}><Download className="w-4 h-4 mr-2" />Baixar CSV</Button>
            )}
          </div>
        )}

        <Button onClick={run} disabled={running || counting || (!!counts && counts.pending === 0 && !report)}>
          {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> : report ? 'Rodar novamente' : 'Iniciar'}
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
};
