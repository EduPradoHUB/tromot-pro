import React, { useEffect } from 'react';
import { logPWAStatus } from '@/utils/pwaUtils';

// Componente invisível que apenas faz logging do status PWA
export const PWAStatusIndicator: React.FC = () => {
  useEffect(() => {
    // Log detalhado do status PWA quando a aplicação carrega
    console.log('🚀 [PWA] Inicializando verificação de status...');
    
    const checkStatus = async () => {
      await logPWAStatus();
    };

    // Verificar imediatamente
    checkStatus();

    // Verificar novamente após 3 segundos (quando service worker estiver ativo)
    const delayedCheck = setTimeout(() => {
      console.log('🔄 [PWA] Verificação de status após carregamento completo...');
      checkStatus();
    }, 3000);

    return () => clearTimeout(delayedCheck);
  }, []);

  // Este componente não renderiza nada visível
  return null;
};