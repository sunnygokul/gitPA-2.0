import axios from 'axios';

// Use Vite environment variable for API base URL in production/preview.
// Vite exposes variables prefixed with `VITE_` via `import.meta.env`.
// Default to same-origin so `/api/*` routes resolve to Vercel serverless functions in production.
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({ baseURL });

export default api;