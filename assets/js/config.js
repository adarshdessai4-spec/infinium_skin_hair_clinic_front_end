(function () {
  const PROD_BASE = 'https://infiniumskinhairclinicbackend-production.up.railway.app';
  const DEV_BACKEND = 'http://localhost:8080';

  if (typeof window === 'undefined' || window.__INF_OTP_API_BASE) {
    return;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const isLocalhost = ['localhost', '127.0.0.1'].includes(hostname);
  const isHttps = window.location.protocol === 'https:';

  // Default: if running locally, hit local backend; otherwise use prod (https).
  window.__INF_OTP_API_BASE = isLocalhost ? DEV_BACKEND : PROD_BASE;

  // If served over HTTPS but base is HTTP (e.g., localhost), browsers will block mixed content.
  // In that case, rely on prod HTTPS backend unless explicitly overridden elsewhere.
  if (isHttps && window.__INF_OTP_API_BASE.startsWith('http://') && !isLocalhost) {
    window.__INF_OTP_API_BASE = PROD_BASE;
  }
})();
