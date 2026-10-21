// NurseVault service worker: keeps the app shell available offline.
// It never caches Supabase data, so private content and sign-in sessions are not stored here.
const SHELL = 'nv-shell-v1', FONTS = 'nv-fonts-v1'

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    const urls = ['/', '/manifest.webmanifest', '/icon.svg']
    try {
      const html = await (await fetch('/', { cache: 'reload' })).text()
      for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) urls.push(m[1])
    } catch (_) {}
    await Promise.all(urls.map(u => cache.add(u).catch(() => {})))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL && k !== FONTS) await caches.delete(k)
    await self.clients.claim()
  })())
})

const put = (name, req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(name).then(c => c.put(req, copy)) } return res }

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).then(r => put(SHELL, '/', r)).catch(() => caches.match('/')))
      return
    }
    if (url.pathname.startsWith('/assets/')) {
      e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(SHELL, req, r))))
      return
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(SHELL, req, r))))
    return
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(FONTS, req, r)).catch(() => hit)))
  }
})
