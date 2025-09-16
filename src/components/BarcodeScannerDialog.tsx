import * as React from 'react';
import { Camera, Type, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [isScanning, setIsScanning] = React.useState(false);
  const [manualInput, setManualInput] = React.useState('');
  const [showManualInput, setShowManualInput] = React.useState(false);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const codeReader = React.useRef<BrowserMultiFormatReader | null>(null);

  // Inicializa o leitor de código de barras
  React.useEffect(() => {
    try {
      codeReader.current = new BrowserMultiFormatReader();
    } catch (error) {
      console.error('Erro ao inicializar leitor de código:', error);
    }
  }, []);

  const detectBarcode = async () => {
    if (!codeReader.current || !videoRef.current) return;
    
    try {
      const result: Result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
      if (result) {
        const barcode = result.getText();
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
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Inicia a detecção contínua usando ZXing
        if (codeReader.current) {
          try {
            const result = await codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
              if (result) {
                const barcode = result.getText();
                onBarcodeDetected(barcode);
                stopCamera();
                onOpenChange(false);
                toast({
                  title: "Código detectado!",
                  description: `Código de barras: ${barcode}`,
                });
              }
              if (error && error.name !== 'NotFoundException') {
                console.error('Erro na detecção:', error);
              }
            });
          } catch (error) {
            console.error('Erro ao iniciar detecção:', error);
            toast({
              title: "Erro no scanner",
              description: "Tente usar o input manual.",
              variant: "destructive",
            });
            setShowManualInput(true);
            setIsScanning(false);
          }
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
    
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (error) {
        console.error('Erro ao parar reader:', error);
      }
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

  React.useEffect(() => {
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
          <DialogDescription>
            Use a câmera para escanear códigos de barras ou digite manualmente
          </DialogDescription>
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
                      autoPlay
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary border-dashed w-3/4 h-16 rounded-lg"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm text-center bg-black/60 rounded-lg px-3 py-2">
                        Posicione o código de barras dentro da área marcada
                      </p>
                    </div>
                  </>
                ) : (
                  <div 
                    className="flex items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={startCamera}
                  >
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
          
          <p className="text-xs text-muted-foreground text-center">
            O scanner funciona com códigos EAN-13, UPC-A, UPC-E e outros formatos padrão.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};