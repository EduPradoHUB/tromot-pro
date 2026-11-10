import { supabase } from '@/integrations/supabase/client';
import {
  uploadProductImageSet,
  getFixedImageUrl,
  IMAGE_FORMAT,
} from '@/lib/productImage';

export type StandardizeFailure = { code: string; reason: string };
export type StandardizeRow = { code: string; image_url: string };
export type StandardizeReport = {
  converted: number;
  already: number;
  failures: StandardizeFailure[];
  rows: StandardizeRow[];
};

export type StandardizeState = {
  status: 'idle' | 'running' | 'paused';
  done: number;
  total: number;
  report: StandardizeReport | null;
};

let state: StandardizeState = { status: 'idle', done: 0, total: 0, report: null };
const listeners = new Set<() => void>();

const setState = (patch: Partial<StandardizeState>) => {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
};

export const subscribeStandardizer = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const getStandardizerState = () => state;

// Avisa se o usuário tentar fechar a aba durante o processamento
const warnOnUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = '';
};

const updateUnloadWarning = () => {
  if (typeof window === 'undefined') return;
  if (state.status === 'running' || state.status === 'paused') {
    window.addEventListener('beforeunload', warnOnUnload);
  } else {
    window.removeEventListener('beforeunload', warnOnUnload);
  }
};

let cancelRequested = false;

const CONCURRENCY = 4;
const MAX_RETRIES = 2;

/** Filtro PostgREST: image_url fora do link fixo (prefixo do bucket OU extensão diferente). */
const pendingFilter = () => {
  const prefix = supabase.storage.from('product-images').getPublicUrl('produtos/').data.publicUrl;
  return `image_url.not.like.${prefix}%,image_url.not.like.%.${IMAGE_FORMAT}`;
};

const baseQuery = (includeInactive: boolean) => {
  let q = supabase
    .from('products')
    .select('id, code, image_url')
    .not('image_url', 'is', null)
    .neq('image_url', '');
  if (!includeInactive) q = q.eq('status', 'active').eq('out_of_production', false);
  return q;
};

/** Conta no banco: quantos produtos têm imagem e quantos ainda estão fora do link fixo. */
export const countPending = async (includeInactive: boolean) => {
  const totalQuery = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null)
    .neq('image_url', '');
  const pendingQuery = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null)
    .neq('image_url', '')
    .or(pendingFilter());

  const scopedTotal = includeInactive
    ? totalQuery
    : totalQuery.eq('status', 'active').eq('out_of_production', false);
  const scopedPending = includeInactive
    ? pendingQuery
    : pendingQuery.eq('status', 'active').eq('out_of_production', false);

  const [{ count: total, error: e1 }, { count: pending, error: e2 }] = await Promise.all([
    scopedTotal,
    scopedPending,
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { total: total ?? 0, pending: pending ?? 0 };
};

type PendingProduct = { id: string; code: string; image_url: string };

const processProduct = async (p: PendingProduct): Promise<StandardizeRow> => {
  const fixed = getFixedImageUrl(p.code || '');
  if (!fixed) throw new Error('Produto sem código');

  const res = await fetch(p.image_url, { mode: 'cors' }).catch(() => {
    throw new Error('Não foi possível baixar (bloqueio do site de origem ou link inválido)');
  });
  if (!res.ok) throw new Error(`Download falhou (HTTP ${res.status})`);
  const blob = await res.blob();

  await uploadProductImageSet(blob, p.code);

  // Marca image_standardize_batch=true na MESMA atualização do image_url:
  // o webhook lê o registro novo e ignora o evento (sem e-mail aos clientes).
  const { error: dbErr } = await supabase
    .from('products')
    .update({
      image_url: fixed,
      image_updated_at: new Date().toISOString(),
      image_standardize_batch: true,
    } as any)
    .eq('id', p.id);
  if (dbErr) throw new Error(`Banco: ${dbErr.message}`);

  // Volta a flag para false (nenhum campo relevante muda, então não dispara evento)
  await supabase
    .from('products')
    .update({ image_standardize_batch: false } as any)
    .eq('id', p.id);

  return { code: p.code, image_url: fixed };
};

const withRetries = async (p: PendingProduct): Promise<StandardizeRow> => {
  let lastErr: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await processProduct(p);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

export const startStandardization = async (includeInactive: boolean) => {
  if (state.status === 'running' || state.status === 'paused') return;
  cancelRequested = false;
  setState({ status: 'running', done: 0, total: 0, report: null });
  updateUnloadWarning();

  try {
    const pending: PendingProduct[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await baseQuery(includeInactive)
        .or(pendingFilter())
        .range(from, from + 999);
      if (error) throw error;
      pending.push(...((data || []) as PendingProduct[]));
      if (!data || data.length < 1000) break;
    }

    setState({ total: pending.length });

    const failures: StandardizeFailure[] = [];
    const rows: StandardizeRow[] = [];
    let converted = 0;
    let index = 0;

    const worker = async () => {
      while (index < pending.length) {
        if (cancelRequested) return;
        while (state.status === 'paused' && !cancelRequested) {
          await new Promise(r => setTimeout(r, 500));
        }
        if (cancelRequested) return;
        const p = pending[index++];
        try {
          const row = await withRetries(p);
          converted++;
          rows.push(row);
        } catch (e: any) {
          failures.push({ code: p.code || p.id, reason: e?.message || 'Erro desconhecido' });
        }
        setState({ done: state.done + 1 });
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (cancelRequested) {
      setState({ status: 'idle' });
    } else {
      const { total } = await countPending(includeInactive);
      setState({
        status: 'idle',
        report: {
          converted,
          already: Math.max(0, total - pending.length),
          failures,
          rows,
        },
      });
    }
  } catch (e: any) {
    setState({
      status: 'idle',
      report: {
        converted: 0,
        already: 0,
        failures: [{ code: '-', reason: e?.message || 'Erro desconhecido' }],
        rows: [],
      },
    });
  }
  updateUnloadWarning();
};

export const pauseStandardization = () => {
  if (state.status === 'running') setState({ status: 'paused' });
};

export const resumeStandardization = () => {
  if (state.status === 'paused') setState({ status: 'running' });
};

export const cancelStandardization = () => {
  cancelRequested = true;
  setState({ status: 'idle' });
  updateUnloadWarning();
};

export const clearStandardizeReport = () => {
  if (state.status === 'idle') setState({ report: null });
};
