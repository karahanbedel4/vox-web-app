import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mail, Lock, X, CheckCircle2, AlertCircle, RefreshCw, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { auth, googleProvider, signInWithGoogle, signInAsGuest, robustEmailSignIn, robustEmailSignUp, syncUserProfile } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { appStorage } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  reason?: 'guest_limit' | 'general';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  reason = 'guest_limit'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Listen for global auth changes (e.g. Safari redirect / OAuth callback)
  useEffect(() => {
    const handleAuthChanged = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt?.detail) {
        setLoading(false);
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }
    };
    window.addEventListener('vox_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('vox_auth_changed', handleAuthChanged);
    };
  }, [onAuthSuccess, onClose]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await signInWithGoogle();
      if (res?.user) {
        await syncUserProfile(res.user);
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      setErrorMsg((err as Error)?.message || 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    if (reason === 'guest_limit') {
      setErrorMsg('1 ücretsiz misafir hakkınızı tamamladınız. Devam etmek için lütfen kaydolun veya giriş yapın.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signInAsGuest();
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.error('Misafir girişi hatası:', err);
      setErrorMsg((err as Error)?.message || 'Misafir girişi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        await robustEmailSignUp(email, password);
      } else {
        await robustEmailSignIn(email, password);
      }
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kimlik doğrulama hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-surface-container/95 border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(78,222,163,0.15)] flex flex-col text-on-surface"
        >
          {/* Top Banner Header */}
          <div className="relative p-6 bg-gradient-to-b from-primary/20 via-surface-container to-surface-container text-center border-b border-white/10 space-y-2">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[11px] font-bold text-primary uppercase tracking-widest shadow-[0_0_15px_rgba(78,222,163,0.3)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{reason === 'guest_limit' ? 'MİSAFİR DENEME LİMİTİ' : 'VOX ÜYELİK'}</span>
            </div>

            <h2 className="font-display text-2xl font-black tracking-tight text-white leading-tight">
              {reason === 'guest_limit' 
                ? 'Misafir Özetleme Limitine Ulaştınız' 
                : 'Devam Etmek İçin Giriş Yapın'}
            </h2>

            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              {reason === 'guest_limit'
                ? 'Misafir modundaki 1 ücretsiz özetleme hakkınızı kullandınız. Web, YouTube ve PDF bültenlerini özetlemeye ücretsiz devam etmek için giriş yapın.'
                : 'Hesabınızla giriş yaparak tüm özet bültenlerinizi cihazlarınız arasında senkronize edin.'}
            </p>
          </div>

          {/* Form Content Body */}
          <div className="p-6 space-y-5 text-xs">
            {/* Success Banner */}
            {successMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-2.5 text-rose-200 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick One-Click Google Auth */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{loading ? 'İşleniyor...' : 'Google ile Tek Tıkla Giriş Yap'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-[1px] bg-white/10 flex-1"></div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase">Veya E-posta İle</span>
              <div className="h-[1px] bg-white/10 flex-1"></div>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-surface-container-high/60 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => { setMode('register'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-center rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register' 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ücretsiz Kaydol</span>
              </button>
              <button
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-center rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login' 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
            </div>

            {/* Email & Password Input Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full bg-surface-container-high/80 border border-white/10 focus:border-primary/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-on-surface-variant/50 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-high/80 border border-white/10 focus:border-primary/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-on-surface-variant/50 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <span>{mode === 'register' ? 'Ücretsiz Hesabımı Oluştur' : 'Giriş Yap & Devam Et'}</span>
                )}
              </button>
            </form>

            <div className="flex flex-col items-center justify-center gap-2 pt-1 text-[10px] text-on-surface-variant/70">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>%100 Ücretsiz Kayıt • Kredi kartı gerekmez</span>
              </div>
              <button
                type="button"
                onClick={handleGuestAuth}
                disabled={loading}
                className="text-primary hover:underline font-medium text-xs mt-1 transition-all"
              >
                Misafir Olarak Devam Et (Giriş Yapmadan)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
