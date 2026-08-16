import { db } from './firebase';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { appStorage } from './storage';

export interface StreakInfo {
  currentStreak: number;
  todaySeconds: number;
  todayTargetSeconds: number; // 300 (5 minutes)
  isTodayCompleted: boolean;
  todayProgressPercent: number; // 0..100
  lastListeningDate?: string;
}

export const DAILY_TARGET_SECONDS = 300; // 5 minutes

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Records listening seconds for today in local storage and Firestore,
 * and returns updated StreakInfo.
 */
export async function recordListeningTime(userId: string, secondsToAdd: number = 1): Promise<StreakInfo> {
  const todayStr = getTodayDateString();
  const storageKey = `vox_daily_listening_${todayStr}`;

  // 1. Read existing today's seconds from local storage
  let currentTodaySeconds = 0;
  try {
    const cached = appStorage.getItemSync(storageKey);
    if (cached) {
      currentTodaySeconds = parseInt(cached, 10) || 0;
    }
  } catch (e) {}

  const newTodaySeconds = currentTodaySeconds + secondsToAdd;
  appStorage.setItem(storageKey, newTodaySeconds.toString());

  // Also accumulate total listened stats
  try {
    const statsStr = appStorage.getItemSync('vox_user_stats');
    const stats = statsStr ? JSON.parse(statsStr) : { totalListenedSeconds: 0 };
    stats.totalListenedSeconds = (stats.totalListenedSeconds || 0) + secondsToAdd;
    appStorage.setItem('vox_user_stats', JSON.stringify(stats));
  } catch (e) {}

  // 2. Persist to Firestore asynchronously
  if (userId) {
    try {
      const logRef = doc(db, 'listening_logs', `${userId}_${todayStr}`);
      setDoc(
        logRef,
        {
          userId,
          date: todayStr,
          seconds: newTodaySeconds,
          targetMet: newTodaySeconds >= DAILY_TARGET_SECONDS,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch(err => console.warn('Firestore listening_log async write notice:', err));
    } catch (e) {}
  }

  return calculateUserStreak(userId);
}

/**
 * Calculates user's streak and today's target completion based on Firestore + Local Cache
 */
export async function calculateUserStreak(userId: string): Promise<StreakInfo> {
  const todayStr = getTodayDateString();
  const yesterdayStr = getPastDateString(1);

  const logsMap: Record<string, number> = {};

  // 1. Read local storage cache for last 60 days
  for (let i = 0; i < 60; i++) {
    const dStr = getPastDateString(i);
    const key = `vox_daily_listening_${dStr}`;
    try {
      const val = appStorage.getItemSync(key);
      if (val) {
        logsMap[dStr] = parseInt(val, 10) || 0;
      }
    } catch (e) {}
  }

  // 2. Query Firestore listening_logs for userId
  if (userId) {
    try {
      const q = query(collection(db, 'listening_logs'), where('userId', '==', userId));
      const snap = await getDocs(q);
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.date && typeof data.seconds === 'number') {
          logsMap[data.date] = Math.max(logsMap[data.date] || 0, data.seconds);
        }
      });
    } catch (e) {
      console.warn('Firestore listening_logs fetch offline fallback:', e);
    }
  }

  const todaySeconds = logsMap[todayStr] || 0;
  const isTodayCompleted = todaySeconds >= DAILY_TARGET_SECONDS;
  const todayProgressPercent = Math.min(100, Math.round((todaySeconds / DAILY_TARGET_SECONDS) * 100));

  // 3. Compute consecutive days streak
  let currentStreak = 0;

  // If today is completed, check starting from today (i = 0)
  // If today is NOT completed, check starting from yesterday (i = 1) to preserve active streak
  const startDaysAgo = isTodayCompleted ? 0 : 1;

  for (let i = startDaysAgo; i < 365; i++) {
    const dateCheck = getPastDateString(i);
    const sec = logsMap[dateCheck] || 0;
    if (sec >= DAILY_TARGET_SECONDS) {
      currentStreak++;
    } else {
      break;
    }
  }

  const activeStreak = isTodayCompleted
    ? currentStreak
    : (logsMap[yesterdayStr] >= DAILY_TARGET_SECONDS ? currentStreak : 0);

  return {
    currentStreak: activeStreak,
    todaySeconds,
    todayTargetSeconds: DAILY_TARGET_SECONDS,
    isTodayCompleted,
    todayProgressPercent,
    lastListeningDate: isTodayCompleted ? todayStr : (logsMap[yesterdayStr] >= DAILY_TARGET_SECONDS ? yesterdayStr : undefined)
  };
}
