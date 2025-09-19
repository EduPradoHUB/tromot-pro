/**
 * Utilitário para notificações automáticas de alteração de conteúdo
 * Integra com as preferências salvas localmente
 */

import { sendAutoNotification } from '@/services/notifications';
import { NotificationTemplate } from '@/types/notifications';

const AUTO_NOTIFY_ON_CONTENT_CHANGE = 'auto_notify_on_content_change';
const NOTIFICATION_TEMPLATES = 'notification_templates';

function isAutoNotifyEnabled(): boolean {
  try {
    const saved = localStorage.getItem(AUTO_NOTIFY_ON_CONTENT_CHANGE);
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
}

function getTemplates(): NotificationTemplate[] {
  try {
    const saved = localStorage.getItem(NOTIFICATION_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function processTemplate(template: string, data: Record<string, any>): string {
  let processed = template;
  Object.entries(data).forEach(([key, value]) => {
    processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return processed;
}

export async function notifyManualUpdated({ id, titulo }: { id: string; titulo: string }) {
  console.log('[notifications] notifyManualUpdated called:', { id, titulo });

  if (!isAutoNotifyEnabled()) {
    console.log('[notifications] Auto-notify desabilitado');
    return;
  }

  const templates = getTemplates();
  const manualTemplate = templates.find(t => t.id === 'manual_updated');
  
  if (!manualTemplate) {
    console.warn('[notifications] Template para manual não encontrado');
    return;
  }

  const message = processTemplate(manualTemplate.template, { titulo });
  const deeplink = `/produto/${id}`;

  try {
    const result = await sendAutoNotification(message, deeplink);
    console.log('[notifications] Manual notification sent:', result);
  } catch (error) {
    console.error('[notifications] Erro ao enviar notificação de manual:', error);
  }
}

export async function notifyProdutoUpdated({ id, nome }: { id: string; nome: string }) {
  console.log('[notifications] notifyProdutoUpdated called:', { id, nome });

  if (!isAutoNotifyEnabled()) {
    console.log('[notifications] Auto-notify desabilitado');
    return;
  }

  const templates = getTemplates();
  const productTemplate = templates.find(t => t.id === 'product_updated');
  
  if (!productTemplate) {
    console.warn('[notifications] Template para produto não encontrado');
    return;
  }

  const message = processTemplate(productTemplate.template, { nome });
  const deeplink = `/produto/${id}`;

  try {
    const result = await sendAutoNotification(message, deeplink);
    console.log('[notifications] Product notification sent:', result);
  } catch (error) {
    console.error('[notifications] Erro ao enviar notificação de produto:', error);
  }
}

// Helper para integração simples onde já existe um handler de save
export function withAutoNotifyOnSave<T extends (...args: any[]) => any>(
  originalSaveFn: T,
  notifyFn: () => void
): T {
  return ((...args: any[]) => {
    const result = originalSaveFn(...args);
    
    // Se for uma Promise, aguardar conclusão antes de notificar
    if (result && typeof result.then === 'function') {
      return result.then((res: any) => {
        notifyFn();
        return res;
      });
    }
    
    // Se não for Promise, notificar imediatamente
    notifyFn();
    return result;
  }) as T;
}