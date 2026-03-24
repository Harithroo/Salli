// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (window.__salliSwReloading) return;
                window.__salliSwReloading = true;
                window.location.reload();
            });

            const registration = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });

            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                if (!installing) return;
                installing.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });

            registration.update().catch(() => {});
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    });
}
