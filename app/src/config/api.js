/**
 * api.js
 *
 * Centralised API base URL configuration.
 *
 * Key responsibilities:
 * - Provides a single source of truth for the backend URL
 * - Switches automatically between the local dev server and the production server
 */

// VITE_API_URL is set in the Render environment variables for the production deployment.
// During local development it is not set, so we fall back to localhost:5001.
//
// This pattern means you never need to change any API call in the app when deploying —
// just set VITE_API_URL on the hosting platform and all requests go to the right place.
const API_URL = import.meta.env.VITE_API_URL
  || "http://localhost:5001"

export default API_URL
