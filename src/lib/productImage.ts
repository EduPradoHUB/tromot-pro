import { supabase } from '@/integrations/supabase/client';

export const normalizeProductCode = (code: string) =>
  code
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const convertToJpeg = (file: File, maxSide = 1600, quality = 0.9): Promise<Blob> =>
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
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao converter imagem'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });

/** Envia a imagem para produtos/{CODE}.jpg (sobrescreve) e retorna a URL pública fixa, sem query string. */
export const uploadFixedProductImage = async (file: File, code: string): Promise<string> => {
  const normalized = normalizeProductCode(code || '');
  if (!normalized) throw new Error('Preencha o código do produto antes de enviar a imagem.');
  const path = `produtos/${normalized}.jpg`;
  const blob = await convertToJpeg(file);
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl.split('?')[0];
};

/** Só para exibição: adiciona ?v= para furar o cache do navegador. */
export const withImageVersion = (url: string, version?: string | number | null) =>
  url && version ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(version))}` : url;
