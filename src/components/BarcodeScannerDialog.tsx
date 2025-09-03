import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Type, AlertCircle } from 'lucide-react';

// Tipos para BarcodeDetector API
interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: Array<{x: number; y: number}>;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: BarcodeDetectorOptions): {
        detect(element: HTMLVideoElement | HTMLImageElement): Promise<DetectedBarcode[]>;
        getSupportedFormats(): Promise<string[]>;
      };
    };
  }
}

type BarcodeDetectorInstance = {
  detect(element: HTMLVideoElement | HTMLImageElement): Promise<DetectedBarcode[]>;
  getSupportedFormats(): Promise<string[]>;
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({
  open,
  onOpenChange,
  onBarcodeDetected,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [barcodeDetector, setBarcodeDetector] = useState<BarcodeDetectorInstance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verifica se BarcodeDetector está disponível
  useEffect(() => {
    if ('BarcodeDetector' in window && window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
        setBarcodeDetector(detector);
      } catch (error) {
        console.warn('BarcodeDetector não suportado:', error);
      }
    }
  }, []);

  const detectBarcode = async () => {
    if (!barcodeDetector || !videoRef.current) return;
    
    try {
      const barcodes = await barcodeDetector.detect(videoRef.current);
      if (barcodes.length > 0) {
        const barcode = barcodes[0].rawValue;
        onBarcodeDetected(barcode);
        stopCamera();
        onOpenChange(false);
        toast({
          title: "Código detectado!",
          description: `Código de barras: ${barcode}`,
        });
      }
    } catch (error) {
      console.error('Erro na detecção:', error);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment' // Usa câmera traseira no celular
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Se BarcodeDetector estiver disponível, usa ele
        if (barcodeDetector) {
          scanIntervalRef.current = setInterval(detectBarcode, 100);
        } else {
          // Fallback: instrui o usuário a usar input manual
          toast({
            title: "Scanner automático não disponível",
            description: "Use o botão 'Digitar' para inserir o código manualmente.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast({
        title: "Erro ao acessar câmera",
        description: "Não foi possível acessar a câmera. Tente usar o input manual.",
        variant: "destructive",
      });
      setShowManualInput(true);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeDetected(manualInput.trim());
      onOpenChange(false);
      setManualInput('');
      setShowManualInput(false);
    }
  };

  useEffect(() => {
    if (open && !showManualInput) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setShowManualInput(false);
      setManualInput('');
    }
    
    return () => {
      stopCamera();
    };
  }, [open, showManualInput]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showManualInput ? (
            <>
              {/* Scanner de câmera */}
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary border-dashed w-3/4 h-16 rounded-lg"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm text-center bg-black/60 rounded-lg px-3 py-2">
                        {barcodeDetector 
                          ? "Posicione o código de barras dentro da área marcada" 
                          : "Câmera ativa. Use 'Digitar' para inserir o código manualmente"
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para iniciar o escaneamento
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={startCamera}
                  disabled={isScanning}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isScanning ? 'Escaneando...' : 'Iniciar Câmera'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Digitar
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Input manual */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-barcode">Código de barras (EAN/UPC)</Label>
                  <Input
                    id="manual-barcode"
                    placeholder="Digite o código de barras..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="flex-1"
                  >
                    Buscar Produto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManualInput(false);
                      setManualInput('');
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Câmera
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {!barcodeDetector && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Scanner automático não disponível neste navegador. Use o input manual.</span>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            O scanner funciona com códigos EAN-13, UPC-A, UPC-E e outros formatos padrão.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};