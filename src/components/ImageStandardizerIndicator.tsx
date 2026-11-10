import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Pause, Play, X } from 'lucide-react';
import {
  subscribeStandardizer,
  getStandardizerState,
  pauseStandardization,
  resumeStandardization,
  cancelStandardization,
} from '@/lib/imageStandardizer';

/**
 * Indicador flutuante da padronização de imagens em segundo plano.
 * Visível em qualquer página enquanto o processamento estiver rodando ou pausado.
 */
export const ImageStandardizerIndicator = () => {
  const state = useSyncExternalStore(subscribeStandardizer, getStandardizerState);

  if (state.status === 'idle') return null;

  const paused = state.status === 'paused';

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-lg">
      {paused ? (
        <Pause className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      )}
      <span className="text-sm font-medium">
        Padronizando imagens {state.done}/{state.total}
      </span>
      {paused ? (
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={resumeStandardization}>
          <Play className="w-4 h-4 mr-1" />
          Continuar
        </Button>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={pauseStandardization}>
          <Pause className="w-4 h-4 mr-1" />
          Pausar
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelStandardization}>
        <X className="w-4 h-4 mr-1" />
        Cancelar
      </Button>
    </div>
  );
};
