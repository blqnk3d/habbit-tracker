const CACHE = 'habits-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/src/styles/popup.css',
  '/src/scripts/popup.js',
  '/src/scripts/storage.js',
  '/src/scripts/helpers.js',
  '/src/scripts/background.js',
  '/pwa-manifest.json',
  '/icons/icon16.png',
  '/icons/icon48.png',
  '/icons/icon128.png',
  '/icons/icon192.png',
  '/icons/icon512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  )
})
