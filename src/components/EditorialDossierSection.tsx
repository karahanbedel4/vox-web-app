import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Sparkles, Clock, User, ShieldCheck } from 'lucide-react';
import { GUIDE_ARTICLES } from '../data/guides';
import { useTheme } from '../lib/ThemeContext';

export const EditorialDossierSection: React.FC = () => {
  const { theme } = useTheme();

  // Show top 4 featured in-depth analysis articles
  const featuredArticles = GUIDE_ARTICLES.slice(0, 4);

  return (
    <section className="my-6 sm:my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>VOX Dosya: Özel Araştırmalar & Analizler</span>
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block">
                Özgün İçerik
              </span>
            </div>
            <p className="text-xs text-gray-400">
              VOX editoryal kurulu tarafından hazırlanan derinlemesine dosya haber ve araştırmalar
            </p>
          </div>
        </div>

        <Link
          to="/analiz"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group transition-colors"
        >
          <span>Tümünü Gör ({GUIDE_ARTICLES.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of dossier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {featuredArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/analiz/${article.slug}`}
            className={`group rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:border-emerald-500/50'
                : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/10 hover:border-emerald-500/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTimeMinutes} dk okuma</span>
                </span>
              </div>

              <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors leading-snug mb-2 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                {article.subtitle || article.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-inherit/10 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{article.author.name}</span>
              </span>
              <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                <span>İncele</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
