import * as React from 'react';
import { Camera, Type, X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrowserMultiFormatReader } from '@zxing/browser';

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
  const [mode, setMode] = React.useState<'camera' | 'manual'>('camera');
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manualInput, setManualInput] = React.useState('');
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const codeReaderRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Inicializar scanner quando o modal abrir
  React.useEffect(() => {
    if (open && mode === 'camera') {
      startScanning();
    } else {
      stopScanning();
    }

    // Cleanup quando o modal fechar
    return () => {
      stopScanning();
    };
  }, [open, mode]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Verificar se há câmeras disponíveis
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('Nenhuma câmera encontrada no dispositivo');
      }

      // Inicializar o leitor de código de barras
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Preferir câmera traseira em dispositivos móveis
      const preferredDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      ) || videoDevices[0];

      // Configurar stream de vídeo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: preferredDevice.deviceId,
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Iniciar decodificação
        codeReaderRef.current.decodeFromVideoDevice(
          preferredDevice.deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const barcodeText = result.getText();
              onBarcodeDetected(barcodeText);
              onOpenChange(false);
              stopScanning();
            }
          }
        );
      }
    } catch (err) {
      console.error('Erro ao inicializar scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Permissão de câmera negada. Por favor, permita o acesso à câmera e tente novamente.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('Nenhuma câmera')) {
        setError('Nenhuma câmera foi encontrada. Use a entrada manual.');
      } else {
        setError('Erro ao acessar a câmera. Tente a entrada manual.');
      }
      
      setMode('manual');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    // Parar stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Parar vídeo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Limpar referência do leitor
    codeReaderRef.current = null;
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeDetected(manualInput.trim());
      onOpenChange(false);
      setManualInput('');
    }
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
    setError(null);
    setManualInput('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Escanear Código de Barras</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button
              variant={mode === 'camera' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('camera')}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Câmera
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              <Type className="h-4 w-4 mr-2" />
              Manual
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {mode === 'camera' ? (
            <div className="space-y-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    playsInline
                    muted
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary rounded-lg w-48 h-32 opacity-50"></div>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-600 text-center">
                {isScanning 
                  ? 'Aponte a câmera para o código de barras' 
                  : 'Clique em "Iniciar Scanner" para começar'
                }
              </p>
              
              {!isScanning && !error && (
                <Button onClick={startScanning} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Scanner
                </Button>
              )}
            </div>
          ) : (
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
              
              <Button
                onClick={handleManualSubmit}
                className="w-full"
                disabled={!manualInput.trim()}
              >
                <Type className="h-4 w-4 mr-2" />
                Buscar Produto
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Digite o código de barras EAN-13, UPC-A, UPC-E ou outros formatos padrão.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};