export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }
  return false;
};

export const scheduleDailyReminder = async (title: string, body: string): Promise<boolean> => {
  try {
    const hasPerm = await requestNotificationPermission();
    if (!hasPerm) return false;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
      return true;
    }
  } catch {
    // ignore
  }
  return false;
};
