import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './i18n';
import './index.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates on each page load
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — use registration.waiting (may be same as newWorker)
            const waitingWorker = registration.waiting || newWorker;
            if (confirm('Доступно обновление. Обновить приложение?')) {
              waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        });
      });
    }).catch((error) => {
      console.error('[PWA] Service Worker registration failed:', error);
    });

    // Reload on new SW activation
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
    <App />
);
