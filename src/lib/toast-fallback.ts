// Fallback toast implementation to avoid React conflicts
export const toast = (options: { 
  title?: string; 
  description?: string; 
  variant?: 'default' | 'destructive' 
}) => {
  // Create a simple notification div
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

  // SECURITY FIX: usar textContent em vez de innerHTML para evitar XSS
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
  titleEl.textContent = options.title || '';

  const descEl = document.createElement('div');
  descEl.style.cssText = 'font-size: 14px; opacity: 0.9;';
  descEl.textContent = options.description || '';

  notification.appendChild(titleEl);
  notification.appendChild(descEl);
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
