import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogIn, 
  Mail, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Zap
} from 'lucide-react';
import { VoxLogo } from './VoxLogo';
import { signInWithGoogle, robustEmailSignIn, robustEmailSignUp, instantEmailSignIn, signInAsGuest } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [authMethod, setAuthMethod] = useState<'instant' | 'password'>('instant');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('karahanbedel@gmail.com');
  const [password, setPassword] = useState('');
  const [communicationConsent, setCommunicationConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originMismatchNotice, setOriginMismatchNotice] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setOriginMismatchNotice(false);
    setIsGoogleLoading(true);
    try {
      const res: any = await signInWithGoogle(communicationConsent, false);
      if (res?.user || res?.profile) {
        setSuccessMessage('Google ile başarıyla giriş yapıldı.');
        if (onSuccess) {
          const prof = res.profile || {
            uid: res.user.uid,
            displayName: res.user.displayName || 'Google Kullanıcısı',
            email: res.user.email || '',
            photoURL: res.user.photoURL || '',
            authProvider: 'google',
            isPremium: false,
            focusScore: 90,
            streakCount: 1,
            weeklyMinutes: 15,
            totalArticlesRead: 1,
            totalListenedMinutes: 5,
            communicationConsent,
            communicationConsentDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          onSuccess(prof);
        }
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('origin_mismatch') || 
        errMsg.includes('unauthorized-domain') || 
        errMsg.includes('yetkili alan') ||
        err?.code === 'auth/unauthorized-domain'
      ) {
        setOriginMismatchNotice(true);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // Did user close the popup after seeing Google 400 origin mismatch?
        setOriginMismatchNotice(true);
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('İşlem iptal edildi.');
      } else {
        setErrorMessage(errMsg || 'Google ile giriş yapılırken bir sorun oluştu.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Instant passwordless 1-click email sign-in
  const handleInstantEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const profile = await instantEmailSignIn(cleanEmail, communicationConsent);
      setSuccessMessage('Giriş başarılı! Oturum açıldı.');
      if (onSuccess) {
        onSuccess(profile);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Traditional password sign-in / sign-up
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const profile = mode === 'signup' 
        ? await robustEmailSignUp(email, password)
        : await robustEmailSignIn(email, password);
      profile.communicationConsent = communicationConsent;
      profile.communicationConsentDate = new Date().toISOString();
      setSuccessMessage(mode === 'signin' ? 'Başarıyla giriş yapıldı!' : 'Hesabınız başarıyla oluşturuldu!');
      if (onSuccess) {
        onSuccess(profile);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.warn('Email auth notice:', err);
      let msg = 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
      if (err?.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta adresi formatı.';
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        msg = 'E-posta veya şifre hatalı.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi ile kayıtlı bir hesap zaten var.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const profile = await signInAsGuest();
      setSuccessMessage('Misafir olarak giriş yapıldı.');
      if (onSuccess) onSuccess(profile);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Misafir girişi başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-md rounded-3xl bg-[#121814] border border-emerald-500/30 shadow-2xl p-5 sm:p-7 text-white z-10 overflow-hidden"
      >
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5 pt-1">
          <div className="inline-flex items-center justify-center mb-2">
            <VoxLogo size="md" />
          </div>
          <h3 className="text-lg font-black text-white tracking-wide">
            VOX Hesabınıza Giriş Yapın
          </h3>
          <p className="text-xs text-emerald-400/90 mt-0.5 font-medium">
            Tüm cihazlarınızda favorileriniz ve istatistikleriniz senkronize olsun
          </p>
        </div>

        {/* GOOGLE ORIGIN MISMATCH SPECIAL HELP BOX */}
        {originMismatchNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Google Güvenlik Uyarısı (Hata 400: origin_mismatch)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Google, özel alan adınızı (<strong className="text-white">voxozet.com</strong>) henüz Google Cloud Console'daki Yetkili JavaScript Kaynakları listesinde görmediği için bu uyarıyı vermektedir.
            </p>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-1">
              <p className="font-semibold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Beklemeden Giriş:</span>
              </p>
              <p className="text-gray-300">
                Aşağıdaki <strong className="text-white">"Hemen Giriş Yap"</strong> butonuna basarak Google ayarlarını beklemeden tek tıkla hesabınızı anında açabilirsiniz!
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {errorMessage && !originMismatchNotice && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. PRIMARY ONE-CLICK GOOGLE SIGN IN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 active:bg-gray-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-emerald-500/10 disabled:opacity-60 cursor-pointer"
        >
          {isGoogleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google ile Giriş Yap</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-white/10" />
          <span className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            veya e-posta ile
          </span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* 2. INSTANT 1-CLICK EMAIL LOGIN FORM */}
        {authMethod === 'instant' ? (
          <form onSubmit={handleInstantEmailLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                E-posta Adresiniz (Şifresiz Tek Tık Giriş)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karahanbedel@gmail.com"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-emerald-200" />
                  <span>E-posta ile Hemen Giriş Yap</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className="hover:text-emerald-400 transition-colors underline cursor-pointer text-[11px]"
              >
                Şifre ile giriş yapmak istiyorum
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="hover:text-white transition-colors text-[11px]"
              >
                Misafir olarak devam et
              </button>
            </div>
          </form>
        ) : (
          /* 3. TRADITIONAL PASSWORD FORM */
          <form onSubmit={handlePasswordAuth} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@domain.com"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{mode === 'signin' ? 'Şifreyle Giriş Yap' : 'Hesap Oluştur'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <button
                type="button"
                onClick={() => setAuthMethod('instant')}
                className="hover:text-emerald-400 transition-colors underline cursor-pointer text-[11px]"
              >
                ⚡ Şifresiz Hızlı Girişe Dön
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMessage(null);
                }}
                className="hover:text-white transition-colors text-[11px] underline"
              >
                {mode === 'signin' ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </div>
          </form>
        )}

        {/* Communication & Newsletter Consent Checkbox */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <label 
            htmlFor="communication-consent-checkbox"
            className="flex items-start gap-2 text-[11px] text-gray-400 hover:text-gray-300 transition-colors cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="communication-consent-checkbox"
              checked={communicationConsent}
              onChange={(e) => setCommunicationConsent(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer shrink-0"
            />
            <span>
              Haber bülteni ve önemli gelişmeler için e-posta bildirimine izin veriyorum.
            </span>
          </label>
        </div>
      </motion.div>
    </div>
  );
};
