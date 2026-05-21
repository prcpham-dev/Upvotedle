/**
 * In the Devvit webview, all API calls hit the local Hono server.
 * Always return an empty string so fetch('/api/...') works.
 */
export declare function getApiBase(): string;
