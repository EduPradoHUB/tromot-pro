import { supabase } from '@/integrations/supabase/client';

export const IMAGE_FORMAT: 'jpg' | 'webp' | 'png' = 'jpg';
export const IMAGE_QUALITY = 0.9;
export const IMAGE_MAX_SIDE = 2000;
export const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
export const THUMB_MAX_SIDE = 600;
export const THUMB_QUALITY = 0.8;

const MIME_BY_FORMAT = {
  jpg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
} as const;

export const normalizeProductCode = (code: string) =>
  code
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Converte qualquer imagem para o formato configurado, com fundo branco. */
export const convertImage = (
  file: File | Blob,
  maxSide: number,
  quality: number,
  format: 'jpg' | 'webp' | 'png' = IMAGE_FORMAT
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Canvas indisponível')); }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Falha ao converter imagem'))),
        MIME_BY_FORMAT[format],
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });

/** Link público fixo da imagem principal de um produto (sem query string). */
export const getFixedImageUrl = (code: string): string | null => {
  const normalized = normalizeProductCode(code || '');
  if (!normalized) return null;
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(`produtos/${normalized}.${IMAGE_FORMAT}`);
  return data.publicUrl.split('?')[0];
};

/** Verdadeiro se a URL já é o link fixo oficial (product-images/produtos/{CODE}.jpg). */
export const isFixedImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.split('?')[0];
  return (
    clean.includes('/product-images/produtos/') &&
    !clean.includes('/produtos/thumb/') &&
    clean.endsWith(`.${IMAGE_FORMAT}`)
  );
};

/**
 * Envia a imagem principal e a miniatura do produto (links fixos, sobrescreve).
 * Retorna a URL pública da principal SEM query string — é o link oficial que vai
 * para a tabela de valores, marketplaces e ERPs; nunca pode ter parâmetros.
 */
export const uploadProductImageSet = async (file: File | Blob, code: string): Promise<string> => {
  const normalized = normalizeProductCode(code || '');
  if (!normalized) throw new Error('Preencha o código do produto antes de enviar a imagem.');

  // Imagem principal: reduz a qualidade em passos de 0.05 até caber no limite (nunca abaixo de 0.75)
  let quality = IMAGE_QUALITY;
  let main = await convertImage(file, IMAGE_MAX_SIDE, quality);
  while (main.size > IMAGE_MAX_BYTES && quality > 0.75) {
    quality = Math.max(0.75, quality - 0.05);
    main = await convertImage(file, IMAGE_MAX_SIDE, quality);
  }

  const thumb = await convertImage(file, THUMB_MAX_SIDE, THUMB_QUALITY);

  const mime = MIME_BY_FORMAT[IMAGE_FORMAT];
  const mainPath = `produtos/${normalized}.${IMAGE_FORMAT}`;
  const thumbPath = `produtos/thumb/${normalized}.${IMAGE_FORMAT}`;

  const { error: mainErr } = await supabase.storage
    .from('product-images')
    .upload(mainPath, main, { upsert: true, contentType: mime, cacheControl: '60' });
  if (mainErr) throw mainErr;

  const { error: thumbErr } = await supabase.storage
    .from('product-images')
    .upload(thumbPath, thumb, { upsert: true, contentType: mime, cacheControl: '60' });
  if (thumbErr) throw thumbErr;

  const { data } = supabase.storage.from('product-images').getPublicUrl(mainPath);
  return data.publicUrl.split('?')[0];
};

/** URL da miniatura para listas/cards; devolve a original se não for do bucket product-images. */
export const getThumbUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return '';
  if (imageUrl.includes('/product-images/produtos/') && !imageUrl.includes('/produtos/thumb/')) {
    return imageUrl.replace('/produtos/', '/produtos/thumb/');
  }
  return imageUrl;
};

/** Baixa uma imagem de URL externa e grava no link fixo. Lança erro se o site de origem bloquear. */
export const standardizeExternalImage = async (url: string, code: string): Promise<string> => {
  const res = await fetch(url, { mode: 'cors' }).catch(() => {
    throw new Error('Não foi possível baixar (bloqueio do site de origem ou link inválido)');
  });
  if (!res.ok) throw new Error(`Download falhou (HTTP ${res.status})`);
  const blob = await res.blob();
  return uploadProductImageSet(blob, code);
};

/** Só para exibição: adiciona ?v= para furar o cache do navegador. O valor no banco continua sem parâmetro. */
export const withImageVersion = (url: string, version?: string | number | null) =>
  url && version ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(version))}` : url;
