import React, { useState, useEffect, ReactNode } from 'react';

interface ToastProps {
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "destructive"
}

// Simple global toast system that doesn't rely on React hooks
let toastCounter = 0;

function createToastElement(props: ToastProps): HTMLElement {
  const id = `toast-${++toastCounter}`;
  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${props.variant === 'destructive' ? '#ef4444' : '#10b981'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 350px;
    font-family: system-ui, -apple-system, sans-serif;
    margin-bottom: 8px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  toast.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${props.title || ''}</div>
    <div style="font-size: 14px; opacity: 0.9;">${props.description || ''}</div>
  `;
  
  return toast;
}

export function toast(props: ToastProps) {
  try {
    const toastElement = createToastElement(props);
    document.body.appendChild(toastElement);
    
    // Animate in
    setTimeout(() => {
      toastElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.style.transform = 'translateX(400px)';
        setTimeout(() => {
          if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
          }
        }, 300);
      }
    }, 4000);
    
  } catch (error) {
    // Fallback to console if DOM manipulation fails
    console.log('🍞 Toast:', props.title, props.description);
  }
}

export function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {}, // Accept argument but don't do anything
    toasts: [], // Empty array for compatibility
  }
}