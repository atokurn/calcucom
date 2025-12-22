const CACHE_NAME = 'cekbiaya-v6';
const ASSETS_TO_CACHE = [
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
    './js/utils/ui-manager.js',
    './js/utils/data-exporter.js',
    // Feature Modules
    './js/modules/category-modal.js',
    './js/modules/bulk-mode.js',
    './js/modules/history-manager.js',
    './js/modules/simulation-calculator.js',
    './js/modules/ads-analyzer.js',
    './js/modules/bundling-calculator.js',
    './js/modules/compare-calculator.js',
    './js/modules/price-finder.js',
    './js/modules/roas-calculator.js',
    // Assets
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    // CDN (will fail gracefully if offline)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // Fallback for offline (optional)
                });
            })
    );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
