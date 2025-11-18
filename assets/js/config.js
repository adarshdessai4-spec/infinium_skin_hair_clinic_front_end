(function () {
  const PROD_BASE = 'https://infiniumskinhairclinic-production.up.railway.app';
  const DEV_BACKEND = 'http://localhost:8080';

  if (typeof window === 'undefined' || window.__INF_OTP_API_BASE) {
    return;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const isLocalhost = ['localhost', '127.0.0.1'].includes(hostname);

  if (isLocalhost) {
    // If we're running the frontend dev server (port != backend port), point APIs to backend.
    window.__INF_OTP_API_BASE = port && port !== '8080' ? DEV_BACKEND : '';
  } else {
    window.__INF_OTP_API_BASE = PROD_BASE;
  }
})();
