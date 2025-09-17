import React from 'react';
import { Camera, Type, X } from 'lucide-react';

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
  if (!open) return null;

  // Função simplificada para entrada manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    const barcode = input.value.trim();
    
    if (barcode) {
      onBarcodeDetected(barcode);
      onOpenChange(false);
      input.value = '';
    }
  };

  // Função para simular detecção de câmera (placeholder)
  const handleCameraMode = () => {
    // Por enquanto, só mostra uma mensagem
    alert('Função de câmera temporariamente desabilitada. Use a entrada manual.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Escanear Código de Barras</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCameraMode}
            className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Camera className="h-4 w-4" />
            Câmera
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg bg-primary text-white"
          >
            <Type className="h-4 w-4" />
            Manual
          </button>
        </div>

        {/* Manual Input */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Digite o código de barras:
            </label>
            <input
              type="text"
              placeholder="Ex: 1234567890123"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 p-3 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 p-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Digite o código de barras do produto para encontrá-lo rapidamente
        </p>
      </div>
    </div>
  );
};