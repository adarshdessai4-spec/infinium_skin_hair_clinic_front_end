(function () {
  const PROD_BASE = 'https://infiniumskinhairclinic-production.up.railway.app';

  if (typeof window === 'undefined') {
    return;
  }

  if (window.__INF_OTP_API_BASE) {
    return;
  }

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  window.__INF_OTP_API_BASE = isLocalhost ? '' : PROD_BASE;
})();
