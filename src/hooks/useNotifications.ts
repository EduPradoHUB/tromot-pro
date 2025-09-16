import * as React from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      // Check if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
          badge: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
          ...options
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
          ...options
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification
  };
};