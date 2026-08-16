/**
 * Web Platform Storage Service using localStorage.
 */
export function isCapacitorNative(): boolean {
  return false;
}

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },

  getItemSync(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },

  setItemSync(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    }
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
  },

  async clear(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.clear();
      } catch (e) {}
    }
  }
};
