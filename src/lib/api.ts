/**
 * Hardcoded API Base URL for live Render backend (https://vox-ai-repo.onrender.com)
 * All API requests point directly to https://vox-ai-repo.onrender.com
 */
export const LIVE_BACKEND_URL = 'https://vox-ai-repo.onrender.com';

export const isNativeCapacitor = (): boolean => false;

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${LIVE_BACKEND_URL}${cleanEndpoint}`;
};

export async function safeApiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const primaryUrl = getApiUrl(cleanEndpoint);
  
  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok) return res;
    
    // Fallback attempt if response is not ok
    return res;
  } catch (err) {
    // If primary failed, attempt direct relative or retry
    try {
      return await fetch(primaryUrl, options);
    } catch {
      throw err;
    }
  }
}
