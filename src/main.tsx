import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  const prevController = navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!prevController) return
    if (document.getElementById('pwa-update-banner')) return
    const banner = document.createElement('div')
    banner.id = 'pwa-update-banner'
    banner.style.cssText =
      'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#161B22;border:1px solid #374151;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;display:flex;align-items:center;gap:12px;font-size:14px;font-family:sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.5);white-space:nowrap'
    banner.innerHTML =
      '<span>Nova versão disponível</span>' +
      '<button id="pwa-reload" style="background:#03A9F4;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px">Atualizar</button>' +
      '<button id="pwa-dismiss" style="background:transparent;color:#6B7280;border:none;cursor:pointer;font-size:18px;padding:0 4px;line-height:1">✕</button>'
    document.body.appendChild(banner)
    document.getElementById('pwa-reload')?.addEventListener('click', () => window.location.reload())
    document.getElementById('pwa-dismiss')?.addEventListener('click', () => banner.remove())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
