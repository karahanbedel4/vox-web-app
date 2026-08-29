import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  Cpu, 
  Scale, 
  CreditCard, 
  Newspaper, 
  Headphones, 
  Sparkles 
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { VoxLogo } from './VoxLogo';

export const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Kullanım Koşulları | VOX';
  }, []);

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0e1217] text-white'
    }`}>
      {/* Top Header Bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 sm:px-8 py-3.5 flex items-center justify-between ${
        theme === 'light' 
          ? 'bg-white/90 border-slate-200 shadow-sm' 
          : 'bg-[#12161f]/90 border-white/10 shadow-lg'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
            }`}
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Geri</span>
          </button>
          <Link to="/" className="flex items-center">
            <VoxLogo size="sm" />
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/gundem"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Gündem Akışına Dön</span>
          </Link>

          <Link
            to="/odaklan"
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Odaklanma Alanına Geç</span>
            <span className="sm:hidden">Odaklan</span>
          </Link>
        </div>
      </header>

      {/* Main Content - Ad-Free */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-4 mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <FileText className="w-4 h-4" />
            <span>Kullanıcı ve Hizmet Sözleşmesi</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            VOX Kullanım Koşulları
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-300'
          }`}>
            VOX web sitesini veya mobil uygulamasını kullanarak aşağıdaki koşulları peşinen kabul etmiş sayılırsınız.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm leading-relaxed">
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              1. Hizmetin Niteliği ve Yapay Zeka Özeti
            </h2>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              VOX, halka açık haber kaynaklarından RSS ve açık API protokolleri aracılığıyla veri derleyen ve yapay zeka modelleriyle kullanıcıya tarafsız, kısa sesli özetler sunan bir aracı hizmet sağlayıcıdır. Orijinal haber içeriklerinin telif ve doğruluk sorumluluğu ilgili kaynak yayıncıya aittir.
            </p>
          </section>

          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              2. Fikri Mülkiyet ve Adil Kullanım (Fair Use)
            </h2>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              VOX markası, logosu, arayüz tasarımları ve ses sentezleme algoritmaları VOX Media Technologies mülkiyetindedir. Haber alıntıları kaynak gösterilerek ve orijinal yayıncının bağlantısı açıkça belirtilerek "adil kullanım" ve "özetleme" prensipleri çerçevesinde işlenmektedir.
            </p>
          </section>

          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              3. PRO Abonelik ve İptal Şartları
            </h2>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              VOX PRO abonelikleri Google Play Store, Apple App Store veya Stripe / RevenueCat üzerinden güvenle yönetilir. İptal taleplerinizi ilgili uygulama mağazasının abonelik yönetim merkezinden dilediğiniz an tek tıkla gerçekleştirebilirsiniz.
            </p>
          </section>
        </div>

        {/* Bottom CTA Navigation Bar */}
        <div className={`mt-12 p-6 sm:p-8 rounded-3xl border text-center space-y-4 ${
          theme === 'light'
            ? 'bg-gradient-to-b from-white to-slate-100 border-slate-200 shadow-lg'
            : 'bg-gradient-to-b from-[#161b26] to-[#0f131a] border-white/10 shadow-2xl'
        }`}>
          <div className="flex justify-center pb-1">
            <VoxLogo size="md" />
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight">
            Deneyiminize Kaldığınız Yerden Devam Edin
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/gundem"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Newspaper className="w-4 h-4" />
              <span>Gündem Akışına Dön</span>
            </Link>

            <Link
              to="/odaklan"
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 cursor-pointer ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Odaklanma Alanına Geç</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
