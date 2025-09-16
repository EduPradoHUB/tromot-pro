import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

let deferredPrompt: any = null
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault()
  deferredPrompt = e
  ;(window as any).deferredPrompt = e
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error)
  })
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(<App />)
