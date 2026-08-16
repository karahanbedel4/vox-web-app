/**
 * Web Platform Storage Service using localStorage & document.cookie.
 */
export function isCapacitorNative(): boolean {
  return false;
}

export function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {}
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|; )' + encodeURIComponent(name) + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (e) {
    return null;
  }
}

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
    return getCookie(key);
  },

  getItemSync(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
    return getCookie(key);
  },

  setItemSync(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    }
    setCookie(key, value);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    }
    setCookie(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
    setCookie(key, '', -1);
  },

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.clear();
      } catch (e) {}
    }
  }
};

