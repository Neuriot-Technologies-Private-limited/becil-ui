/**
 * Central API base URL. Vite bakes this at build time from VITE_API_URL.
 *
 * - Dev: falls back to http://localhost:8000/api if unset
 * - Prod (Amplify): MUST set VITE_API_URL in Amplify Console → App settings →
 *   Environment variables before build, or requests will use relative/undefined URLs
 */
export function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL?.trim()?.replace(/\/$/, "");
  if (apiUrl) return apiUrl;
  if (import.meta.env.DEV) return "http://localhost:8000/api";

  console.error("[BECIL] VITE_API_URL is not set.");
  return "";
}
