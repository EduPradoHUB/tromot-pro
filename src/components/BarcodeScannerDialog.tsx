import * as React from 'react';
import { Camera, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  let manualInput = '';

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeDetected(manualInput.trim());
      onOpenChange(false);
      manualInput = '';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </h2>
          <p className="text-sm text-gray-600">
            Digite o código de barras manualmente
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="manual-barcode">Código de barras (EAN/UPC)</Label>
            <Input
              id="manual-barcode"
              placeholder="Digite o código de barras..."
              onChange={(e) => manualInput = e.target.value}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleManualSubmit}
              className="flex-1"
            >
              <Type className="h-4 w-4 mr-2" />
              Buscar Produto
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Digite o código de barras EAN-13, UPC-A, UPC-E ou outros formatos padrão.
        </p>
      </div>
    </div>
  );
};