import React, { useState, useEffect } from 'react';

interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

let toastCallback: ((toast: ToastProps) => void) | null = null

export function toast(props: ToastProps) {
  if (toastCallback) {
    toastCallback(props)
  } else {
    // Use visual notification instead of alert
    console.log('🍞 Toast fallback:', props.title, props.description);
    
    // Create a simple notification div
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${props.variant === 'destructive' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${props.title || ''}</div>
      <div style="font-size: 14px; opacity: 0.9;">${props.description || ''}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  useEffect(() => {
    toastCallback = (newToast: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9)
      const toastWithId = { ...newToast, id }
      
      setToasts(prev => [...prev, toastWithId])
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 5000)
    }

    return () => {
      toastCallback = null
    }
  }, [])

  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}