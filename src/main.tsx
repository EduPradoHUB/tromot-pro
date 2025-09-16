import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Captura do beforeinstallprompt
let deferredPrompt: any = null
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault()
  deferredPrompt = e
  ;(window as any).deferredPrompt = e
  console.log('[PWA] beforeinstallprompt capturado')
})

// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] SW registrado:', registration)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          console.log('[PWA] Novo SW encontrado')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nova versão instalada')
              if (confirm('Uma nova versão do app está disponível. Atualizar agora?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            }
          })
        })

        // Checar atualizações a cada 30 min
        setInterval(() => registration.update(), 30 * 60 * 1000)
      })
      .catch((err) => console.error('[PWA] Falha ao registrar SW:', err))
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
