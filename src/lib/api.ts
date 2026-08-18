/**
 * Unified API Routing for VOX Application
 * Uses same-origin relative URLs for all API requests to ensure maximum
 * security, zero CORS issues, and seamless operation through corporate firewalls/proxies.
 */
export const LIVE_BACKEND_URL = '';

export const isNativeCapacitor = (): boolean => false;

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return cleanEndpoint;
};

export async function safeApiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  try {
    const res = await fetch(cleanEndpoint, options);
    return res;
  } catch (err) {
    console.warn(`API fetch error for ${cleanEndpoint}:`, err);
    throw err;
  }
}

