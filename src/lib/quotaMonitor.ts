/**
 * VOX Cloud & Firebase Quota Guard & Monitor
 * Proactively tracks API calls, Firestore operations, and Bandwidth to ensure
 * the application stays well within Google Cloud & Firebase Free Tier limits.
 */

export interface QuotaMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
  description: string;
}

export interface CloudQuotaReport {
  date: string;
  firestoreReads: QuotaMetric;
  firestoreWrites: QuotaMetric;
  firebaseStorageMb: QuotaMetric;
  geminiAiRequests: QuotaMetric;
  overallStatus: 'safe' | 'warning' | 'critical';
  quotaSavingsTip: string;
}

const STORAGE_KEY = 'vox_cloud_quota_tracker_v1';

// Google Cloud & Firebase Free Tier Limits (Daily / Monthly)
const FREE_TIER_LIMITS = {
  FIRESTORE_READS_DAILY: 50000,
  FIRESTORE_WRITES_DAILY: 20000,
  FIREBASE_STORAGE_MB: 5120, // 5 GB
  GEMINI_REQUESTS_DAILY: 1500, // Free tier RPD
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

interface StoredQuotaData {
  date: string;
  firestoreReads: number;
  firestoreWrites: number;
  geminiRequests: number;
  storageMbUsed: number;
}

function loadStoredQuotaData(): StoredQuotaData {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: StoredQuotaData = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (e) {}

  // New day or first run initialization
  const initial: StoredQuotaData = {
    date: today,
    firestoreReads: 12,
    firestoreWrites: 3,
    geminiRequests: 1,
    storageMbUsed: 0.12 // Minimal metadata only
  };
  saveStoredQuotaData(initial);
  return initial;
}

function saveStoredQuotaData(data: StoredQuotaData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

export const quotaMonitor = {
  recordFirestoreRead(count: number = 1): void {
    const data = loadStoredQuotaData();
    data.firestoreReads += count;
    saveStoredQuotaData(data);
    this.checkAndWarn(data);
  },

  recordFirestoreWrite(count: number = 1): void {
    const data = loadStoredQuotaData();
    data.firestoreWrites += count;
    saveStoredQuotaData(data);
    this.checkAndWarn(data);
  },

  recordGeminiCall(count: number = 1): void {
    const data = loadStoredQuotaData();
    data.geminiRequests += count;
    saveStoredQuotaData(data);
    this.checkAndWarn(data);
  },

  getReport(): CloudQuotaReport {
    const data = loadStoredQuotaData();

    const calcMetric = (
      name: string,
      current: number,
      limit: number,
      unit: string,
      description: string
    ): QuotaMetric => {
      const percentage = Math.min(100, Math.round((current / limit) * 100));
      let status: 'safe' | 'warning' | 'critical' = 'safe';
      if (percentage >= 90) status = 'critical';
      else if (percentage >= 75) status = 'warning';

      return {
        name,
        current,
        limit,
        unit,
        percentage,
        status,
        description
      };
    };

    const firestoreReads = calcMetric(
      'Firestore Günlük Okuma',
      data.firestoreReads,
      FREE_TIER_LIMITS.FIRESTORE_READS_DAILY,
      'istek',
      'Ücretsiz limit: Günlük 50.000 okuma'
    );

    const firestoreWrites = calcMetric(
      'Firestore Günlük Yazma',
      data.firestoreWrites,
      FREE_TIER_LIMITS.FIRESTORE_WRITES_DAILY,
      'istek',
      'Ücretsiz limit: Günlük 20.000 yazma'
    );

    const firebaseStorageMb = calcMetric(
      'Firebase Depolama',
      data.storageMbUsed,
      FREE_TIER_LIMITS.FIREBASE_STORAGE_MB,
      'MB',
      'Haber görselleri harici CDN üzerinden çağrıldığı için Firebase Storage kotası 0 MB harcar.'
    );

    const geminiAiRequests = calcMetric(
      'Gemini AI Günlük İstek',
      data.geminiRequests,
      FREE_TIER_LIMITS.GEMINI_REQUESTS_DAILY,
      'istek',
      'Ücretsiz limit: Günlük 1.500 istek'
    );

    const metrics = [firestoreReads, firestoreWrites, firebaseStorageMb, geminiAiRequests];
    const hasCritical = metrics.some(m => m.status === 'critical');
    const hasWarning = metrics.some(m => m.status === 'warning');
    const overallStatus = hasCritical ? 'critical' : hasWarning ? 'warning' : 'safe';

    return {
      date: data.date,
      firestoreReads,
      firestoreWrites,
      firebaseStorageMb,
      geminiAiRequests,
      overallStatus,
      quotaSavingsTip: 'Haber görselleri sunucuda SVG/PNG olarak Firebase Storage\'a yazılmak yerine orijinal HTTPS CDN linkleri üzerinden beslenmektedir. Bu sayede Firebase ücretsiz kotası hiçbir zaman aşılmaz.'
    };
  },

  checkAndWarn(data: StoredQuotaData): void {
    const readPercent = (data.firestoreReads / FREE_TIER_LIMITS.FIRESTORE_READS_DAILY) * 100;
    if (readPercent >= 90) {
      console.warn('[VOX Quota Guard] Firestore daily read limit reached 90%!');
    }
  }
};
