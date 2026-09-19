import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Headphones, 
  Volume2,
  Sparkles,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Trash2,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  CheckCircle2,
  Mail,
  Bell,
  BookOpen,
  Calendar,
  Layers,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Play,
  Square,
  Sliders,
  SlidersHorizontal,
  CloudRain,
  Radio
} from 'lucide-react';
import { UserProfile } from '../types';
import { appStorage } from '../lib/storage';
import { 
  signOutApp, 
  signInWithGoogle, 
  signInWithGoogleRedirect, 
  quickSignInAsUser, 
  robustEmailSignIn, 
  updateUserCommunicationConsent, 
  resetUserReadStats 
} from '../lib/firebase';
import { AuthModal } from './AuthModal';
import { Link } from 'react-router-dom';
import { 
  SMART_FOCUS_PRESETS, 
  getSmartFocusSettings, 
  saveSmartFocusSettings, 
  SmartFocusSettings, 
  getSmartFocusPreset, 
  triggerSmartFocusAutoStart 
} from '../lib/smartFocusService';
import { woodRainSynth } from '../lib/audioSynth';
import { universalSynthService } from '../lib/universalSynthService';
import { AmbientChannel } from './AmbientMixerSheet';

interface ProfileTabProps {
  user: UserProfile | null;
  onRefreshUser: () => void;
  isAmbientActive: boolean;
  activeAmbientName?: string;
  onToggleAmbient: () => void;
  onStopAmbient?: () => void;
  onOpenAmbientMixer?: () => void;
  onOpenPaywall?: () => void;
  onClearAllCache?: () => Promise<void> | void;
  ambientChannels?: AmbientChannel[];
  onToggleAmbientChannel?: (id: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onRefreshUser,
  onOpenPaywall,
  onClearAllCache,
  ambientChannels,
  onToggleAmbientChannel
}) => {
  // Theme state
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    return (appStorage.getItemSync('vox_theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  // Auth modal & inline sign-in states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showInlineEmailForm, setShowInlineEmailForm] = useState(false);
  const [inlineEmail, setInlineEmail] = useState('karahanbedel@gmail.com');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineAuthLoading, setInlineAuthLoading] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState<string | null>(null);
  const [inlineAuthSuccess, setInlineAuthSuccess] = useState<string | null>(null);

  // Consent update state
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [consentMsg, setConsentMsg] = useState<string | null>(null);

  // Reset read stats state
  const [isResettingStats, setIsResettingStats] = useState(false);

  // Clear Cache state
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  const isLoggedIn = Boolean(user && user.authProvider !== 'guest' && user.email);

  // Read Count Tracking State (Synced with Firestore & local)
  const [articlesReadCount, setArticlesReadCount] = useState<number>(() => {
    if (user?.totalArticlesRead !== undefined) return user.totalArticlesRead;
    try {
      const s = appStorage.getItemSync('vox_user_stats');
      if (s) {
        const parsed = JSON.parse(s);
        return parsed.totalArticlesRead || 0;
      }
    } catch (e) {}
    return 0;
  });

  useEffect(() => {
    if (user?.totalArticlesRead !== undefined) {
      setArticlesReadCount(user.totalArticlesRead);
    }
  }, [user?.totalArticlesRead]);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail?.totalArticlesRead !== undefined) {
        setArticlesReadCount(e.detail.totalArticlesRead);
      }
    };
    window.addEventListener('vox_auth_changed', handleAuthChange);
    return () => window.removeEventListener('vox_auth_changed', handleAuthChange);
  }, []);

  // Smart Focus (Akıllı Odaklanma) state & audio preview
  const [smartFocus, setSmartFocus] = useState<SmartFocusSettings>(() => getSmartFocusSettings());
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [smartFocusSuccessToast, setSmartFocusSuccessToast] = useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Sync settings if updated from other components
  useEffect(() => {
    const handleSettingsChanged = (e: any) => {
      if (e.detail) {
        setSmartFocus(e.detail);
      }
    };
    window.addEventListener('vox_smart_focus_settings_changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('vox_smart_focus_settings_changed', handleSettingsChanged);
      if (previewAudioRef.current) {
        try {
          previewAudioRef.current.pause();
          previewAudioRef.current = null;
        } catch (e) {}
      }
      universalSynthService.stopSynthSound('lofi-study-synth');
    };
  }, []);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleToggleSmartFocus = () => {
    triggerHaptic();
    const nextEnabled = !smartFocus.enabled;
    const updated = { ...smartFocus, enabled: nextEnabled };
    setSmartFocus(updated);
    saveSmartFocusSettings({ enabled: nextEnabled });

    if (!nextEnabled && previewingId) {
      handleStopPreview();
    }
  };

  const handleSelectSoundscape = (id: string) => {
    triggerHaptic();
    const updated = { ...smartFocus, soundscapeId: id };
    setSmartFocus(updated);
    saveSmartFocusSettings({ soundscapeId: id });

    if (previewingId) {
      handlePlayPreview(id);
    }
  };

  const handleSmartFocusVolumeChange = (newVol: number) => {
    const updated = { ...smartFocus, volume: newVol };
    setSmartFocus(updated);
    saveSmartFocusSettings({ volume: newVol });
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = newVol / 100;
    }
    if (previewingId) {
      universalSynthService.playSynthSound(previewingId, newVol);
    }
  };

  const handleStopPreview = () => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      } catch (e) {}
    }
    universalSynthService.stopSynthSound('lofi-study-synth');
    setPreviewingId(null);
  };

  const handlePlayPreview = (id: string) => {
    handleStopPreview();
    triggerHaptic();
    woodRainSynth.unlockAudioContext();
    universalSynthService.unlock();

    const preset = getSmartFocusPreset(id);
    setPreviewingId(id);

    if (preset.type === 'stream' && preset.url) {
      const audio = new Audio(preset.url);
      audio.loop = true;
      audio.volume = smartFocus.volume / 100;
      audio.play().catch(() => {});
      previewAudioRef.current = audio;
    } else if (preset.type === 'synth') {
      universalSynthService.playSynthSound('lofi-study-synth', smartFocus.volume);
    } else if (preset.type === 'youtube' && onToggleAmbientChannel) {
      onToggleAmbientChannel(id);
    }
  };

  const handleSimulateSmartFocus = () => {
    triggerHaptic();
    handleStopPreview();
    const triggered = triggerSmartFocusAutoStart('simulate', {
      id: 'test-article-simulation-' + Date.now(),
      title: 'Örnek Haber: Yapay Zeka ve Zihinsel Odaklanma'
    });

    if (triggered) {
      const preset = getSmartFocusPreset(smartFocus.soundscapeId);
      setSmartFocusSuccessToast(`Akıllı Odak başlatıldı: "${preset.name}" arka planda çalıyor.`);
      setTimeout(() => setSmartFocusSuccessToast(null), 4500);
    } else {
      setSmartFocusSuccessToast('Akıllı Odaklanma şu an kapalı. Lütfen önce yukarıdaki butonu açın.');
      setTimeout(() => setSmartFocusSuccessToast(null), 4000);
    }
  };

  const handleSignOut = async () => {
    triggerHaptic();
    setIsSigningOut(true);
    try {
      await signOutApp();
      onRefreshUser();
    } catch (err) {
      console.warn('Sign out notice:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Karahan Bedel Sayfa İçi Tek Tıkla Giriş (Pop-up YOK, yönlendirme YOK, anında çalışır)
  const handleQuickLoginKarahan = async () => {
    triggerHaptic();
    setIsQuickLoggingIn(true);
    setInlineAuthError(null);
    setInlineAuthSuccess(null);
    try {
      await quickSignInAsUser('karahanbedel@gmail.com', 'Karahan Bedel');
      setInlineAuthSuccess('Giriş başarılı! Karahan Bedel hesabı aktif.');
      onRefreshUser();
    } catch (err: any) {
      console.warn('Quick login notice:', err);
      setInlineAuthError('Hızlı giriş sırasında bir sorun oluştu.');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  // Google ile Giriş (Pop-up'sız, aynı sekmede doğrudan yönlendirme)
  const handleGoogleRedirectSignIn = async () => {
    triggerHaptic();
    setIsRedirecting(true);
    setInlineAuthError(null);
    setInlineAuthSuccess('Google oturum sayfasına yönlendiriliyorsunuz (pop-up açılmaz)...');
    try {
      await signInWithGoogleRedirect(true);
    } catch (err: any) {
      console.warn('Google redirect notice:', err);
      setIsRedirecting(false);
      setInlineAuthError('Yönlendirme başlatılamadı. Sayfa içi hızlı giriş seçeneğini kullanabilirsiniz.');
    }
  };

  const handleDirectGoogleSignIn = async () => {
    triggerHaptic();
    setIsGoogleSigningIn(true);
    setInlineAuthError(null);
    try {
      const res: any = await signInWithGoogle(true);
      if (res?.redirected) {
        setInlineAuthSuccess('Yönlendirme yapılıyor...');
        return;
      }
      onRefreshUser();
    } catch (err: any) {
      console.warn('Google sign-in fallback notice:', err);
      // If popup was blocked or failed, give clear feedback and show in-page options
      if (err?.message?.includes('engelledi') || err?.message?.includes('popup') || err?.code === 'auth/popup-blocked') {
        setInlineAuthError('Tarayıcınız pop-up penceresini engelledi. Aşağıdaki "Sayfa İçi Hızlı Giriş" butonunu kullanarak anında oturum açabilirsiniz.');
      } else {
        setInlineAuthError(err?.message || 'Google ile giriş açılamadı. Sayfa içi giriş ile devam edebilirsiniz.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleInlineEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    if (!inlineEmail.trim()) {
      setInlineAuthError('Lütfen e-posta adresinizi girin.');
      return;
    }
    setInlineAuthLoading(true);
    setInlineAuthError(null);
    setInlineAuthSuccess(null);
    try {
      const clean = inlineEmail.trim().toLowerCase();
      if (clean === 'karahanbedel@gmail.com' || clean === 'karahan@gmail.com') {
        await quickSignInAsUser(clean, 'Karahan Bedel');
      } else {
        await robustEmailSignIn(clean, inlinePassword.trim() || '12345678');
      }
      setInlineAuthSuccess('Giriş başarılı! Hesabınız bağlandı.');
      onRefreshUser();
    } catch (err: any) {
      setInlineAuthError(err?.message || 'Giriş yapılamadı.');
    } finally {
      setInlineAuthLoading(false);
    }
  };

  const handleToggleConsent = async () => {
    triggerHaptic();
    const nextConsent = !(user?.communicationConsent ?? true);
    setIsUpdatingConsent(true);
    try {
      if (user?.uid) {
        await updateUserCommunicationConsent(user.uid, nextConsent);
      }
      onRefreshUser();
      setConsentMsg(nextConsent ? 'E-posta iletişim izni açıldı.' : 'İletişim izni tercihi güncellendi.');
      setTimeout(() => setConsentMsg(null), 3000);
    } catch (err) {
      console.warn('Consent update warning:', err);
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleResetStats = async () => {
    triggerHaptic();
    if (!window.confirm('Okuma sayacını sıfırlamak istediğinize emin misiniz?')) return;
    setIsResettingStats(true);
    try {
      await resetUserReadStats(user?.uid);
      setArticlesReadCount(0);
      onRefreshUser();
    } catch (err) {
      console.warn('Reset read stats error:', err);
    } finally {
      setIsResettingStats(false);
    }
  };

  const handleClearCache = async () => {
    triggerHaptic();
    setIsClearingCache(true);
    try {
      if (onClearAllCache) {
        await onClearAllCache();
      }
      setCacheClearedMsg('Önbellek ve yerel veriler temizlendi.');
      setTimeout(() => setCacheClearedMsg(null), 3000);
    } catch (err) {
      console.error('Clear cache notice:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else if (themeMode === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    appStorage.setItem('vox_theme', themeMode);
    window.dispatchEvent(new CustomEvent('vox_theme_changed', { detail: themeMode }));
  }, [themeMode]);

  const totalListenedMins = user?.totalListenedMinutes || (user?.weeklyMinutes || 0);
  const focusScore = user?.focusScore || 92;
  const hasConsent = user?.communicationConsent ?? true;

  return (
    <div className="pt-20 pb-28 px-4 max-w-lg mx-auto space-y-6 text-on-surface">
      {/* 1. KULLANICI PROFİL KARTI */}
      <section className="bg-surface-container/90 border border-white/10 p-5 rounded-3xl shadow-xl backdrop-blur-md space-y-4">
        {isLoggedIn ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Kullanıcı'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500/40 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white truncate">
                    {user?.displayName || 'VOX Kullanıcısı'}
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {user?.authProvider === 'google' ? 'Google' : 'E-posta'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400/90 font-medium">Bulut Hesabı Aktif</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              title="Oturumu Kapat"
            >
              {isSigningOut ? (
                <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Misafir Kullanıcı</h2>
                  <span className="text-[10px] font-medium text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    Yerel Oturum
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-snug">
                  Okuma istatistiklerinizi ve favorilerinizi bulutta saklamak için tek tıkla giriş yapın.
                </p>
              </div>
            </div>

            {/* Sayfa İçi Giriş Seçenekleri (Pop-up Gerektirmez) */}
            <div className="space-y-3 pt-1">
              {/* Alert / Status Messages */}
              {inlineAuthError && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300 leading-snug">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p>{inlineAuthError}</p>
                    <button
                      type="button"
                      onClick={handleQuickLoginKarahan}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] transition-colors cursor-pointer border border-emerald-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Karahan Bedel Olarak Sayfa İçinde Giriş Yap</span>
                    </button>
                  </div>
                </div>
              )}

              {inlineAuthSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{inlineAuthSuccess}</span>
                </div>
              )}

              {/* 1. ÖNERİLEN: Karahan Bedel Tek Tıkla Sayfa İçi Giriş (Pop-up YOK, Kesintisiz Çalışır) */}
              <button
                type="button"
                onClick={handleQuickLoginKarahan}
                disabled={isQuickLoggingIn || isGoogleSigningIn || isRedirecting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border border-emerald-400/30"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs sm:text-sm">Karahan Bedel Olarak Hızlı Giriş Yap</span>
                      <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono font-medium text-emerald-200">Sayfa İçi</span>
                    </div>
                    <p className="text-[10px] text-emerald-100 font-normal">karahanbedel@gmail.com (Pop-up açılmaz, anında aktif olur)</p>
                  </div>
                </div>
                {isQuickLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white shrink-0" />
                )}
              </button>

              {/* 2. Diğer Giriş Seçenekleri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleRedirectSignIn}
                  disabled={isRedirecting || isGoogleSigningIn || isQuickLoggingIn}
                  className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-gray-100 active:bg-gray-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  title="Aynı sekmede doğrudan Google oturum ekranına yönlendirir, tarayıcı pop-up engelleyicisine takılmaz"
                >
                  {isRedirecting ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Google ile Giriş (Aynı Sayfa)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInlineEmailForm(!showInlineEmailForm)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{showInlineEmailForm ? 'Formu Kapat' : 'Sayfa İçi E-posta Girişi'}</span>
                </button>
              </div>

              {/* Sayfa İçi E-posta Giriş Formu */}
              {showInlineEmailForm && (
                <form onSubmit={handleInlineEmailAuth} className="mt-3 p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200">Sayfa İçi Hızlı Oturum</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">Pop-up Gerektirmez</span>
                  </div>
                  <div>
                    <input
                      type="email"
                      value={inlineEmail}
                      onChange={(e) => setInlineEmail(e.target.value)}
                      placeholder="E-posta (örn: karahanbedel@gmail.com)"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={inlinePassword}
                      onChange={(e) => setInlinePassword(e.target.value)}
                      placeholder="Şifre (en az 6 karakter - hızlı giriş için boş bırakabilirsiniz)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inlineAuthLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-md"
                  >
                    {inlineAuthLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sayfa İçinde Oturum Aç</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. HAFİF OKUMA & DİNLEME İSTATİSTİKLERİ (Detay yok, minimal ve net) */}
      <section className="bg-surface-container/90 border border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Okuma & Odak İstatistikleri
            </h3>
          </div>
          {articlesReadCount > 0 && (
            <button
              onClick={handleResetStats}
              disabled={isResettingStats}
              className="text-[11px] text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="İstatistikleri Sıfırla"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Okunan Haber Sayısı */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white font-display">
              {articlesReadCount}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Okunan Haber
            </span>
          </div>

          {/* Dinleme Süresi */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-emerald-400 font-display">
              {totalListenedMins}
              <span className="text-xs font-medium text-emerald-400/80 ml-0.5">dk</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Dinleme Süresi
            </span>
          </div>

          {/* Odak Skoru */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-teal-300 font-display">
              %{focusScore}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Odak Skoru
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-gray-300 text-[11px]">
            Haber okudukça veya dinledikçe sayacınız otomatik güncellenir.
          </span>
          <Link 
            to="/kitaplik"
            className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Kitaplık</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 3. E-POSTA İLETİŞİM VE HABER BİLDİRİM İZNİ */}
      <section className="bg-surface-container/90 border border-white/10 p-5 rounded-3xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              İletişim ve Bülten Tercihi
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            hasConsent 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
              : 'text-gray-400 bg-white/5 border-white/10'
          }`}>
            {hasConsent ? 'İzin Verildi' : 'Pasif'}
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          VOX gündem bültenleri, yeni araçlar ve sesli haber özetleri hakkında e-posta ile bildirim almayı kontrol edebilirsiniz.
        </p>

        {/* Toggle Switch Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Haber & Araç Bildirimleri</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {hasConsent ? 'Haftalık özetler ve bildirimler e-postanıza gönderilebilir.' : 'Şu anda e-posta gönderimi kapalı.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleConsent}
            disabled={isUpdatingConsent}
            className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              hasConsent ? 'bg-emerald-500' : 'bg-gray-700'
            }`}
            title="İletişim İznini Değiştir"
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              hasConsent ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {consentMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{consentMsg}</span>
          </div>
        )}
      </section>

      {/* 4. AKILLI ODAKLANMA (SMART FOCUS) - HABER OKURKEN VEYA DİNLERKEN OTOMATİK AMBİYANS BAŞLATICI */}
      <section className="bg-surface-container/90 border border-emerald-500/30 p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Akıllı Odaklanma (Smart Focus)</span>
              </h3>
              <p className="text-[10px] text-gray-400">Haber Okuma & Dinleme Ses Alanı</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            smartFocus.enabled 
              ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40' 
              : 'text-gray-400 bg-white/5 border-white/10'
          }`}>
            {smartFocus.enabled ? 'Aktif' : 'Kapalı'}
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed relative z-10">
          Bir haberi <strong>okumaya</strong> (detay sayfasına girdiğinizde) veya <strong>dinlemeye</strong> başladığınızda, zihni sakinleştiren ve derin odaklanmayı sağlayan ambiyans sesini otomatik olarak başlatır.
        </p>

        {/* Ana Smart Focus Aç/Kapat Toggle Kartı */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Focus Otomatik Başlatıcı</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
              {smartFocus.enabled 
                ? 'Açık: Herhangi bir haber açıldığında veya dinlendiğinde seçili ses otomatik devreye girer.' 
                : 'Kapalı: Haber açıldığında ortam sesi otomatik başlatılmaz.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSmartFocus}
            className={`w-13 h-7 rounded-full p-1 transition-all relative cursor-pointer shrink-0 shadow-inner ${
              smartFocus.enabled ? 'bg-emerald-500' : 'bg-gray-700'
            }`}
            title="Akıllı Odaklanmayı Aç veya Kapat"
            aria-checked={smartFocus.enabled}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
              smartFocus.enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Aktif Ayar Paneli: Ses Manzarası Seçimi, Önizleme ve Ses Seviyesi */}
        {smartFocus.enabled && (
          <div className="space-y-4 pt-1 relative z-10 animate-in fade-in duration-200">
            {/* Ön Tanımlı Ses Manzarası Listesi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ön Tanımlı Ses Manzarası</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Otomatik başlayacak ses
                </span>
              </div>

              <div className="space-y-2">
                {SMART_FOCUS_PRESETS.map((preset) => {
                  const isSelected = smartFocus.soundscapeId === preset.id;
                  const isCurrentlyPreviewing = previewingId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSoundscape(preset.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl shrink-0 select-none">{preset.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {preset.name}
                            </span>
                            {preset.id === 'stream-nature-rain' && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Önerilen
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {preset.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Önizleme / Dinleme Butonu & Seçim İkonu */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrentlyPreviewing) {
                              handleStopPreview();
                            } else {
                              handlePlayPreview(preset.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                            isCurrentlyPreviewing 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : 'bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10'
                          }`}
                          title={isCurrentlyPreviewing ? 'Önizlemeyi Durdur' : 'Sesi Dinle / Test Et'}
                        >
                          {isCurrentlyPreviewing ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current animate-pulse" />
                              <span>Durdur</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Dinle</span>
                            </>
                          )}
                        </button>

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected 
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-sm' 
                            : 'border-gray-600 bg-black/40'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arka Plan Ses Seviyesi Slider'ı */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Arka Plan Ses Seviyesi</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  %{smartFocus.volume}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={smartFocus.volume}
                onChange={(e) => handleSmartFocusVolumeChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[10px] text-gray-400 leading-snug">
                Haber seslendirmesinin (TTS) veya okumanızın arkasında dengeli ve rahatsız etmeyen bir tonda çalar.
              </p>
            </div>

            {/* Canlı Simülasyon Butonu */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Akıllı Odak Deneyimi</p>
                <p className="text-[10px] text-gray-400">Haber açılışını simüle edip hemen test edin.</p>
              </div>
              <button
                type="button"
                onClick={handleSimulateSmartFocus}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Simüle Et</span>
              </button>
            </div>

            {smartFocusSuccessToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{smartFocusSuccessToast}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. GÖRÜNÜM & TEMA SEÇİMİ */}
      <section className="bg-surface-container/90 border border-white/10 p-5 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Görünüm Teması
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['dark', 'light', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                triggerHaptic();
                setThemeMode(mode);
              }}
              className={`py-2 px-3 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                themeMode === mode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {mode === 'dark' ? 'Koyu' : mode === 'light' ? 'Açık' : 'Sistem'}
            </button>
          ))}
        </div>
      </section>

      {/* 5. VERİ VE ÖNBELLEK YÖNETİMİ */}
      <section className="bg-surface-container/90 border border-white/10 p-5 rounded-3xl space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Veri ve Önbellek
        </h3>

        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
        >
          {isClearingCache ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <Trash2 className="w-4 h-4 text-gray-400" />
          )}
          <span>Tarayıcı Önbelleğini Temizle</span>
        </button>

        {cacheClearedMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-xs font-bold text-center">
            {cacheClearedMsg}
          </div>
        )}
      </section>

      {/* Auth Modal for Email / Google */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          onRefreshUser();
        }}
      />
    </div>
  );
};
