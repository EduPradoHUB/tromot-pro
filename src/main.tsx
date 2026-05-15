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

// O Service Worker antigo estava mantendo páginas em cache e podia impedir
// links compartilhados de abrir corretamente. Mantemos a limpeza, sem registrar
// um novo SW, para evitar loops de reload/tela preta no domínio público.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
    } catch (error) {
      console.warn('[PWA] Service Worker cleanup failed:', error);
    }
  });
}


createRoot(document.getElementById("root")!).render(
  <App />
);
