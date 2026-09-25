import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Flame, 
  Tag, 
  Sparkles,
  Search,
  Check,
  Compass,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

export interface PopularTrendItem {
  id: string;
  tag: string;
  query: string;
  category: 'gundem' | 'ekonomi' | 'teknoloji' | 'spor' | 'dunya';
  volume: string;
  isHot?: boolean;
}

export const HIGH_VOLUME_TRENDS: PopularTrendItem[] = [
  { id: 't1', tag: 'Son Dakika', query: 'Son Dakika', category: 'gundem', volume: '350K+', isHot: true },
  { id: 't2', tag: 'Gündem', query: 'Gündem', category: 'gundem', volume: '280K+', isHot: true },
  { id: 't3', tag: 'Borsa İstanbul', query: 'Borsa', category: 'ekonomi', volume: '210K+', isHot: true },
  { id: 't4', tag: 'Yapay Zeka', query: 'Yapay Zeka', category: 'teknoloji', volume: '195K+', isHot: true },
  { id: 't5', tag: 'Altın & Dolar', query: 'Altın', category: 'ekonomi', volume: '180K+', isHot: true },
  { id: 't6', tag: 'Süper Lig', query: 'Süper Lig', category: 'spor', volume: '165K+', isHot: true },
  { id: 't7', tag: 'Merkez Bankası', query: 'Merkez Bankası', category: 'ekonomi', volume: '140K+' },
  { id: 't8', tag: 'Teknoloji', query: 'Teknoloji', category: 'teknoloji', volume: '130K+' },
  { id: 't9', tag: 'Transfer Gelişmeleri', query: 'Transfer', category: 'spor', volume: '125K+', isHot: true },
  { id: 't10', tag: 'Enflasyon Verileri', query: 'Enflasyon', category: 'ekonomi', volume: '110K+' },
  { id: 't11', tag: 'Dünya & Jeopolitik', query: 'Dünya', category: 'dunya', volume: '100K+' },
  { id: 't12', tag: 'Canlı Yayın', query: 'Canlı', category: 'gundem', volume: '95K+' },
  { id: 't13', tag: 'Sağlık & Yaşam', query: 'Sağlık', category: 'gundem', volume: '85K+' },
  { id: 't14', tag: 'Kripto & Bitcoin', query: 'Kripto', category: 'ekonomi', volume: '80K+' },
  { id: 't15', tag: 'Milli Takım', query: 'Milli', category: 'spor', volume: '75K+' },
  { id: 't16', tag: 'Girişim & Startup', query: 'Girişim', category: 'teknoloji', volume: '70K+' }
];

export interface PopularTrendsProps {
  variant?: 'footer' | 'bottom-bar' | 'compact';
  className?: string;
  title?: string;
  activeQuery?: string;
  onSelectTrend?: (query: string) => void;
}

