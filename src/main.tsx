import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Captura do beforeinstallprompt o mais cedo possível
let deferredPrompt: any = null
window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault()
  deferredPrompt = e
  ;(window as any).deferredPrompt = e
  console.log('[PWA] beforeinstallprompt capturado')
})

// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[PWA] SW registrado:', registration)

      // Detecta nova versão do SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        console.log('[PWA] Novo SW encontrado...')
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nova versão instalada')
            if (confirm('Uma nova versão do app está disponível. Atualizar agora?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          }
        })
      })

      // Verifica atualizações a cada 30 min
      setInterval(() => registration.update(), 30 * 60 * 1000)
    } catch (err) {
      console.error('[PWA] Falha ao registrar SW:', err)
    }
  })

  // Recarrega uma vez quando o novo SW assume o controle
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(<App />)
