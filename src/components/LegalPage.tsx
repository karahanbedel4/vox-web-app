import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Scale, 
  ShieldAlert, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  Newspaper, 
  Headphones, 
  Sparkles 
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { VoxLogo } from './VoxLogo';

export const LegalPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Yasal Uyarı ve Uyar-Kaldır (5651 Sayılı Kanun) | VOX';
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('voxozet@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0e1217] text-white'
    }`}>
      {/* Header Bar */}
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
            <Scale className="w-4 h-4" />
            <span>5651 Sayılı Kanun & FSEK Bildirimi</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Yasal Uyarı & Uyar-Kaldır Bildirimi
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-300'
          }`}>
            VOX platformunun hukuki konumu, içerik sağlayıcılığı ve telif hakkı / içerik kaldırma prosedürleri aşağıda belirtilmiştir.
          </p>
        </div>

        {/* The Exact Required Legal Text Card */}
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border space-y-4 ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#131720] border-white/10 shadow-xl'
          }`}>
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Resmi Yasal Uyarı Metni</span>
            </div>

            <p className={`text-sm sm:text-base leading-relaxed text-justify sm:text-left ${
              theme === 'light' ? 'text-slate-800' : 'text-gray-200'
            }`}>
              VOX, halka açık haber kaynaklarından elde edilen içerikleri otomatik olarak derleyen ve yapay zeka aracılığıyla özetleyen bir aracı platformdur. Platformumuzda yer alan haberlerin orijinal içerikleri, doğruluğu ve hukuki sorumluluğu tamamen ilgili yayıncı kuruluşlara aittir. VOX, sağlanan metinler üzerinde herhangi bir editoryal denetim veya yönlendirme yapmaz. Telif hakları, kişilik hakları ihlali veya diğer geçerli hukuki gerekçelerle uygulamamızdan veya web sitemizden kaldırılmasını talep ettiğiniz içerikler için, ilgili haberin URL'si veya ekran görüntüsü ile birlikte <strong className="text-emerald-400 font-bold underline">voxozet@gmail.com</strong> adresine e-posta gönderebilirsiniz. 5651 sayılı kanun kapsamında "Uyar ve Kaldır" prensibini benimseyen platformumuz, yasal taleplerinizi değerlendirerek gerekli teknik aksiyonları en kısa sürede alacaktır.
            </p>
          </div>

          {/* Contact and Takedown Form Action Card */}
          <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            theme === 'light'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-xs block ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Yasal Bildirim & Uyar-Kaldır E-Posta Hattı:
                </span>
                <span className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  voxozet@gmail.com
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyEmail}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <span>E-postayı Kopyala</span>
                )}
              </button>

              <a
                href="mailto:voxozet@gmail.com?subject=VOX%20İçerik%20Kaldırma%20Talebi%20(5651%20Sayılı%20Kanun)"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>E-posta Gönder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
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
