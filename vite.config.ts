import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'HORAS — Banco de Horas',
        short_name: 'HORAS',
        description: 'Controle de banco de horas corporativo',
        theme_color: '#0B0E14',
        background_color: '#0B0E14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/android/launchericon-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/icons/android/launchericon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/android/launchericon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/android/launchericon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/android/launchericon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/android/launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-cache',
            },
          },
        ],
      }
    })
  ],
})