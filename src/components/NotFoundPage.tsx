import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  Newspaper, 
  Headphones, 
  Cpu, 
  TrendingUp, 
  BookOpen, 
  Compass, 
  HelpCircle, 
  Sparkles 
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { VoxLogo } from './VoxLogo';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    document.title = '404 - Sayfa Bulunamadı | VOX';
  }, []);

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0e1217] text-white'
    }`}>
      {/* Top Simple Header */}
      <header className={`px-6 py-4 border-b flex items-center justify-between ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#12161f] border-white/10'
      }`}>
        <Link to="/" className="flex items-center">
          <VoxLogo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/gundem"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-all"
          >
            Gündem
          </Link>
          <Link
            to="/odaklan"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white'
            }`}
          >
            Odaklan
          </Link>
        </div>
      </header>

      {/* Main 404 Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full text-center space-y-6">
          {/* Animated 404 Hero badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="text-7xl sm:text-9xl font-black font-display tracking-tight bg-gradient-to-br from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent select-none">
              404
            </div>
            <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest">
              Sayfa Bulunamadı
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              Aradığınız içerik taşınmış veya silinmiş olabilir
            </h1>
            <p className={`text-xs sm:text-sm max-w-md mx-auto ${
              theme === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}>
              Merak etmeyin! Yapay zeka ile hazırlanan sesli bültenlerimize ya da odaklanma frekanslarına hemen aşağıdan ulaşabilirsiniz.
            </p>
          </div>

          {/* Primary Action Buttons */}
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
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Odaklanma Alanına Geç</span>
            </Link>
          </div>

          {/* Quick Category Links */}
          <div className={`mt-8 p-5 rounded-2xl border text-left space-y-3 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Popüler Başlıklar & Kategoriler
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              <Link
                to="/teknoloji"
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                  theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Teknoloji</span>
              </Link>
              <Link
                to="/ekonomi"
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                  theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekonomi</span>
              </Link>
              <Link
                to="/kitaplik"
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                  theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Kitaplık</span>
              </Link>
              <Link
                to="/cerez-politikasi"
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                  theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Çerezler</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-500 border-t border-white/5">
        <p>© {new Date().getFullYear()} VOX Media Technologies • Sesli Haber & Odaklanma Platformu</p>
      </footer>
    </div>
  );
};
