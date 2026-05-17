function getApiBase() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  return "";
}

/**
 * Loads today's puzzle from the Next.js API (backed by lib/reddit).
 */
export async function fetchDailyDataFromApi() {
  const response = await fetch(`${getApiBase()}/api/daily`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error ?? `Failed to load daily puzzle (${response.status})`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Daily puzzle response was empty");
  }

  return data;
}
