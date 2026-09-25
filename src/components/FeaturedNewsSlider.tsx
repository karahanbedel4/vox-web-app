import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Play, Clock, Zap } from 'lucide-react';
import { Article } from '../types';
import { useTheme } from '../lib/ThemeContext';
import { getArticleUrl, sanitizeNewsText, calculateReadingTime, getTopicContextualImage, DEFAULT_VOX_FALLBACK_IMAGE } from '../lib/newsService';

interface FeaturedNewsSliderProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const FeaturedNewsSlider: React.FC<FeaturedNewsSliderProps> = ({
  articles,
  onSelectArticle
}) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  // Take the top 6 to 9 news items for the featured highlights slider
  const featured = articles.slice(0, 9);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate approximate active index
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 16 : clientWidth;
    const currentIdx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(0, currentIdx), featured.length - 1));
  }, [featured.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 16 : 320;
    const scrollAmount = direction === 'next' ? cardWidth : -cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToCard = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 16 : 320;
    el.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
  };

  if (featured.length === 0) return null;

  return (
    <section 
      aria-label="VOX AI Öne Çıkan Haberler"
      className={`rounded-3xl border p-4 sm:p-5 transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-b from-white to-slate-50/70 border-slate-200/90 shadow-sm'
          : 'bg-gradient-to-b from-[#141715] to-[#0e1210] border-white/10 shadow-lg shadow-black/40'
      }`}
    >
      {/* HEADER: VOX AI | Öne Çıkanlar (Bundle Inspired) */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-black font-black shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-black fill-black" />
          </div>

          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              <span className="text-emerald-500 font-extrabold">VOX AI</span>
              <span className="text-slate-300 dark:text-zinc-600 font-light">|</span>
              <span>Öne Çıkanlar</span>
            </h2>
            <span className={`text-[11px] font-semibold hidden md:inline-block ${
              theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Günün en önemli gelişmeleri
            </span>
          </div>
        </div>

        {/* NAVIGATION CONTROLS (< and > Buttons) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            disabled={!canScrollLeft}
            aria-label="Önceki haberler"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              !canScrollLeft
                ? 'opacity-30 cursor-not-allowed border-transparent text-gray-400'
                : theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm active:scale-95'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white shadow-sm active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('next')}
            disabled={!canScrollRight}
            aria-label="Sonraki haberler"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              !canScrollRight
                ? 'opacity-30 cursor-not-allowed border-transparent text-gray-400'
                : theme === 'light'
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm active:scale-95'
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white shadow-sm active:scale-95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL TRACK (3 CARDS ON DESKTOP, 2 ON TABLET, 1+PEEK ON MOBILE) */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featured.map((article, idx) => {
          const articleUrl = getArticleUrl(article);
          const readingTime = calculateReadingTime(article);
          const cleanImg = article.imageUrl && !article.imageUrl.includes('placeholder')
            ? article.imageUrl
            : getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;

          return (
            <article
              key={article.id || idx}
              className="w-[82vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-11px)] shrink-0 snap-start flex flex-col group cursor-pointer"
            >
              <Link
                to={articleUrl}
                className="flex flex-col h-full select-none"
                title={article.title}
              >
                {/* 16:9 CARD IMAGE WITH BUNDLE-STYLE ROUNDED CORNERS */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm shrink-0">
                  <img
                    src={cleanImg}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* QUICK LISTEN BADGE */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/15">
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>{readingTime}</span>
                  </div>

                  {/* CATEGORY CHIP (Top Left) */}
                  {article.category && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {article.category}
                    </div>
                  )}
                </div>

                {/* CARD META ROW: PUBLISHER AVATAR + NAME + "ÖZET ⚡" BADGE (Exact Bundle Style) */}
                <div className="flex items-center justify-between gap-2 mt-2.5 mb-1.5 px-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px] font-black shrink-0">
                      {(article.author || 'V')[0].toUpperCase()}
                    </div>
                    <span className={`text-xs font-semibold truncate ${
                      theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
                    }`}>
                      {article.author || 'VOX Özet'}
                    </span>
                  </div>

                  {/* BUNDLE-STYLE "Özet ⚡" PILL BADGE */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span>Özet</span>
                    <Zap className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>

                {/* HEADLINE TITLE */}
                <h3 className={`text-sm sm:text-[15px] font-bold leading-snug line-clamp-2 px-0.5 group-hover:text-emerald-500 transition-colors ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {sanitizeNewsText(article.title)}
                </h3>
              </Link>
            </article>
          );
        })}
      </div>

      {/* PAGINATION DOTS (Centered below cards, just like Bundle) */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {featured.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={() => scrollToCard(dotIdx)}
            aria-label={`Slayt ${dotIdx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              dotIdx === activeIndex
                ? 'w-5 h-1.5 bg-emerald-500'
                : theme === 'light'
                ? 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
