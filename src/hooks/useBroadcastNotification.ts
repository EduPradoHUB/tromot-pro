import { useMutation } from '@tanstack/react-query';
import { sendBroadcast } from '@/services/notifications';
import { BroadcastPayload } from '@/types/notifications';
import { toast } from '@/hooks/use-toast';

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (payload: BroadcastPayload) => sendBroadcast(payload),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Notificação enviada!",
          description: `Enviada para ${response.recipientCount} usuários`,
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: response.message,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('[notifications] Erro na mutation:', error);
      toast({
        title: "Falha ao enviar",
        description: "Erro interno do sistema",
        variant: "destructive"
      });
    }
  });
}