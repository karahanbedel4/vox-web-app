import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, User, ArrowRight, ArrowLeft, Sparkles, Tag } from 'lucide-react';
import { GUIDE_ARTICLES } from '../data/guides';
import { VoxLogo } from './VoxLogo';

export const GuidesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Özgün Rehberler & Analizler | VOX - Derin Odaklanma ve Bilgi';
  }, []);

  return (
    <div className="min-h-screen bg-[#0d120f] text-gray-200 selection:bg-[#1ed760] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0d120f]/90 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <VoxLogo size="sm" showText={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/hakkimizda" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</Link>
            <Link to="/kunye" className="text-gray-400 hover:text-white transition-colors">Künye</Link>
            <Link to="/yayin-ilkeleri" className="text-gray-400 hover:text-white transition-colors">Yayın İlkeleri</Link>
            <Link to="/" className="flex items-center gap-1 text-[#1ed760] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Özgün Araştırmalar & Rehberler</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-display">
            Derin Çalışma, Odaklanma ve Bilgi Diyeti Kütüphanesi
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
            VOX editöryal ekibi tarafından kaleme alınmış; dijital gürültüyü azaltan, üretkenliği artıran ve zihinsel berraklık sağlayan kapsamlı analiz ve rehber makaleleri.
          </p>
        </section>

        {/* Guides Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDE_ARTICLES.map((guide) => (
            <article 
              key={guide.slug}
              className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between group hover:border-[#1ed760]/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-sans">
                    {guide.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{guide.readTimeMinutes} dk okuma</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-[#1ed760] transition-colors leading-snug">
                  <Link to={`/rehber/${guide.slug}`}>{guide.title}</Link>
                </h2>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {guide.summary}
                </p>
              </div>

              <div className="pt-5 border-t border-white/5 mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-[#1ed760]">
                    KB
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{guide.author.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{guide.publishedDate}</p>
                  </div>
                </div>

                <Link
                  to={`/rehber/${guide.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1ed760] hover:underline"
                >
                  <span>Oku</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};
