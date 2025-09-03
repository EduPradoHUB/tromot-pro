import React from 'react';
import { Share, Plus, Smartphone } from 'lucide-react';

export function IOSInstallInstructions() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-3 text-center">Como instalar no iOS:</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Share className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">1. Toque no ícone de compartilhar</p>
              <p className="text-muted-foreground">Na barra inferior do Safari</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">2. Selecione "Adicionar à Tela de Início"</p>
              <p className="text-muted-foreground">Role para baixo se necessário</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">3. Confirme "Adicionar"</p>
              <p className="text-muted-foreground">O app aparecerá na sua tela inicial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}