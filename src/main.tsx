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

// Register service worker is handled by vite-plugin-pwa

createRoot(document.getElementById("root")!).render(<App />);
