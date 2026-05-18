/**
 * Helper to determine the API base URL depending on the environment.
 * - Localhost: relative path "" (relying on Vite or Next.js dev proxies)
 * - Deployed (e.g. GitHub Pages): "https://redditdle.vercel.app"
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "";
    }
  }
  return "https://redditdle.vercel.app";
}
