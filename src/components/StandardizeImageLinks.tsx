import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link2, Download, Loader2 } from 'lucide-react';
import { normalizeProductCode, convertToJpeg } from '@/lib/productImage';

type Failure = { code: string; reason: string };
type Row = { code: string; image_url: string };

export const StandardizeImageLinks = ({ onDone }: { onDone?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [report, setReport] = useState<{ converted: number; already: number; failures: Failure[]; rows: Row[] } | null>(null);

  const run = async () => {
    setRunning(true); setReport(null); setDone(0);
    const products: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('products').select('id, code, image_url').not('image_url', 'is', null).neq('image_url', '').range(from, from + 999);
      if (error) { setReport({ converted: 0, already: 0, failures: [{ code: '-', reason: error.message }], rows: [] }); setRunning(false); return; }
      products.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    setTotal(products.length);
    let converted = 0, already = 0;
    const failures: Failure[] = [];
    const rows: Row[] = [];
    for (const p of products) {
      const code = p.code || '';
      try {
        const norm = normalizeProductCode(code);
        if (!norm) throw new Error('Produto sem código');
        const path = `produtos/${norm}.jpg`;
        const fixed = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl.split('?')[0];
        if ((p.image_url as string).split('?')[0] === fixed) { already++; rows.push({ code, image_url: fixed }); continue; }
        const res = await fetch(p.image_url, { mode: 'cors' }).catch(() => { throw new Error('Não foi possível baixar (bloqueio do site de origem ou link inválido)'); });
        if (!res.ok) throw new Error(`Download falhou (HTTP ${res.status})`);
        const src = await res.blob();
        const jpg = await convertToJpeg(new File([src], 'img'));
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, jpg, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' });
        if (upErr) throw new Error(`Upload: ${upErr.message}`);
        const { error: dbErr } = await supabase.from('products').update({ image_url: fixed, image_updated_at: new Date().toISOString() } as any).eq('id', p.id);
        if (dbErr) throw new Error(`Banco: ${dbErr.message}`);
        converted++; rows.push({ code, image_url: fixed });
      } catch (e: any) {
        failures.push({ code: code || p.id, reason: e?.message || 'Erro desconhecido' });
      }
      setDone(d => d + 1);
    }
    setDone(products.length);
    setReport({ converted, already, failures, rows });
    setRunning(false);
    onDone?.();
  };

  const downloadCsv = () => {
    if (!report) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = ['code,image_url', ...report.rows.map(r => `${esc(r.code)},${esc(r.image_url)}`)].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'links-imagens-produtos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!running) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Link2 className="w-4 h-4 mr-2" />Padronizar links das imagens</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Padronizar links das imagens</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Cada foto será convertida para JPG e salva com link fixo pelo código do produto. Os arquivos antigos não serão apagados.</p>
        {(running || report) && total > 0 && (
          <div className="space-y-1">
            <Progress value={(done / total) * 100} />
            <p className="text-xs text-muted-foreground">{done} de {total}</p>
          </div>
        )}
        {report && (
          <div className="space-y-2 text-sm">
            <p>Convertidos: <strong>{report.converted}</strong></p>
            <p>Já padronizados: <strong>{report.already}</strong></p>
            <p>Falhas: <strong>{report.failures.length}</strong></p>
            {report.failures.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-md border p-2 text-xs space-y-1">
                {report.failures.map((f, i) => <li key={i}><strong>{f.code}</strong>: {f.reason}</li>)}
              </ul>
            )}
            <Button variant="outline" onClick={downloadCsv}><Download className="w-4 h-4 mr-2" />Baixar CSV</Button>
          </div>
        )}
        <Button onClick={run} disabled={running}>
          {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</> : report ? 'Rodar novamente' : 'Iniciar'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
