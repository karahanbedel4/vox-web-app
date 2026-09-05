import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Share2, Sparkles, BookOpen, ChevronRight, Mail } from 'lucide-react';
import { GUIDE_ARTICLES } from '../data/guides';
import { VoxLogo } from './VoxLogo';

export const GuideDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = GUIDE_ARTICLES.find(g => g.slug === slug);

  useEffect(() => {
    if (guide) {
      window.scrollTo(0, 0);
      document.title = `${guide.title} | VOX Rehber`;
    }
  }, [guide]);

  if (!guide) {
    return <Navigate to="/rehberler" replace />;
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: guide.title,
        text: guide.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Bağlantı panoya kopyalandı!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d120f] text-gray-200 selection:bg-[#1ed760] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0d120f]/90 backdrop-blur-md z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <VoxLogo size="sm" showText={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/rehberler" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tüm Rehberler</span>
            </Link>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Paylaş</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Link to="/" className="hover:text-gray-300">Ana Sayfa</Link>
          <ChevronRight className="w-3 h-3 text-gray-700" />
          <Link to="/rehberler" className="hover:text-gray-300">Rehberler</Link>
          <ChevronRight className="w-3 h-3 text-gray-700" />
          <span className="text-gray-400 truncate max-w-[200px]">{guide.category}</span>
        </nav>

        {/* Title & Metadata */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{guide.category}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight font-display leading-tight">
            {guide.title}
          </h1>

          <p className="text-base text-gray-400 leading-relaxed font-normal">
            {guide.subtitle}
          </p>

          {/* Author Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-white/10 py-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-[#1ed760]">
                KB
              </div>
              <div>
                <p className="font-bold text-white flex items-center gap-2">
                  <span>{guide.author.name}</span>
                  <span className="text-[10px] text-[#1ed760] font-normal px-1.5 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20">
                    {guide.author.role}
                  </span>
                </p>
                <p className="text-gray-500 font-mono text-[11px]">
                  Yayın: {guide.publishedDate} • Güncelleme: {guide.updatedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-gray-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{guide.readTimeMinutes} dakika okuma</span>
            </div>
          </div>
        </header>

        {/* Özet Kutusu */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border-l-4 border-l-[#1ed760] border-t border-r border-b border-white/10 text-sm text-gray-300 leading-relaxed">
          <span className="font-bold text-[#1ed760] block mb-1 uppercase text-xs tracking-wider">Özet & Ana Fikir:</span>
          {guide.summary}
        </div>

        {/* Article Body */}
        <article className="prose prose-invert max-w-none space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
          {guide.content.map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </article>

        {/* Tags */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-mono mr-1">Etiketler:</span>
          {guide.keywords.map((kw, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
              #{kw}
            </span>
          ))}
        </div>

        {/* Author Bio Card (E-E-A-T) */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1ed760] to-emerald-800 p-0.5 shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#141c17] flex items-center justify-center font-black text-white text-lg">
              KB
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{guide.author.name}</span>
              <span className="text-gray-500 font-normal">({guide.author.role})</span>
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Yazılım geliştirici ve VOX kurucusu. Teknoloji, dijital medya, bilişsel verimlilik ve derin odaklanma üzerine araştırmalar yürütüyor ve bağımsız makaleler kaleme alıyor.
            </p>
            <p className="pt-1">
              <a href={`mailto:${guide.author.email}`} className="text-[#1ed760] hover:underline font-mono">
                {guide.author.email}
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-white/10 pt-8 flex items-center justify-between">
          <Link
            to="/rehberler"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Rehberlere Dön</span>
          </Link>
          <Link
            to="/odaklan"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1ed760] hover:underline"
          >
            <span>Odaklanma Modunu Dene</span>
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
};
