export const triggerHapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const durationMap = { light: 10, medium: 25, heavy: 50 };
    try {
      navigator.vibrate(durationMap[style]);
    } catch {
      // ignore fallback errors
    }
  }
};

export const triggerHapticNotification = async (type: 'success' | 'warning' | 'error' = 'success') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const patternMap = {
      success: [15, 30, 15],
      warning: [30, 50, 30],
      error: [50, 100, 50, 100],
    };
    try {
      navigator.vibrate(patternMap[type]);
    } catch {
      // ignore fallback errors
    }
  }
};
