import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Capturar o evento beforeinstallprompt antes do React carregar
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Early beforeinstallprompt captured');
  e.preventDefault();
  deferredPrompt = e;
  (window as any).deferredPrompt = e;
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered successfully:', registration);
      
      // Escutar atualizações do SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[PWA] New service worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker installed, prompting for update');
              
              // Notificar usuário sobre atualização disponível
              if (confirm('Uma nova versão do app está disponível. Atualizar agora?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Verificar atualizações periodicamente (a cada 30 minutos)
      setInterval(() => {
        registration.update();
      }, 1800000);
      
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });

  // Escutar quando o novo SW assume controle
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] New service worker activated');
    window.location.reload();
  });
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
