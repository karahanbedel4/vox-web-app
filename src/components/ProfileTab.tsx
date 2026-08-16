import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  TrendingUp, 
  Headphones, 
  Timer, 
  User, 
  Sliders, 
  Bell, 
  Star, 
  LogOut, 
  CloudRain, 
  Volume2,
  Plus,
  Globe,
  Sparkles,
  Zap,
  Lock,
  X,
  Check,
  Moon,
  Sun,
  Trash2,
  Mail,
  UserCheck,
  Calendar,
  VolumeX,
  RefreshCw,
  BarChart2,
  Loader2,
  AlertCircle,
  Square
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { UserProfile } from '../types';
import { woodRainSynth } from '../lib/audioSynth';
import { auth, googleProvider, signInWithGoogle, signInAsGuest, robustEmailSignIn, robustEmailSignUp, signInAnonymously, syncUserProfile, signOutApp } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { appStorage } from '../lib/storage';

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
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onRefreshUser,
  isAmbientActive,
  activeAmbientName,
  onToggleAmbient,
  onStopAmbient,
  onOpenAmbientMixer,
  onOpenPaywall,
  onClearAllCache
}) => {
  // Settings States
  const [voiceEngine, setVoiceEngine] = useState<'gemini' | 'native'>('native');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    return (appStorage.getItemSync('vox_theme') as 'dark' | 'light' | 'system') || 'dark';
  });
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showEmailAuthModal, setShowEmailAuthModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // Email Auth Modal inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Clear Cache state
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  // Ambient synth sliders inside Profile
  const [rainVol, setRainVol] = useState(0.4);
  const [woodVol, setWoodVol] = useState(0.6);

  useEffect(() => {
    // Handle Escape key to close open modals in ProfileTab
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmailAuthModal(false);
        setShowPaywall(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      onRefreshUser();
    };
    window.addEventListener('vox_auth_changed', handleAuthChange);
    return () => window.removeEventListener('vox_auth_changed', handleAuthChange);
  }, [onRefreshUser]);

  useEffect(() => {
    // Handle Theme mode application
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else if (themeMode === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      // System mode check
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    appStorage.setItem('vox_theme', themeMode);
    window.dispatchEvent(new CustomEvent('vox_theme_changed', { detail: themeMode }));
  }, [themeMode]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      if (res.user) {
        await syncUserProfile(res.user);
      }
      onRefreshUser();
    } catch (err: any) {
      console.error('ProfileTab Google Sign In error:', err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setAuthError('Google ile giriş yapılırken bir sorun oluştu.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInAsGuest();
      onRefreshUser();
    } catch (err) {
      console.error('ProfileTab Guest Sign In error:', err);
      onRefreshUser();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent, isRegister: boolean) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegister) {
        await robustEmailSignUp(emailInput, passwordInput);
      } else {
        await robustEmailSignIn(emailInput, passwordInput);
      }
      setShowEmailAuthModal(false);
      onRefreshUser();
    } catch (err: unknown) {
      setAuthError((err as Error).message || 'Giriş yapılamadı.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutApp();
    onRefreshUser();
  };

  const handleDeleteAccount = async () => {
    triggerHaptic();
    setIsDeletingAccount(true);
    try {
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (e) {
          console.warn('Firebase user delete note:', e);
        }
      }
      appStorage.clear();
      await signOutApp();
      onRefreshUser();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleClearCacheAndData = async () => {
    triggerHaptic();
    setIsClearingCache(true);
    setCacheClearedMsg(null);
    try {
      if (onClearAllCache) {
        await onClearAllCache();
      } else {
        appStorage.removeItem('vox_articles');
        appStorage.removeItem('vox_offline_articles');
        appStorage.removeItem('vox_local_pdf_documents');
        appStorage.removeItem('vox_local_only_summaries');
        appStorage.removeItem('vox_favorite_categories');
        appStorage.removeItem('vox_user_stats');
        appStorage.removeItem('vox_user_bookmarks');
        appStorage.removeItem('vox_resume_position');
        appStorage.removeItem('vox_daily_quota');
        appStorage.removeItem('vox_youtube_access_token');
        onRefreshUser();
      }
      setCacheClearedMsg('Tüm önbellek, ses ve haber verileri başarıyla temizlendi.');
    } catch (err) {
      console.error('Clear cache error:', err);
      setCacheClearedMsg('Önbellek temizlenirken hata oluştu.');
    } finally {
      setIsClearingCache(false);
      setTimeout(() => setCacheClearedMsg(null), 4000);
    }
  };

  const weeklyHours = user ? ((user.weeklyMinutes || 0) / 60).toFixed(1) : '0.0';
  const articlesRead = user?.totalArticlesRead || 0;
  const focusScore = user?.focusScore || 0;

  // Recharts custom tooltip renderer for high readability & dark/light theme contrast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-high border border-primary/30 p-2.5 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-bold text-xs text-on-surface">{label}</p>
          <p className="text-[11px] font-semibold text-primary flex items-center gap-1 mt-0.5">
            <Timer className="w-3.5 h-3.5" />
            <span>{payload[0].value} Dakika Dinlendi</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // 7-day Weekly Minutes distribution data for Recharts Bar Chart
  const weeklyChartData = useMemo(() => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const totalMins = user?.weeklyMinutes || 0;
    const weights = [0.12, 0.18, 0.14, 0.22, 0.16, 0.10, 0.08];

    if (totalMins > 0) {
      return days.map((day, i) => ({
        day,
        dakika: Math.max(5, Math.round(totalMins * weights[i]))
      }));
    }

    // Baseline preview data when user has 0 minutes recorded yet
    return [
      { day: 'Pzt', dakika: 15 },
      { day: 'Sal', dakika: 25 },
      { day: 'Çar', dakika: 18 },
      { day: 'Per', dakika: 35 },
      { day: 'Cum', dakika: 28 },
      { day: 'Cmt', dakika: 42 },
      { day: 'Paz', dakika: 20 }
    ];
  }, [user?.weeklyMinutes]);

  const avgDailyMinutes = Math.round(
    weeklyChartData.reduce((acc, curr) => acc + curr.dakika, 0) / 7
  );

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-6 text-on-surface">
      {/* Profile Header Card */}
      <section className="bg-surface-container/80 border border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/50 p-0.5 shadow-[0_0_20px_rgba(78,222,163,0.3)] bg-surface-variant overflow-hidden">
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-1 shadow-md">
              <CheckCircle className="w-3 h-3 fill-current" />
            </div>
          </div>

          <div>
            <h1 className="font-display text-lg font-bold">
              {user?.displayName || 'Misafir Kullanıcı'}
            </h1>
            <p className="text-[11px] text-on-surface-variant">
              {user?.email || 'Giriş Yapılmadı'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase">
                {user?.authProvider === 'google' ? 'GOOGLE HESABI' : (user?.authProvider === 'email' ? 'E-POSTA ÜYESİ' : 'MİSAFİR KULLANICI')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {(!user || user?.authProvider === 'guest' || user?.email === 'misafir@vox.app') ? (
            <button
              onClick={() => handleGoogleSignIn()}
              className="bg-[#10b981] text-black font-extrabold text-xs px-3.5 py-2 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 active:scale-95 transition-transform"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>
          ) : (
            <button
              onClick={() => { triggerHaptic(); if (onOpenPaywall) onOpenPaywall(); else setShowPaywall(true); }}
              className="bg-gradient-to-r from-amber-500 to-primary text-black font-extrabold text-[10px] px-3.5 py-2 rounded-2xl flex items-center gap-1 shadow-lg hover:brightness-110 active:scale-95 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{user?.isPremium ? 'PREMIUM' : 'PRO YÜKSELT'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Focus Statistics Bento Grid - DYNAMIC DATA */}
      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-surface-container/80 border border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              HAFTALIK ODAK SÜRESİ
            </span>
            <p className="font-display text-2xl font-bold text-primary">
              {weeklyHours} Saat
            </p>
            <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>{user ? 'Canlı Senkronize Ediliyor' : 'Yeni Kullanıcı (0 Saat)'}</span>
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-white/10" cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="5" />
              <circle className="text-primary" cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="5" strokeDasharray="163" strokeDashoffset={163 - (focusScore * 1.63)} />
            </svg>
            <span className="absolute text-xs font-bold text-primary">{focusScore}%</span>
          </div>
        </div>

        <div className="bg-surface-container/80 border border-white/10 p-4 rounded-2xl space-y-1">
          <Headphones className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-on-surface-variant block">Dinlenen İçerik</span>
          <p className="font-display text-xl font-bold">{articlesRead} Haber</p>
        </div>

        <div className="bg-surface-container/80 border border-white/10 p-4 rounded-2xl space-y-1">
          <Timer className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-on-surface-variant block">Toplam Dinleme</span>
          <p className="font-display text-xl font-bold">{user?.totalListenedMinutes || 0} Dakika</p>
        </div>
      </section>

      {/* Recharts Weekly Minutes Consistency Bar Chart Section */}
      <section className="bg-surface-container/80 border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">
              DİNLEME İSTİKRARI
            </span>
            <h3 className="font-display text-sm font-bold text-on-surface flex items-center gap-1.5 mt-0.5">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span>Haftalık Dinleme Grafiği</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant block">Ort. Günlük</span>
            <span className="text-xs font-bold text-primary bg-primary/15 border border-primary/30 px-2.5 py-1 rounded-lg">
              {avgDailyMinutes} dk / gün
            </span>
          </div>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9e9e9e', fontSize: 11, fontWeight: 600 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#757575', fontSize: 10 }}
                allowDecimals={false}
              />
              <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar dataKey="dakika" radius={[8, 8, 2, 2]}>
                {weeklyChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 5 ? '#34d399' : '#4edea3'} 
                    fillOpacity={0.85 + (index * 0.02)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5 pt-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Zirve Gün: <strong>{Math.max(...weeklyChartData.map(d => d.dakika))} dk</strong></span>
          </span>
          <span className="text-primary font-bold">
            Haftalık Toplam: {user?.weeklyMinutes || weeklyChartData.reduce((a, b) => a + b.dakika, 0)} dk
          </span>
        </div>
      </section>

      {/* Doğa Sesleri & YouTube Nature Mixer Launch Card */}
      <section className={`border p-5 rounded-3xl flex items-center justify-between shadow-xl transition-all ${
        isAmbientActive 
          ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(78,222,163,0.2)]' 
          : 'bg-gradient-to-r from-emerald-950/50 via-surface-container to-surface-container border border-primary/30'
      }`}>
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <CloudRain className="w-5 h-5 animate-pulse" />
          </div>
          <div className="truncate">
            <h3 className="font-display font-bold text-xs text-on-surface truncate">
              {isAmbientActive ? `ÇALINIYOR: ${activeAmbientName || 'Doğa Sesleri'}` : 'DOĞA SESLERİ MİKSERİ'}
            </h3>
            <p className="text-[10px] text-on-surface-variant truncate">
              {isAmbientActive ? 'Bağımsız Arka Plan Ambiyans Sesi' : 'Arka Plan Ambiyans & Doğa Sesleri'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAmbientActive && onStopAmbient && (
            <button
              onClick={() => {
                triggerHaptic();
                onStopAmbient();
              }}
              className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-3 py-2.5 rounded-2xl flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Durdur</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic();
              onOpenAmbientMixer?.();
            }}
            className="bg-primary text-on-primary font-bold text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(78,222,163,0.3)] active:scale-95 transition-transform"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAmbientActive ? 'Mikser' : 'Mikseri Aç'}</span>
          </button>
        </div>
      </section>

      {/* APPLE-STYLE SETTINGS LIST */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
          UYGULAMA AYARLARI
        </h3>

        <div className="bg-surface-container rounded-3xl border border-card-border divide-y divide-card-border overflow-hidden shadow-sm">
          
          {/* Voice Engine Selector */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-surface-variant flex items-center justify-center text-primary">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Ses Motoru</p>
                <p className="text-[10px] text-on-surface-variant">iOS Siri / Native System Voices</p>
              </div>
            </div>

            <div className="relative flex bg-pill-bg p-1 rounded-xl border border-card-border shadow-inner gap-0.5">
              <button
                onClick={() => { triggerHaptic(); setVoiceEngine('native'); }}
                className={`relative z-10 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${
                  voiceEngine === 'native' ? 'text-slate-950 font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {voiceEngine === 'native' && (
                  <motion.div
                    layoutId="activeVoiceEnginePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-lg shadow-[0_0_14px_rgba(52,211,153,0.65),0_2px_6px_rgba(0,0,0,0.4)] border border-white/50 z-[-1]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Volume2 className="w-3.5 h-3.5" />
                <span>Cihaz Sesi</span>
              </button>
              <button
                onClick={() => { triggerHaptic(); setVoiceEngine('gemini'); }}
                className={`relative z-10 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${
                  voiceEngine === 'gemini' ? 'text-slate-950 font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {voiceEngine === 'gemini' && (
                  <motion.div
                    layoutId="activeVoiceEnginePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-lg shadow-[0_0_14px_rgba(52,211,153,0.65),0_2px_6px_rgba(0,0,0,0.4)] border border-white/50 z-[-1]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini AI</span>
              </button>
            </div>
          </div>

          {/* Theme Selector (Dark / Light / System) */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-surface-variant flex items-center justify-center text-primary">
                {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : themeMode === 'light' ? <Sun className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold">Tema Görünümü</p>
                <p className="text-[10px] text-on-surface-variant">Cihaz Durumuna Göre Otomatik</p>
              </div>
            </div>

            <div className="relative flex bg-pill-bg p-1 rounded-xl border border-card-border shadow-inner gap-0.5">
              <button
                onClick={() => { triggerHaptic(); setThemeMode('dark'); }}
                className={`relative z-10 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1 ${
                  themeMode === 'dark' ? 'text-slate-950 font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {themeMode === 'dark' && (
                  <motion.div
                    layoutId="activeThemeModePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-lg shadow-[0_0_14px_rgba(52,211,153,0.65),0_2px_6px_rgba(0,0,0,0.4)] border border-white/50 z-[-1]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Moon className="w-3.5 h-3.5" />
                <span>Karanlık</span>
              </button>
              <button
                onClick={() => { triggerHaptic(); setThemeMode('light'); }}
                className={`relative z-10 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1 ${
                  themeMode === 'light' ? 'text-slate-950 font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {themeMode === 'light' && (
                  <motion.div
                    layoutId="activeThemeModePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-lg shadow-[0_0_14px_rgba(52,211,153,0.65),0_2px_6px_rgba(0,0,0,0.4)] border border-white/50 z-[-1]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Sun className="w-3.5 h-3.5" />
                <span>Aydınlık</span>
              </button>
              <button
                onClick={() => { triggerHaptic(); setThemeMode('system'); }}
                className={`relative z-10 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 flex items-center gap-1 ${
                  themeMode === 'system' ? 'text-slate-950 font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {themeMode === 'system' && (
                  <motion.div
                    layoutId="activeThemeModePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-lg shadow-[0_0_14px_rgba(52,211,153,0.65),0_2px_6px_rgba(0,0,0,0.4)] border border-white/50 z-[-1]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <Globe className="w-3.5 h-3.5" />
                <span>Otomatik</span>
              </button>
            </div>
          </div>

          {/* Clear Cache & Application Data */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-red-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Önbellek & Verileri Temizle</p>
                <p className="text-[10px] text-on-surface-variant">Ses Dosyaları, Geçmiş & Yerel Belgeler</p>
              </div>
            </div>

            <button
              onClick={handleClearCacheAndData}
              disabled={isClearingCache}
              className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-red-500/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
            >
              {isClearingCache ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Temizleniyor...</span>
                </>
              ) : (
                <span>Temizle</span>
              )}
            </button>
          </div>

        </div>

        {cacheClearedMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-2xl text-xs font-bold text-center animate-fade-in">
            {cacheClearedMsg}
          </div>
        )}
      </section>

      {/* Account Auth Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
          HESAP VE OTURUM
        </h3>

        {user?.email && user.authProvider !== 'guest' ? (
          <div className="space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full bg-surface-container border border-card-border text-on-surface hover:text-red-400 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Oturumu Kapat ({user.email})</span>
            </button>

            <button
              onClick={() => { triggerHaptic(); setShowDeleteModal(true); }}
              className="w-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hesabımı Sil / Hesabı Kaldır</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {authError && (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              <span>Google İle Giriş (YouTube Abonelikleri)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowEmailAuthModal(true)}
                disabled={authLoading}
                className="bg-surface-container border border-card-border disabled:opacity-60 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 hover:border-primary/40 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>E-Posta İle Giriş</span>
              </button>

              <button
                onClick={handleGuestSignIn}
                disabled={authLoading}
                className="bg-surface-container border border-card-border disabled:opacity-60 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 hover:border-primary/40 shadow-sm"
              >
                {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <UserCheck className="w-3.5 h-3.5 text-primary" />}
                <span>Misafir Olarak Devam Et</span>
              </button>
            </div>

            <button
              onClick={() => { triggerHaptic(); setShowDeleteModal(true); }}
              className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400/80 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform mt-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Verilerimi / Hesabımı Sil</span>
            </button>
          </div>
        )}
      </section>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in touch-none"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-surface-container border border-red-500/40 rounded-3xl p-6 space-y-4 text-on-surface relative shadow-2xl cursor-default text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-display font-extrabold text-lg text-on-surface">Hesabınızı Silmek İstiyor Musunuz?</h3>
            
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bu işlem hesabınızı, cihazınızdaki yerel ses önbelleklerini, favorilerinizi ve dinleme geçmişinizi kalıcı olarak silecektir. Bu işlem geri alınamaz.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-surface-variant border border-card-border text-on-surface font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <span>Hesabı Sil</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL AUTH MODAL */}
      {showEmailAuthModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in touch-none"
          onClick={() => setShowEmailAuthModal(false)}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) setShowEmailAuthModal(false);
          }}
        >
          <div 
            className="w-full max-w-sm bg-surface-container border border-white/20 rounded-3xl p-6 space-y-4 text-on-surface relative shadow-2xl cursor-default max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEmailAuthModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-center pr-6">E-Posta İle Giriş / Kayıt</h3>

            {authError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{authError}</p>
            )}

            <form className="space-y-3">
              <input
                type="email"
                placeholder="E-Posta Adresiniz"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-xl p-3 text-xs focus:border-primary focus:outline-none text-on-surface"
              />
              <input
                type="password"
                placeholder="Şifreniz"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-xl p-3 text-xs focus:border-primary focus:outline-none text-on-surface"
              />

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleEmailAuthSubmit(e, false)}
                  disabled={authLoading}
                  className="bg-primary text-on-primary font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={(e) => handleEmailAuthSubmit(e, true)}
                  disabled={authLoading}
                  className="bg-white/10 border border-white/20 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
                >
                  Kayıt Ol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOX PRO PAYWALL MODAL */}
      {showPaywall && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in touch-none"
          onClick={() => setShowPaywall(false)}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) setShowPaywall(false);
          }}
        >
          <div 
            className="w-full max-w-md bg-surface-container/95 border border-primary/40 rounded-3xl p-6 space-y-6 shadow-2xl relative text-on-surface cursor-default max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-on-surface transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-primary p-0.5 mx-auto shadow-[0_0_30px_rgba(78,222,163,0.4)]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-primary">
                  <Sparkles className="w-8 h-8 fill-current" />
                </div>
              </div>
              <h2 className="font-display font-extrabold text-2xl">VOX PRO ABONELİK</h2>
              <p className="text-xs text-on-surface-variant">Sınırsız Yapay Zeka Seslendirme ve Kesintisiz Akış</p>
            </div>

            <div className="space-y-3">
              {[
                'Sınırsız YouTube Video & Kanal Deşifresi',
                'Gemini 2.5 HD Stüdyo Seslendirme Motoru',
                'Cihaz-İçi WoodRainSynth Doğa Sesleri',
                'Reklamsız ve Çevrimdışı Sınırsız Dinleme',
                'Sınırsız PDF & EPUB Yerel Kitap Yükleme'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-semibold">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">ÖZEL TEKLİF</span>
              <p className="font-display font-bold text-xl">₺79.99 / ay</p>
              <span className="text-[10px] text-on-surface-variant block">İlk 7 Gün Ücretsiz Deneme • İstediğin An İptal Et</span>
            </div>

            <button
              onClick={() => { triggerHaptic(); setShowPaywall(false); }}
              className="w-full bg-primary text-on-primary font-extrabold py-3.5 rounded-full text-xs shadow-[0_0_20px_rgba(78,222,163,0.4)] active:scale-95 transition-transform"
            >
              7 Günlük Ücretsiz Denemeyi Başlat
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
