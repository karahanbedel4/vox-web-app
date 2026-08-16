import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { db, incrementUserQuota } from '../lib/firebase';
import { safeApiFetch } from '../lib/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { appStorage } from '../lib/storage';

export interface UseSubscriptionResult {
  isPremium: boolean;
  subscriptionTier: 'free' | 'premium_monthly' | 'premium_yearly' | 'premium_lifetime';
  subscriptionEndsAt: string | null;
  dailyQuotaUsed: number;
  dailyQuotaLimit: number;
  isQuotaExceeded: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isPaywallOpen: boolean;
  setIsPaywallOpen: (open: boolean) => void;
  paywallReason: 'limit_reached' | 'pages_exceeded' | 'not_logged_in';
  setPaywallReason: (reason: 'limit_reached' | 'pages_exceeded' | 'not_logged_in') => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  purchasePackage: (tier: 'monthly' | 'yearly' | 'lifetime') => Promise<{ success: boolean; message: string }>;
  restorePurchases: () => Promise<{ success: boolean; message: string }>;
  openNativePaywall: () => Promise<boolean>;
  openCustomerCenter: () => Promise<boolean>;
  incrementQuota: () => Promise<boolean>;
  resetQuota: () => void;
}

const FREE_DAILY_QUOTA_LIMIT = 1; // 1 daily operation allowed on Web
const GUEST_QUOTA_LIMIT = 0; // Guests must log in for operations

export function useSubscription(user: UserProfile | null): UseSubscriptionResult {
  const isGuest = !user || user.authProvider === 'guest';
  const [isPremium, setIsPremium] = useState<boolean>(user?.isPremium ?? false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'premium_monthly' | 'premium_yearly' | 'premium_lifetime'>(
    (user?.subscriptionTier as any) || 'free'
  );
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(
    user?.subscriptionEndsAt || null
  );
  const [dailyQuotaUsed, setDailyQuotaUsed] = useState<number>(user?.dailyQuotaUsed || 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<'limit_reached' | 'pages_exceeded' | 'not_logged_in'>('limit_reached');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync with Firestore real-time doc if user is logged in
  useEffect(() => {
    if (!user?.uid) {
      appStorage.getItem('vox_subscription').then((localSub) => {
        if (localSub) {
          try {
            const parsed = JSON.parse(localSub);
            setIsPremium(parsed.isPremium);
            setSubscriptionTier(parsed.subscriptionTier || 'free');
            setSubscriptionEndsAt(parsed.subscriptionEndsAt || null);
          } catch (e) {}
        }
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'users', user.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (data.isPremium !== undefined) setIsPremium(!!data.isPremium);
        if (data.subscriptionTier) setSubscriptionTier(data.subscriptionTier as any);
        if (data.subscriptionEndsAt) setSubscriptionEndsAt(data.subscriptionEndsAt);

        if (data.lastQuotaResetDate !== today) {
          setDailyQuotaUsed(0);
        } else {
          setDailyQuotaUsed(data.dailyQuotaUsed || 0);
        }
      }
    }, (err) => {
      console.warn('Subscription snapshot listener fallback:', err);
    });

    return () => unsub();
  }, [user?.uid]);

  const dailyQuotaLimit = isPremium ? Infinity : (isGuest ? GUEST_QUOTA_LIMIT : FREE_DAILY_QUOTA_LIMIT);
  const isQuotaExceeded = !isPremium && dailyQuotaUsed >= dailyQuotaLimit;

  // Increment Quota when creating summary / PDF / TTS
  const incrementQuota = useCallback(async (): Promise<boolean> => {
    if (isPremium) return true;

    // Guest user limit check
    if (isGuest) {
      setIsAuthModalOpen(true);
      return false;
    }

    // Registered user limit check (Max 1 operation / day)
    if (dailyQuotaUsed >= FREE_DAILY_QUOTA_LIMIT) {
      setIsPaywallOpen(true);
      return false;
    }

    const nextQuota = dailyQuotaUsed + 1;
    setDailyQuotaUsed(nextQuota);

    const today = new Date().toISOString().split('T')[0];
    appStorage.setItem('vox_daily_quota', JSON.stringify({ count: nextQuota, date: today }));

    if (user?.uid) {
      try {
        await incrementUserQuota(user.uid);
      } catch (e) {
        console.warn('Quota sync warning:', e);
      }
    }

    return true;
  }, [dailyQuotaUsed, isPremium, isGuest, user?.uid]);

  const resetQuota = useCallback(() => {
    setDailyQuotaUsed(0);
    appStorage.removeItem('vox_daily_quota');
  }, []);

  const purchasePackage = useCallback(async (tier: 'monthly' | 'yearly' | 'lifetime'): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const response = await safeApiFetch('/api/subscription/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'guest_user',
          tier
        })
      });

      let data: any = null;
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      }
      if (data?.success) {
        setIsPremium(true);
        const subTier = tier === 'lifetime' ? 'premium_lifetime' : (tier === 'yearly' ? 'premium_yearly' : 'premium_monthly');
        setSubscriptionTier(subTier as any);
        setIsPaywallOpen(false);
        setIsLoading(false);
        return { success: true, message: 'Tebrikler! Vox Pro aboneliğiniz aktif edildi.' };
      } else {
        throw new Error(data?.error || 'Ödeme işlemi tamamlanamadı');
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Ödeme altyapısına bağlanırken bir hata oluştu.' };
    }
  }, [user?.uid]);

  const restorePurchases = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const res = await safeApiFetch(`/api/subscription/status?userId=${user?.uid || 'guest_user'}`);
      let data: any = null;
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      }
      if (data?.isPremium) {
        setIsPremium(true);
        setSubscriptionTier(data.subscriptionTier || 'premium_monthly');
        setIsPaywallOpen(false);
        setIsLoading(false);
        return { success: true, message: 'Vox Pro aboneliğiniz başarıyla doğrulandı.' };
      } else {
        setIsLoading(false);
        return { success: false, message: 'Aktif bir Vox Pro aboneliği bulunamadı.' };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, message: 'Satın alımlar geri yüklenirken hata oluştu.' };
    }
  }, [user?.uid]);

  const openNativePaywall = useCallback(async (): Promise<boolean> => {
    setIsPaywallOpen(true);
    return true;
  }, []);

  const openCustomerCenter = useCallback(async (): Promise<boolean> => {
    setIsPaywallOpen(true);
    return true;
  }, []);

  return {
    isPremium,
    subscriptionTier,
    subscriptionEndsAt,
    dailyQuotaUsed,
    dailyQuotaLimit,
    isQuotaExceeded,
    isGuest,
    isLoading,
    isPaywallOpen,
    setIsPaywallOpen,
    paywallReason,
    setPaywallReason,
    isAuthModalOpen,
    setIsAuthModalOpen,
    purchasePackage,
    restorePurchases,
    openNativePaywall,
    openCustomerCenter,
    incrementQuota,
    resetQuota
  };
}
