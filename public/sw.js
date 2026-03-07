// Derive VERSION from the registration URL's ?build=... param.
// This lets us bust caches automatically per deploy/commit.
const href = self.location && self.location.href ? self.location.href : '';
const params = new URL(href).searchParams;
const VERSION = params.get('build') || 'dev';

// Namespaced caches per build
const SHELL_CACHE = `salud-shell-${VERSION}`;
const RUNTIME_CACHE = `salud-runtime-${VERSION}`;

const SHELL_URLS = [
    '/',
    '/game/play',
    '/game/setup/players',
    '/game/setup/mode',
    '/game/summary',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-512-maskable.png',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: delete old caches from prior builds
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((k) => {
                if (![SHELL_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
            }))
        ).then(() => self.clients.claim())
    );
});

// Fetch: navigation -> shell-first; static -> cache-first; everything else -> network-first
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    if (url.origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        event.respondWith(
            caches.match(req).then((cached) => {
                return cached || fetch(req).then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                }).catch(() => caches.match('/'));
            })
        );
        return;
    }

    if (/\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) return cached;
                return fetch(req).then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                });
            })
        );
        return;
    }

    event.respondWith(
        fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
            return res;
        }).catch(() => caches.match(req))
    );
});
