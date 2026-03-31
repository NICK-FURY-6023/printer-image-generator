import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Web Vitals reporting
if (import.meta.env.PROD) {
  import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
    const log = (metric) => {
      if (import.meta.env.VITE_SENTRY_DSN) {
        // Send to Sentry if configured
        console.log(`[WebVital] ${metric.name}: ${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'}`);
      }
    };
    onCLS(log); onFID(log); onLCP(log); onFCP(log); onTTFB(log);
  }).catch(() => {});
}
