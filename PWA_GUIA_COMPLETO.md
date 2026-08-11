# Guia Completo: PWA com Vite + React (iOS & Android)

> Documentação baseada na implementação real do app HORAS.  
> Reutilizável em qualquer projeto React + Vite + Tailwind.  
> Versão atualizada com notificações push via Supabase (sem Firebase).

---

## O que é um PWA e por que funciona

Um PWA (Progressive Web App) transforma um site/app web em algo que:
- Instala na homescreen do celular como um app nativo
- Abre sem barra de endereço (modo standalone)
- Tem ícone próprio na tela inicial
- Funciona offline (via Service Worker + cache)
- Suporta notificações push (com configuração extra)

A experiência é idêntica a um app nativo para o usuário final, sem precisar publicar na App Store ou Google Play.

---

## Stack utilizada

- **Framework:** React + TypeScript + Vite
- **Plugin PWA:** `vite-plugin-pwa` (wrapper do Workbox)
- **Deploy:** Vercel (funciona em qualquer host com HTTPS)
- **Ícones:** PWABuilder (Microsoft) — pwabuilder.com/imageGenerator
- **Push notifications:** Supabase Edge Functions + Web Push Protocol (sem Firebase)

> ⚠️ PWA **exige HTTPS**. Localhost funciona para testes, mas produção precisa de certificado SSL.

---

## Arquitetura da solução

```
projeto/
├── public/
│   └── icons/
│       ├── android/
│       │   ├── launchericon-48x48.png
│       │   ├── launchericon-72x72.png
│       │   ├── launchericon-96x96.png
│       │   ├── launchericon-144x144.png
│       │   ├── launchericon-192x192.png
│       │   └── launchericon-512x512.png   ← obrigatório (maskable)
│       └── ios/
│           ├── 152.png
│           ├── 167.png
│           ├── 180.png                    ← principal para iPhone
│           └── 1024.png
├── src/
│   └── index.css                          ← safe-area insets
├── index.html                             ← meta tags iOS
└── vite.config.ts                         ← VitePWA plugin
```

---

## Passo a passo: Instalação PWA

### 1. Gerar os ícones

**Ferramenta:** https://www.pwabuilder.com/imageGenerator

1. Prepare uma imagem **1024x1024px** (PNG ou JPG) com o ícone do app
   - Ferramenta recomendada para criar o ícone: **Ideogram.ai** (gratuito, estilo Logo)
2. Acesse o PWABuilder Image Generator
3. Configure:
   - **Padding:** 0
   - **Background Color:** Custom → cor de fundo do app (ex: `#0B0E14`)
   - **Platforms:** marque Microsoft Store + Google Play + iOS App Store
4. Clique em **Generate** e baixe o ZIP
5. Extraia e organize nas pastas `public/icons/android/` e `public/icons/ios/`

---

### 2. Instalar a dependência

```bash
npm install vite-plugin-pwa -D
```

---

### 3. Configurar vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Nome Completo do App',        // ← altere
        short_name: 'NomeApp',               // ← altere (máx 12 chars)
        description: 'Descrição do app',     // ← altere
        theme_color: '#0B0E14',              // ← cor da status bar
        background_color: '#0B0E14',         // ← cor do splash screen
        display: 'standalone',               // sem barra de endereço
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/android/launchericon-48x48.png', sizes: '48x48', type: 'image/png' },
          { src: '/icons/android/launchericon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/android/launchericon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/android/launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/android/launchericon-192x192.png', sizes: '192x192', type: 'image/png' },
          {
            src: '/icons/android/launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'          // ← obrigatório para Android
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
})
```

---

### 4. Atualizar index.html

```html
<!-- Viewport com suporte a safe area (notch iPhone) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- PWA básico -->
<meta name="theme-color" content="#0B0E14" />
<meta name="mobile-web-app-capable" content="yes" />

<!-- iOS específico (Safari não lê o manifest.json completamente) -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NomeApp" />

<!-- Apple touch icons -->
<link rel="apple-touch-icon" href="/icons/ios/180.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/icons/ios/152.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/icons/ios/167.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/ios/180.png" />
```

> ⚠️ O Safari no iOS **ignora** o `manifest.json` para apple-touch-icon.  
> As meta tags `apple-mobile-web-app-*` são obrigatórias para iOS funcionar.

---

### 5. Safe area no CSS global

```css
/* src/index.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

aside {
  padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
}
```

---

### 6. Corrigir scroll de modais no Android

```tsx
// Container overlay (div mais externa)
<div className="fixed inset-0 overflow-y-auto z-50">

  {/* Container interno do modal */}
  <div className="
    w-full mx-4 sm:mx-0
    max-h-[90dvh]       /* dvh = dynamic viewport height, correto para mobile */
    overflow-y-auto     /* scroll interno */
    overscroll-contain  /* impede scroll vazar para a página de fundo */
    touch-pan-y         /* garante gesto de scroll no Android */
  ">
    {/* conteúdo */}
  </div>