export const PopularTrends: React.FC<PopularTrendsProps> = ({
  variant = 'footer',
  className = '',
  title = 'Popüler Arama Trendleri & Gündem Başlıkları',
  activeQuery = '',
  onSelectTrend
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gundem' | 'ekonomi' | 'teknoloji' | 'spor'>('all');

  const filteredTrends = useMemo(() => {
    if (selectedCategory === 'all') return HIGH_VOLUME_TRENDS;
    return HIGH_VOLUME_TRENDS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  const handleTrendClick = (trend: PopularTrendItem) => {
    const query = trend.query || trend.tag.replace(/^#/, '').trim();

    // 1. Invoke custom callback if provided
    if (onSelectTrend) {
      onSelectTrend(query);
    }

    // 2. Dispatch global event to update any active feed without page reload
    window.dispatchEvent(
      new CustomEvent('vox_filter_articles', {
        detail: { 
          query, 
          tag: trend.tag,
          category: trend.category 
        }
      })
    );

    // 3. Safe local navigation: navigate to home with ?q= search param without broken routes
    const isFeedPage = location.pathname === '/' || ['/gundem', '/ekonomi', '/teknoloji', '/spor'].includes(location.pathname);
    if (!isFeedPage) {
      navigate(`/?q=${encodeURIComponent(query)}`);
    } else {
      navigate(`?q=${encodeURIComponent(query)}`, { replace: false });
    }

    // 4. Smoothly scroll up to the articles feed section
    setTimeout(() => {
      const feedAnchor = document.getElementById('articles-feed-start');
      if (feedAnchor) {
        feedAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }, 120);
  };

  const isTrendActive = (trend: PopularTrendItem) => {
    if (!activeQuery) return false;
    const normActive = activeQuery.toLowerCase().trim();
    return (
      normActive === trend.query.toLowerCase() ||
      normActive === trend.tag.toLowerCase() ||
      normActive.includes(trend.query.toLowerCase())
    );
  };

  // --- VARIANT 1: DEDICATED BOTTOM BAR / TICKER ---
  if (variant === 'bottom-bar') {
    return (
      <div 
        aria-label="Hızlı Arama Trendleri"
        className={`w-full py-3 px-4 rounded-2xl border transition-all ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200/90 shadow-sm'
            : 'bg-[#111713]/95 border-white/10 shadow-lg'
        } ${className}`}
      >
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-black/10 dark:border-white/10">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Popüler:
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {HIGH_VOLUME_TRENDS.slice(0, 10).map((trend) => {
              const active = isTrendActive(trend);
              return (
                <button
                  key={trend.id}
                  type="button"
                  onClick={() => handleTrendClick(trend)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : theme === 'light'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 hover:border-emerald-400'
                        : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10 hover:border-emerald-500/50'
                  }`}
                  title={`${trend.tag} (${trend.volume} arama) - Haberleri filtrele`}
                >
                  <span className="text-emerald-500 font-bold">#</span>
                  <span>{trend.tag}</span>
                  <span className="text-[10px] opacity-75 font-mono">({trend.volume})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- VARIANT 2: FOOTER / COMPREHENSIVE SECTION ---
  return (
    <section 
      aria-label="Popüler Arama Trendleri ve Konu Başlıkları"
      className={`rounded-3xl border transition-all p-5 sm:p-6 ${
        theme === 'light'
          ? 'bg-gradient-to-b from-white to-slate-50/80 border-slate-200 shadow-sm'
          : 'bg-gradient-to-b from-[#111713] to-[#0c100d] border-white/10 shadow-lg'
      } ${className}`}
    >
      {/* Header with Title & Live Pulse Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <span>Hızlı Filtreleme & Arama Trendleri</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>
          <h3 className={`text-base sm:text-lg font-bold mt-1 ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {title}
          </h3>
          <p className={`text-xs mt-0.5 ${
            theme === 'light' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            En çok aranan gündem başlıklarına tıklayarak haber akışını doğrudan filtreleyebilir ve anlık gelişmeleri listeleyebilirsiniz.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border self-start sm:self-auto shrink-0 ${
          theme === 'light'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
        }`}>
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          <span>{filteredTrends.length} Trend Etiket</span>
        </div>
      </div>

      {/* Category Filter Pills (To narrow down high volume tags) */}
      <div className="flex items-center gap-1.5 pt-3.5 pb-2.5 overflow-x-auto scrollbar-none">
        {(['all', 'gundem', 'ekonomi', 'teknoloji', 'spor'] as const).map((cat) => {
          const labels: Record<string, string> = {
            all: 'Tüm Konular',
            gundem: 'Gündem',
            ekonomi: 'Ekonomi & Finans',
            teknoloji: 'Teknoloji & Yapay Zeka',
            spor: 'Spor & Futbol'
          };
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {labels[cat]}
            </button>
          );
        })}
      </div>

      {/* Grid of Clickable Trend Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
        {filteredTrends.map((trend) => {
          const active = isTrendActive(trend);
          return (
            <button
              key={trend.id}
              type="button"
              onClick={() => handleTrendClick(trend)}
              className={`group flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                active
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : theme === 'light'
                    ? 'bg-white hover:bg-emerald-50/50 border-slate-200/90 hover:border-emerald-300 text-slate-800 shadow-xs'
                    : 'bg-[#151c17]/90 hover:bg-[#19221c] border-white/5 hover:border-emerald-500/30 text-gray-200'
              }`}
              title={`"${trend.tag}" için haberleri filtrele`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  {trend.isHot ? (
                    <Flame className={`w-3.5 h-3.5 shrink-0 ${
                      active ? 'text-amber-300 fill-amber-300' : 'text-amber-500 fill-amber-500'
                    }`} />
                  ) : (
                    <Tag className={`w-3 h-3 shrink-0 ${
                      active ? 'text-white/80' : 'text-emerald-500'
                    }`} />
                  )}
                  <span className={`text-xs font-bold truncate transition-colors ${
                    active 
                      ? 'text-white' 
                      : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                  }`}>
                    #{trend.tag}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span className={`font-mono font-bold ${
                    active ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {trend.volume}
                  </span>
                  <span className={active ? 'text-white/80' : theme === 'light' ? 'text-slate-400' : 'text-gray-500'}>
                    arama
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {active ? (
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Check className="w-3 h-3" />
                  </span>
                ) : (
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    theme === 'light' 
                      ? 'bg-slate-100 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-700' 
                      : 'bg-white/5 group-hover:bg-emerald-500/20 text-gray-400 group-hover:text-emerald-400'
                  }`}>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info & Prompt */}
      <div className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
        theme === 'light' ? 'border-slate-100 text-slate-500' : 'border-white/5 text-gray-400'
      }`}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Etiketlere tıkladığınızda haber akışı seçilen konuya göre yerel olarak filtrelenir.</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] opacity-75">
          <Compass className="w-3 h-3 text-emerald-500" />
          <span>Güncel Haberler İle Senkronize</span>
        </div>
      </div>
    </section>
  );
};
