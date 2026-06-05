const CACHE = 'habits-v1'
const ASSETS = [
  '/habbit-tracker/',
  '/habbit-tracker/index.html',
  '/habbit-tracker/src/styles/popup.css',
  '/habbit-tracker/src/scripts/popup.js',
  '/habbit-tracker/src/scripts/storage.js',
  '/habbit-tracker/src/scripts/helpers.js',
  '/habbit-tracker/src/scripts/background.js',
  '/habbit-tracker/manifest.json',
  '/habbit-tracker/icons/icon16.png',
  '/habbit-tracker/icons/icon48.png',
  '/habbit-tracker/icons/icon128.png',
  '/habbit-tracker/icons/icon192.png',
  '/habbit-tracker/icons/icon512.png',
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
