// Fallback toast implementation to avoid React conflicts
export const toast = (options: { 
  title?: string; 
  description?: string; 
  variant?: 'default' | 'destructive' 
}) => {
  console.log('🍞 Toast called:', options.title, options.description);
  
  // Create a simple notification div instead of alert
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${options.variant === 'destructive' ? '#ef4444' : '#10b981'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    max-width: 300px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${options.title || ''}</div>
    <div style="font-size: 14px; opacity: 0.9;">${options.description || ''}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
};

export const useToast = () => ({
  toast
});