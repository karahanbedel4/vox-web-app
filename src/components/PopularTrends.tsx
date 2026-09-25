import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Tag, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

export interface PopularTrendItem {
  id: string;
  tag: string;
  category: 'gundem' | 'ekonomi' | 'teknoloji' | 'spor' | 'dunya';
  volume: string;
  isHot?: boolean;
}

export const HIGH_VOLUME_TRENDS: PopularTrendItem[] = [
  { id: 't1', tag: 'Son Dakika', category: 'gundem', volume: '320K+', isHot: true },
  { id: 't2', tag: 'Gündem Haberleri', category: 'gundem', volume: '240K+', isHot: true },
  { id: 't3', tag: 'Borsa İstanbul', category: 'ekonomi', volume: '190K+', isHot: true },
  { id: 't4', tag: 'Yapay Zeka', category: 'teknoloji', volume: '175K+', isHot: true },
  { id: 't5', tag: 'Altın & Dolar Kuru', category: 'ekonomi', volume: '160K+', isHot: true },
  { id: 't6', tag: 'Süper Lig Puan Durumu', category: 'spor', volume: '145K+', isHot: true },
  { id: 't7', tag: 'Merkez Bankası Faiz', category: 'ekonomi', volume: '130K+' },
  { id: 't8', tag: 'En Son Haberler', category: 'gundem', volume: '125K+' },
  { id: 't9', tag: 'Transfer Gelişmeleri', category: 'spor', volume: '115K+', isHot: true },
  { id: 't10', tag: 'Teknoloji & Girişim', category: 'teknoloji', volume: '105K+' },
  { id: 't11', tag: 'Türkiye Gündemi', category: 'gundem', volume: '95K+' },
  { id: 't12', tag: 'Canlı TV Yayınları', category: 'gundem', volume: '90K+' },
  { id: 't13', tag: 'Dünya & Jeopolitik', category: 'dunya', volume: '85K+' },
  { id: 't14', tag: 'Ekonomi Verileri', category: 'ekonomi', volume: '80K+' },
  { id: 't15', tag: 'Sağlık & Yaşam', category: 'gundem', volume: '70K+' },
  { id: 't16', tag: 'Haber Özetleri', category: 'gundem', volume: '65K+' }
];

export interface PopularTrendsProps {
  variant?: 'footer' | 'bottom-bar' | 'compact';
  className?: string;
  title?: string;
}

export const PopularTrends: React.FC<PopularTrendsProps> = ({
  className = '',
  title = 'Popüler Arama Trendleri & Gündem Başlıkları'
}) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gundem' | 'ekonomi' | 'teknoloji' | 'spor'>('all');

  const filteredTrends = useMemo(() => {
    if (selectedCategory === 'all') return HIGH_VOLUME_TRENDS;
    return HIGH_VOLUME_TRENDS.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <section 
      aria-label="Popüler Arama Trendleri ve Başlıklar"
      className={`rounded-3xl border transition-all p-5 sm:p-6 select-none ${
        theme === 'light'
          ? 'bg-gradient-to-b from-white to-slate-50/70 border-slate-200 shadow-sm'
          : 'bg-gradient-to-b from-[#111713] to-[#0c100d] border-white/10 shadow-lg'
      } ${className}`}
    >
      {/* Header with Title & Category Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <span>Arama Motoru Trendleri</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>
          <h3 className={`text-sm sm:text-base font-bold mt-1 ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {title}
          </h3>
          <p className={`text-xs mt-0.5 ${
            theme === 'light' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            Türkiye genelinde son 24 saatte en yüksek arama hacmine sahip gündem konuları ve trend etiketler.
          </p>
        </div>

        <div className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border self-start sm:self-auto shrink-0 ${
          theme === 'light'
            ? 'bg-slate-100 text-slate-600 border-slate-200'
            : 'bg-white/5 text-gray-400 border-white/10'
        }`}>
          <Tag className="w-3 h-3 text-emerald-500" />
          <span>{filteredTrends.length} Konu Başlığı</span>
        </div>
      </div>

      {/* Category Pills (Informational filter tabs to browse topics) */}
      <div className="flex items-center gap-1.5 pt-3.5 pb-2.5 overflow-x-auto scrollbar-none">
        {(['all', 'gundem', 'ekonomi', 'teknoloji', 'spor'] as const).map((cat) => {
          const labels: Record<string, string> = {
            all: 'Tümü',
            gundem: 'Gündem',
            ekonomi: 'Ekonomi',
            teknoloji: 'Teknoloji',
            spor: 'Spor'
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

      {/* Grid of Non-Clickable Informational Trend Tags */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
        {filteredTrends.map((trend) => (
          <div
            key={trend.id}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border text-left transition-colors cursor-default select-none ${
              theme === 'light'
                ? 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
                : 'bg-[#151c17]/80 border-white/5 text-gray-200'
            }`}
          >
            <div className="min-w-0 pr-1.5">
              <div className="flex items-center gap-1.5">
                {trend.isHot && (
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  #
                </span>
                <span className={`text-xs font-medium truncate ${
                  theme === 'light' ? 'text-slate-800' : 'text-gray-200'
                }`}>
                  {trend.tag}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="font-mono font-semibold text-emerald-500">
                  {trend.volume}
                </span>
                <span className={theme === 'light' ? 'text-slate-400' : 'text-gray-500'}>
                  arama hacmi
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                theme === 'light'
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-white/5 text-gray-400'
              }`}>
                {trend.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info Note */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
        theme === 'light' ? 'border-slate-100 text-slate-500' : 'border-white/5 text-gray-400'
      }`}>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Etiketler arama motoru indekslemesi ve trend takibi için bilgilendirme amaçlı listelenmektedir.</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] opacity-75">
          <Layers className="w-3 h-3" />
          <span>SEO Anahtar Kelimeler</span>
        </span>
      </div>
    </section>
  );
};
