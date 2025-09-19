export interface BroadcastPayload {
  message: string;
  deeplink?: string;
  audience: {
    type: 'all' | 'tags';
    tags?: string[];
  };
}

export interface NotificationTemplate {
  id: string;
  label: string;
  template: string;
}

export interface NotificationPreferences {
  autoNotifyEnabled: boolean;
  templates: NotificationTemplate[];
}

export interface BroadcastResponse {
  success: boolean;
  message: string;
  recipientCount?: number;
}

export interface ContentNotification {
  id: string;
  title: string;
  type: 'manual' | 'product';
}