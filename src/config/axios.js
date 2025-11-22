import axios from "axios";

// Set config defaults when creating the instance
// Use relative '/api' in dev (localhost) so Vite proxy handles CORS; otherwise use the ngrok/production URL.
const defaultBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? '/api/'
  : 'https://thioacetic-danny-postpositively.ngrok-free.dev/api/';

const api = axios.create({
  baseURL: defaultBase,
});

// Add ngrok-skip-browser-warning header for ngrok
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Add ngrok header to skip browser warning
    config.headers["ngrok-skip-browser-warning"] = "true";

    // DEBUG: Log outgoing request details (temporary)
    try {
      const fullUrl = new URL(config.url, config.baseURL || window.location.origin).href;
      const hasAuth = !!config.headers["Authorization"];
      const authPreview = hasAuth ? String(config.headers["Authorization"]).slice(0, 20) + '...' : null;
      // Use console.debug so these messages are easy to filter in DevTools
      console.debug('[api] Request:', config.method?.toUpperCase(), fullUrl, { hasAuth, authPreview });
    } catch (e) {
      // ignore URL parsing errors in older browsers
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Log response errors (temporary) to aid debugging of 404 vs Swagger
api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const req = error?.config || {};
      const fullUrl = req.url && (new URL(req.url, req.baseURL || window.location.origin).href);
      const status = error?.response?.status;
      console.debug('[api] Response error:', req.method?.toUpperCase(), fullUrl, 'status=', status, error?.message);
    } catch (e) {
      // ignore logging errors
    }
    return Promise.reject(error);
  }
);

export default api;