</div>
```

> Use `dvh` em vez de `vh`. No iOS, `vh` inclui a barra de endereço e causa overflow.

---

## Como instalar o PWA no celular

### iPhone — Safari obrigatório
1. Abra o link no **Safari** (obrigação da Apple — não tem como contornar)
2. Ícone de compartilhar → **"Adicionar à Tela de Início"**
3. Confirme

### Android — Chrome
1. Abra no **Chrome**
2. Menu (3 pontos) → **"Instalar aplicativo"**
3. Confirme

---

## Notificações Push — 100% Supabase (sem Firebase)

### Suporte por plataforma

| Plataforma | Suporte | Requisito |
|---|---|---|
| Android | ✅ Funciona bem | PWA instalado + aceitar permissão |
| iOS 16.4+ | ✅ Funciona | PWA **instalado na homescreen** via Safari |
| iOS abaixo de 16.4 | ❌ | Não suportado |
| Safari sem instalar | ❌ | Não funciona |

---

### Arquitetura 100% Supabase

```
Frontend (React)
    ↓ 1. pede permissão ao usuário
    ↓ 2. gera subscription (endpoint + chaves)
    ↓ 3. salva no Supabase (tabela push_subscriptions)

Supabase Edge Function
    ↓ disparada por trigger, cron ou chamada manual
    ↓ lê subscriptions da tabela
    ↓ envia push via Web Push Protocol (VAPID)

Dispositivo
    ↓ Service Worker recebe o push
    ↓ exibe notificação na tela
```

---

### Passo a passo: Notificações Push

#### 1. Gerar VAPID Keys (uma vez só)

```bash
npx web-push generate-vapid-keys
```

Guarde as duas chaves:
- `VAPID_PUBLIC_KEY` → vai para o frontend (pode ser pública)
- `VAPID_PRIVATE_KEY` → vai para variável de ambiente do Supabase (secreta)

---

#### 2. Migration no Supabase

```sql
CREATE TABLE push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário acessa apenas suas subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);
```

---

#### 3. Frontend — pedir permissão e salvar subscription

```typescript
// src/services/pushNotifications.ts

const VAPID_PUBLIC_KEY = 'SUA_CHAVE_PUBLICA_AQUI'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export async function registrarPushNotification(usuarioId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push não suportado neste browser')
    return
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })

  const sub = subscription.toJSON()

  // Salvar no Supabase
  await supabase.from('push_subscriptions').upsert({
    usuario_id: usuarioId,
    endpoint: sub.endpoint,
    p256dh: sub.keys?.p256dh,
    auth: sub.keys?.auth
  }, { onConflict: 'usuario_id,endpoint' })
}
```

---

#### 4. Service Worker — receber e exibir notificação

No `vite.config.ts`, adicione dentro do `VitePWA`:

```typescript
strategies: 'injectManifest',
srcDir: 'src',
filename: 'sw.ts',
```

Crie `src/sw.ts`:

```typescript
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/android/launchericon-192x192.png',
      badge: '/icons/android/launchericon-96x96.png',
      data: data.url ?? '/'
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data)
  )
})
```

---

#### 5. Supabase Edge Function — enviar push

Crie `supabase/functions/send-push/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

webpush.setVapidDetails(
  'mailto:seu@email.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

Deno.serve(async (req) => {
  const { usuario_id, title, body, url } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('usuario_id', usuario_id)

  const payload = JSON.stringify({ title, body, url })

  for (const sub of subs ?? []) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Deploy da função:
```bash
supabase functions deploy send-push
```

Variáveis de ambiente no Supabase Dashboard → Settings → Edge Functions:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

---

## Prompt pronto para outro projeto

```
Preciso transformar este app React + Vite em um PWA instalável no iPhone e Android.

Stack: React + TypeScript + Tailwind + Vite
Deploy: [Vercel / Netlify / outro]

## O que precisa ser feito:

### 1. Instalar dependência
npm install vite-plugin-pwa -D

### 2. Configurar vite.config.ts
Adicionar VitePWA com manifest:
- name, short_name, description do app
- theme_color e background_color: cor principal do app
- display: 'standalone'
- icons: android 48/72/96/144/192/512 em public/icons/android/
- icon 512 com purpose: 'any maskable'
- workbox com navigateFallback: '/index.html'

### 3. Atualizar index.html
- viewport com viewport-fit=cover
- meta theme-color
- meta apple-mobile-web-app-capable: yes
- meta apple-mobile-web-app-status-bar-style: black-translucent
- meta apple-mobile-web-app-title
- link apple-touch-icon para ios/152, ios/167, ios/180

### 4. CSS global (src/index.css)
body com padding: env(safe-area-inset-*)
aside com padding-bottom: calc(env(safe-area-inset-bottom) + 16px)

### 5. Scroll de modais no Android
Container externo: overflow-y-auto
Container interno: max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y

Os ícones serão copiados manualmente.
Mostre o diff completo antes de executar. Não faça commit.
```

---

## Referências

- [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/)
- [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Web Push no iOS — Apple](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [web-push npm](https://www.npmjs.com/package/web-push)
