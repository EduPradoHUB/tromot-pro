/**
 * Serviço de Notificações - TROMOT PRO
 * 
 * TODO: Integrar com provider de push real no futuro
 * Para implementar push notifications reais:
 * 1. Adicionar Firebase/OneSignal SDK
 * 2. Substituir console.log por chamadas reais da API
 * 3. Gerenciar tokens de dispositivos
 * 4. Configurar service worker para receber notificações
 */

import { BroadcastPayload, BroadcastResponse } from '@/types/notifications';

const NOTIFICATIONS_ENABLED = true; // Feature flag
const MOCK_DELAY = 1000; // Simula latência da API

export async function sendBroadcast(payload: BroadcastPayload): Promise<BroadcastResponse> {
  console.log('[notifications] sendBroadcast payload:', payload);

  if (!NOTIFICATIONS_ENABLED) {
    console.log('[notifications] Feature desabilitada');
    return { success: false, message: 'Notificações desabilitadas' };
  }

  // Validações
  if (!payload.message.trim()) {
    return { success: false, message: 'Mensagem não pode estar vazia' };
  }

  if (payload.message.length > 240) {
    return { success: false, message: 'Mensagem deve ter no máximo 240 caracteres' };
  }

  if (payload.deeplink && !payload.deeplink.startsWith('/')) {
    return { success: false, message: 'Deeplink deve começar com "/"' };
  }

  try {
    // Simula envio (substituir por API real no futuro)
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    const mockRecipientCount = payload.audience.type === 'all' ? 1250 : 
      (payload.audience.tags?.length || 0) * 75;

    console.log('[notifications] Broadcast enviado com sucesso:', {
      message: payload.message,
      audience: payload.audience,
      recipientCount: mockRecipientCount
    });

    return {
      success: true,
      message: 'Notificação enviada com sucesso',
      recipientCount: mockRecipientCount
    };

  } catch (error) {
    console.error('[notifications] Erro ao enviar broadcast:', error);
    return {
      success: false,
      message: 'Falha ao enviar notificação'
    };
  }
}

// Função auxiliar para envio automático
export async function sendAutoNotification(
  message: string, 
  deeplink?: string
): Promise<BroadcastResponse> {
  return sendBroadcast({
    message,
    deeplink,
    audience: { type: 'all' }
  });
}