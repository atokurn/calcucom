const CACHE_NAME = 'cekbiaya-v12';

const LOCAL_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    // Core JS
    './js/script.js',
    './js/data.js',
    './js/data-tiktok.js',
    './js/data-tokopedia.js',
    './js/constants.js',
    './js/state.js',
    './js/tailwind-config.js',
    // Core modules
    './js/core/pricing-engine.js',
    // Utility modules
    './js/utils/debounce.js',
    './js/utils/formatters.js',
    './js/utils/storage.js',
    './js/utils/validation.js',
    './js/utils/sanitize.js',
    './js/utils/cloud-sync.js',
    './js/utils/ui-manager.js',
    './js/utils/data-exporter.js',
    // Feature modules
    './js/modules/category-modal.js',
    './js/modules/bulk-mode.js',
    './js/modules/history-manager.js',
    './js/modules/simulation-calculator.js',
    './js/modules/ads-analyzer.js',
    './js/modules/bundling-calculator.js',
    './js/modules/compare-calculator.js',
    './js/modules/price-finder.js',
    './js/modules/roas-calculator.js',
    // PWA assets
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg'
];

const EXTERNAL_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

async function cacheLocalAssets() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(LOCAL_ASSETS);
}

async function cacheExternalAssetsBestEffort() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(
        EXTERNAL_ASSETS.map(async url => {
            const response = await fetch(url, { mode: 'no-cors' });
            await cache.put(url, response);
        })
    );
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('./index.html');
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await caches.match(request);
    const fetched = fetch(request)
        .then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => undefined);

    return cached || fetched || caches.match('./index.html');
}

self.addEventListener('install', event => {
    event.waitUntil(
        cacheLocalAssets()
            .then(cacheExternalAssetsBestEffort)
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // Cloudflare Functions API responses can contain user/session-specific data.
    // Never serve them from the PWA cache.
    if (url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});
