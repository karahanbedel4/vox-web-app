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
  ArrowRight
} from 'lucide-react';
import { VoxLogo } from './VoxLogo';
import { signInWithGoogle, signInWithGoogleRedirect, quickSignInAsUser, robustEmailSignIn } from '../lib/firebase';
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [communicationConsent, setCommunicationConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickKarahanInModal = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const profile = await quickSignInAsUser('karahanbedel@gmail.com', 'Karahan Bedel');
      setSuccessMessage('Karahan Bedel olarak başarıyla giriş yapıldı!');
      if (onSuccess) onSuccess(profile);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (e: any) {
      setErrorMessage('Hızlı giriş sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      // Pop-up açmadan doğrudan aynı sayfada yönlendirme kullanarak tarayıcı pop-up engelleyicisini atlat
      const res: any = await signInWithGoogle(communicationConsent, true);
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
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Giriş penceresi kapatıldı.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('İşlem iptal edildi.');
      } else {
        setErrorMessage(err?.message || 'Google ile giriş yapılırken bir sorun oluştu.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
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
      const profile = await robustEmailSignIn(email, password);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        className="relative w-full max-w-md rounded-3xl bg-[#121814] border border-emerald-500/30 shadow-2xl p-6 sm:p-7 text-white z-10 overflow-hidden"
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
        <div className="text-center mb-6 pt-1">
          <div className="inline-flex items-center justify-center mb-2">
            <VoxLogo size="md" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {mode === 'signin' ? 'VOX Hesabınıza Giriş Yapın' : 'Yeni VOX Hesabı Açın'}
          </h3>
          <p className="text-xs text-emerald-400/90 mt-1 font-medium">
            (Tamamen İsteğe Bağlı)
          </p>
        </div>

        {/* Reassurance Notice - Crucial for AdSense & User Trust */}
        <div className="mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-[11px] text-gray-300 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            VOX'taki tüm haberleri, sesli bültenleri ve özgün rehberleri üye olmadan da ücretsiz dinleyebilir ve okuyabilirsiniz. Giriş yaparak favorilerinizi ve odaklanma istatistiklerinizi cihazlarınız arasında eşitleyebilirsiniz.
          </span>
        </div>

        {/* Status Messages */}
        {errorMessage && (
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

        {/* Communication & Newsletter Consent Checkbox */}
        <div className="mb-4">
          <label 
            htmlFor="communication-consent-checkbox"
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer select-none group"
          >
            <input
              type="checkbox"
              id="communication-consent-checkbox"
              checked={communicationConsent}
              onChange={(e) => setCommunicationConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer shrink-0"
            />
            <span className="text-[11px] text-gray-300 group-hover:text-white leading-snug transition-colors">
              Haber bülteni, özet paylaşımlar ve yeni araç bilgilendirmeleri için e-posta ile iletişime izin veriyorum.
            </span>
          </label>
        </div>

        {/* Fast 1-Click Button (Zero Popup) */}
        <button
          type="button"
          onClick={handleQuickKarahanInModal}
          disabled={isLoading || isGoogleLoading}
          className="w-full mb-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-between gap-3 transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer border border-emerald-400/30"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xs block">Karahan Bedel Olarak Hızlı Giriş</span>
              <span className="text-[10px] text-emerald-100 font-normal">karahanbedel@gmail.com (Pop-up açılmaz)</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white shrink-0" />
        </button>

        {/* Google One-Click Sign In Button (Redirect Mode, No Popup) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-gray-100 active:bg-gray-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-emerald-500/10 disabled:opacity-60 cursor-pointer"
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
          <span>Google ile Giriş Yap (Aynı Sayfada Yönlendir)</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-white/10" />
          <span className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            veya e-posta ile
          </span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
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
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>{mode === 'signin' ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMessage(null);
            }}
            className="text-xs text-gray-400 hover:text-emerald-400 transition-colors underline cursor-pointer"
          >
            {mode === 'signin'
              ? 'Hesabınız yok mu? Hemen ücretsiz kayıt olun'
              : 'Zaten hesabınız var mı? Giriş yapın'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
