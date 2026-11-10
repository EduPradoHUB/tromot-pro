import { useState } from 'react';
import { getThumbUrl } from '@/lib/productImage';

const FALLBACK = '/src/assets/photo-unavailable.png';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  /** true (padrão) usa a miniatura em listas/cards; false usa a imagem principal (detalhe). */
  thumb?: boolean;
};

/**
 * Imagem de produto com carregamento leve: usa a miniatura em listas,
 * com lazy loading e fallback para a imagem principal se a miniatura falhar.
 */
export const ProductImage = ({ src, alt, className, thumb = true }: Props) => {
  const [thumbFailed, setThumbFailed] = useState(false);

  const finalSrc = !src
    ? FALLBACK
    : thumb && !thumbFailed
      ? getThumbUrl(src)
      : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (thumb && !thumbFailed && src) setThumbFailed(true);
      }}
    />
  );
};
