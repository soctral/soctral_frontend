/**
 * App-wide config. API base URL is read from VITE_API_URL in .env.
 * Use this module anywhere you need the API base URL (fetch, socket, etc.).
 */
const FALLBACK_API_URL = "https://soctra-api-dev-94e0fc23a375.herokuapp.com";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  FALLBACK_API_URL;
