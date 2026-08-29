import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Eye, 
  UserCheck, 
  FileText, 
  Mail, 
  Newspaper, 
  Headphones, 
  Sparkles,
  Cookie,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { VoxLogo } from './VoxLogo';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Gizlilik Politikası | VOX';
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
            <ShieldCheck className="w-4 h-4" />
            <span>Resmi Gizlilik ve Güvenlik Sözleşmesi</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            VOX Gizlilik Politikası
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-300'
          }`}>
            Son Güncelleme Tarihi: 29 Ağustos 2026. VOX ("Uygulama", "Platform", "Biz"), kullanıcılarımızın kişisel gizlilik haklarına saygı duyar ve kişisel verilerinizin güvenliğini en üst standartlarda korumayı taahhüt eder.
          </p>

          {/* Highlight Card linking to Cookie Policy */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            theme === 'light'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm">Çerezler ve Cihaz İçi Veri Saklama Hakkında Özel Bilgilendirme:</strong>
                <p className="text-xs mt-0.5 opacity-90">
                  Tarayıcınızda ve cihazınızda hangi çerezlerin nerede tutulduğu ve ne amaçla kullanıldığına dair detaylı bilgiye özel sayfamızdan ulaşabilirsiniz.
                </p>
              </div>
            </div>

            <Link
              to="/cerez-politikasi"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <span>Çerez Politikasını İncele</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6 text-sm leading-relaxed">
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              1. Toplanan Bilgiler ve Kapsam
            </h2>
            <p className={`mb-3 ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
              VOX, platformu anonim veya üye olarak kullanmanıza olanak tanır.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-400">
              <li><strong>Anonim Kullanım:</strong> Hesap oluşturmadan okuma ve dinleme yaparken kişisel kimlik bilgileriniz (ad, soyad, telefon) asla talep edilmez veya kaydedilmez.</li>
              <li><strong>Üyelik ve Giriş:</strong> Google Sign-In veya E-posta ile giriş yaptığınızda yalnızca temel profil bilgileri (E-posta, ad ve profil fotoğrafı) Firebase Authentication altyapısı ile güvenle işlenir.</li>
              <li><strong>Cihaz ve Kullanım Tercihleri:</strong> Ses hızı, tema, ses mikseri kanal seviyeleri ve yer imleriniz cihazınızda depolanır.</li>
            </ul>
          </section>

          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              2. Bilgilerin Kullanım Amacı
            </h2>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              Toplanan veriler yalnızca; sesli okuma servislerinin çalıştırılması, yapay zeka haber özetlerinin iletilmesi, seçtiğiniz odak müziklerinin çalınması ve abonelik haklarınızın doğrulanması amacıyla kullanılır. Bilgileriniz asla üçüncü şahıslarla reklam veya veri simsarlığı amacıyla paylaşılmaz.
            </p>
          </section>

          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              3. Veri Güvenliği ve Altyapı
            </h2>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              VOX, tüm veri aktarımlarını uçtan uca TLS 1.3 / SSL şifreleme protokolleri ile korur. Sunucu tarafında ISO 27001 ve SOC 2 uyumlu Google Cloud altyapısı kullanılmaktadır.
            </p>
          </section>

          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              4. İletişim ve Veri Sahibi Hakları
            </h2>
            <p className={`mb-3 ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
              KVKK'nın 11. maddesi ve GDPR uyarınca verilerinizin silinmesini, güncellenmesini veya dışa aktarılmasını talep edebilirsiniz.
            </p>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="font-bold text-xs text-white">voxozet@gmail.com</span>
              <a 
                href="mailto:voxozet@gmail.com?subject=VOX%20Gizlilik%20ve%20Veri%20Talebi" 
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Talebi E-postayla İlet
              </a>
            </div>
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
