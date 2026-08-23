import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play, Pause, Bookmark, Sparkles, ChevronRight, Volume2, Eye, EyeOff, Loader2, ArrowDown, WifiOff, BookOpen, RefreshCw, Youtube, FileText, Link2, Plus, Sliders, Check, X } from 'lucide-react';
import { Article } from '../types';
import { ResumePosition } from '../lib/ttsService';
import { ResumeBanner } from './ResumeBanner';
import { StreakWidget } from './StreakWidget';
import { StreakInfo } from '../lib/streakService';
import { OfflineBanner } from './OfflineBanner';
import { fetchNewsByCategory, getTopicContextualImage, sanitizeImageUrl, DEFAULT_VOX_FALLBACK_IMAGE } from '../lib/newsService';
import { cacheTop3Articles } from '../lib/offlineService';
import { appStorage } from '../lib/storage';
import { getArticlesPaginated } from '../lib/firebase';

// Helper to sanitize and strip any raw HTML tags or link text (e.g., &lt;a href=...)
const sanitizeText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/&lt;[\s\S]*?&gt;/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;a[\s\S]*/gi, '')
    .replace(/a\s+href=[^\s>]+/gi, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

const ALL_AVAILABLE_INTERESTS = [
  'Teknoloji', 
  'Dünya', 
  'Ekonomi', 
  'Kültür & Sanat', 
  'Finans', 
  'Etik & Bilim', 
  'Sürdürülebilirlik', 
  'Felsefe', 
  'Gündem', 
  'Yapay Zeka', 
  'Spor'
];

interface ReadTabProps {
  articles: Article[];
  bookmarkedIds: string[];
  onPlayArticle: (article: Article) => void;
  onToggleBookmark: (articleId: string) => void;
  currentArticle: Article | null;
  isPlaying: boolean;
  currentWordIndex?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onScrollDirectionChange?: (isHidden: boolean) => void;
  resumeItem?: { article: Article; position: ResumePosition } | null;
  onResumePlayback?: (article: Article, position: ResumePosition) => void;
  onDismissResume?: () => void;
  streakInfo?: StreakInfo | null;
  isOffline?: boolean;
  offlineArticles?: Article[];
}

export const ReadTab: React.FC<ReadTabProps> = ({
  articles,
  bookmarkedIds,
  onPlayArticle,
  onToggleBookmark,
  currentArticle,
  isPlaying,
  currentWordIndex = 0,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onScrollDirectionChange,
  resumeItem,
  onResumePlayback,
  onDismissResume,
  streakInfo,
  isOffline = false,
  offlineArticles = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Dynamic GNews / Turkish RSS News Feed state
  const [dynamicNews, setDynamicNews] = useState<Article[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Favorite categories selected during onboarding / preferences
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(() => {
    try {
      const saved = appStorage.getItemSync('vox_favorite_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Teknoloji', 'Finans', 'Etik & Bilim'];
  });
  const [showInterestsModal, setShowInterestsModal] = useState<boolean>(false);

  const categories = ['Tümü', 'Favoriler', 'Dönüştürülenler', 'Teknoloji', 'Dünya', 'Ekonomi', 'Kültür & Sanat', 'Finans', 'Etik & Bilim', 'Sürdürülebilirlik', 'Felsefe'];

  // Helper to identify user-converted articles vs Live News items
  const isConvertedArticle = (a: Article) => {
    if (!a) return false;
    return (
      ['pdf', 'ocr', 'text'].includes(a.sourceType) ||
      a.id.startsWith('user_') ||
      a.id.startsWith('custom_') ||
      a.id.startsWith('upload_') ||
      a.category === 'Dönüştürülenler' ||
      a.category === 'Dönüştürülen Metin' ||
      a.category === 'PDF' ||
      a.category === 'Pano'
    );
  };

  // User-converted articles (YouTube, PDF, Web links, text pastes)
  const convertedArticles = useMemo(() => {
    return articles.filter(a => isConvertedArticle(a));
  }, [articles]);

  const toggleFavoriteCategory = (cat: string) => {
    let updated: string[];
    if (favoriteCategories.includes(cat)) {
      if (favoriteCategories.length === 1) return; // Keep at least 1 favorite
      updated = favoriteCategories.filter(c => c !== cat);
    } else {
      updated = [...favoriteCategories, cat];
    }
    setFavoriteCategories(updated);
    appStorage.setItem('vox_favorite_categories', JSON.stringify(updated));
  };

  // Load news function using live Google News RSS blending + Firestore fallback
  const loadCategoryNews = async (showFullLoader = true) => {
    if (selectedCategory === 'Dönüştürülenler' || selectedCategory === 'Favoriler' || isOffline) {
      setIsLoadingNews(false);
      setIsRefreshing(false);
      return;
    }

    if (showFullLoader) setIsLoadingNews(true);
    setIsRefreshing(true);

    try {
      const categoryQuery = selectedCategory === 'Tümü' ? 'Tümü' : selectedCategory;

      // 1. Fetch live news items via Google News RSS Service
      const liveFetched = await fetchNewsByCategory(categoryQuery, 'tr');

      // 2. Fetch Firestore articles
      const firestoreRes = await getArticlesPaginated(12, null, selectedCategory === 'Tümü' ? undefined : selectedCategory);
      const firestoreArticles = firestoreRes.articles || [];

      // 3. Harmonize and deduplicate articles by cleaned title
      const mergedMap = new Map<string, Article>();

      const sanitizeCategory = (rawCat?: string) => {
        if (!rawCat || rawCat === 'Tümü' || rawCat.length > 20 || rawCat.includes('Teknoloji Finans')) {
          if (rawCat?.toLowerCase().includes('teknoloji')) return 'Teknoloji';
          if (rawCat?.toLowerCase().includes('ekonomi') || rawCat?.toLowerCase().includes('finans')) return 'Ekonomi';
          if (rawCat?.toLowerCase().includes('dünya') || rawCat?.toLowerCase().includes('dunya')) return 'Dünya';
          if (rawCat?.toLowerCase().includes('kültür') || rawCat?.toLowerCase().includes('kultur')) return 'Kültür & Sanat';
          return 'Gündem';
        }
        return rawCat;
      };

      if (liveFetched && liveFetched.length > 0) {
        liveFetched.forEach(a => {
          const cleanTitle = sanitizeText(a.title);
          if (cleanTitle && !isConvertedArticle(a)) {
            mergedMap.set(cleanTitle.toLowerCase(), {
              ...a,
              category: sanitizeCategory(selectedCategory === 'Tümü' ? a.category : selectedCategory),
              title: cleanTitle,
              summary: sanitizeText(a.summary),
              content: sanitizeText(a.content)
            });
          }
        });
      }

      firestoreArticles.forEach(a => {
        const cleanTitle = sanitizeText(a.title);
        if (cleanTitle && !isConvertedArticle(a) && !mergedMap.has(cleanTitle.toLowerCase())) {
          mergedMap.set(cleanTitle.toLowerCase(), a);
        }
      });

      articles.forEach(a => {
        const cleanTitle = sanitizeText(a.title);
        if (cleanTitle && !isConvertedArticle(a) && !mergedMap.has(cleanTitle.toLowerCase())) {
          mergedMap.set(cleanTitle.toLowerCase(), a);
        }
      });

      const finalHarmonized = Array.from(mergedMap.values());
      if (finalHarmonized.length > 0) {
        setDynamicNews(finalHarmonized);
        cacheTop3Articles(finalHarmonized);
      } else {
        setDynamicNews(articles.filter(a => !isConvertedArticle(a)));
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('Error fetching live Google News:', err);
      setDynamicNews(articles.filter(a => !isConvertedArticle(a)));
    } finally {
      setIsLoadingNews(false);
      setIsRefreshing(false);
    }
  };

  // Load news dynamically whenever category or favorite interests change
  useEffect(() => {
    loadCategoryNews(true);

    // Automatic background refresh every 3 minutes (180,000 ms)
    const autoRefreshTimer = setInterval(() => {
      console.log('VOX Auto-refreshing news feed in background...');
      loadCategoryNews(false);
    }, 180000);

    return () => {
      clearInterval(autoRefreshTimer);
    };
  }, [selectedCategory, isOffline, favoriteCategories]);

  const displayArticles = isOffline
    ? (offlineArticles && offlineArticles.length > 0 ? offlineArticles : articles)
    : (dynamicNews.length > 0 ? dynamicNews : articles);

  // Pure news items feed (excluding user converted articles)
  const newsArticlesOnly = useMemo(() => {
    return displayArticles.filter(a => !isConvertedArticle(a));
  }, [displayArticles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Favoriler') {
      return displayArticles.filter(a => bookmarkedIds.includes(a.id));
    }
    if (selectedCategory === 'Dönüştürülenler') {
      return convertedArticles;
    }
    if (selectedCategory === 'Tümü') {
      return newsArticlesOnly;
    }
    return newsArticlesOnly.filter(a => a.category === selectedCategory || a.category === 'Gündem');
  }, [selectedCategory, displayArticles, convertedArticles, newsArticlesOnly, bookmarkedIds]);

  // Dynamic Featured Article ("Günün Öne Çıkanı") - Top Google News article
  const featuredArticle = useMemo(() => {
    return newsArticlesOnly[0] || displayArticles[0] || null;
  }, [newsArticlesOnly, displayArticles]);

  // Track scroll direction for hiding Header/Nav (Reader Mode)
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY.current + 10) {
        // Scrolling down -> hide Header and Nav for Reader Mode
        if (onScrollDirectionChange) onScrollDirectionChange(true);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 50) {
        // Scrolling up or top of page -> show Header and Nav
        if (onScrollDirectionChange) onScrollDirectionChange(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onScrollDirectionChange]);

  // Keyboard Escape listener for reading modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReadingArticle(null);
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Virtualization container reference
  const listParentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredArticles.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 110,
    overscan: 4,
  });

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-6 text-on-surface">
      {/* Top Header Bar & Zen Mode Quick Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Bülten & Haberler</h1>
          <p className="text-xs text-on-surface-variant">Yapay zeka ile kişiselleştirilmiş sesli bültenler</p>
        </div>
        <button
          onClick={() => {
            const nextZen = !isZenMode;
            setIsZenMode(nextZen);
            if (onScrollDirectionChange) onScrollDirectionChange(nextZen);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
            isZenMode 
              ? 'bg-primary text-on-primary border-primary shadow-[0_0_12px_rgba(78,222,163,0.4)]' 
              : 'bg-surface-container/80 text-on-surface-variant border-white/10 hover:border-white/20'
          }`}
          title="Okuma Modu (Sadece metne odaklan, gezinti menülerini gizle)"
        >
          {isZenMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isZenMode ? 'Okuma Modu: Açık' : 'Okuma Modu'}</span>
        </button>
      </div>

      {/* Offline Mode Alert Banner */}
      {isOffline && <OfflineBanner count={displayArticles.length} />}

      {/* Daily Streak Tracker Banner */}
      {streakInfo && <StreakWidget streakInfo={streakInfo} />}

      {/* Resume Listening Banner (Preferences / Storage persistent position) */}
      {resumeItem && resumeItem.article && (!currentArticle || currentArticle.id !== resumeItem.article.id) && (
        <ResumeBanner
          article={resumeItem.article}
          position={resumeItem.position}
          onResume={() => onResumePlayback && onResumePlayback(resumeItem.article, resumeItem.position)}
          onDismiss={() => onDismissResume && onDismissResume()}
        />
      )}

      {/* Category Pills Filter & Interest Selection Trigger */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-2 items-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(78,222,163,0.3)] font-bold'
                    : 'bg-surface-container/80 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowInterestsModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            title="Favori ilgi alanlarınızı seçin ve akışınızı özelleştirin"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>İlgi Alanlarım ({favoriteCategories.length})</span>
          </button>
        </div>


      </div>

      {/* Currently Playing Active Mini Player Bar */}
      {currentArticle && (
        <div className="bg-surface-container/90 border border-primary/30 p-3 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(78,222,163,0.15)] animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block">
                {isPlaying ? 'Şimdi Dinleniyor' : 'Duraklatıldı'}
              </span>
              <p className="text-xs font-medium truncate">{currentArticle.title}</p>
            </div>
          </div>
          <button
            onClick={() => onPlayArticle(currentArticle)}
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        </div>
      )}

      {/* Skeleton Loading State or Active News Cards */}
      {isLoadingNews ? (
        <div className="space-y-4 animate-fade-in" id="news-skeleton-loader">
          {/* Skeleton Hero Card */}
          <div className="rounded-2xl border border-white/10 bg-surface-container/60 p-4 space-y-3 animate-pulse">
            <div className="w-full h-44 bg-surface-container-high/80 rounded-xl"></div>
            <div className="h-3 w-28 bg-surface-container-high/80 rounded"></div>
            <div className="h-5 w-3/4 bg-surface-container-high/80 rounded"></div>
            <div className="h-3.5 w-full bg-surface-container-high/80 rounded"></div>
            <div className="h-3.5 w-2/3 bg-surface-container-high/80 rounded"></div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-8 w-28 bg-surface-container-high/80 rounded-full"></div>
              <div className="h-8 w-20 bg-surface-container-high/80 rounded-full"></div>
            </div>
          </div>

          {/* Skeleton List Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-surface-container-high/80 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-surface-container-high/80 rounded animate-pulse"></div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container/60 border border-white/10 p-3.5 rounded-2xl flex gap-3 items-center animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-surface-container-high/80 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/4 bg-surface-container-high/80 rounded"></div>
                  <div className="h-4 w-5/6 bg-surface-container-high/80 rounded"></div>
                  <div className="h-3 w-full bg-surface-container-high/80 rounded"></div>
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-2.5 w-20 bg-surface-container-high/80 rounded"></div>
                    <div className="h-6 w-16 bg-surface-container-high/80 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Daily Briefings Banner (Hero Card) */}
          {featuredArticle && selectedCategory === 'Tümü' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-on-surface">Günün Öne Çıkanı</h2>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI SENTEZ
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-card-border bg-surface-container shadow-sm group">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={sanitizeImageUrl(featuredArticle.imageUrl) || getTopicContextualImage(featuredArticle.title, featuredArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getTopicContextualImage(featuredArticle.title, featuredArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-primary border border-primary/30">
                    LIVE AUDIO
                  </div>

                  <div className="absolute bottom-3 right-3 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded text-white/80">
                    {Math.floor(featuredArticle.durationSeconds / 60)} dk
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    {featuredArticle.category} • {featuredArticle.author}
                  </span>
                  <h3 className="font-display text-base font-bold leading-snug text-on-surface">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {featuredArticle.summary}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => onPlayArticle(featuredArticle)}
                      className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Dinlemeye Başla</span>
                    </button>

                    <button
                      onClick={() => setReadingArticle(featuredArticle)}
                      className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-medium"
                    >
                      <span>Metni Oku</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Dönüştürülen İçerikler (YouTube, PDF, Web Bağlantıları) Horizontal Carousel */}
          {selectedCategory === 'Tümü' && convertedArticles.length > 0 && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-bold text-on-surface flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Dönüştürülen İçerikleriniz</span>
                  </h2>
                  <span className="bg-primary/20 text-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-primary/30">
                    {convertedArticles.length}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory('Dönüştürülenler')}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <span>Tümünü Gör</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {convertedArticles.map((art) => (
                  <div
                    key={art.id}
                    className="w-64 shrink-0 snap-start bg-surface-container border border-card-border hover:border-primary/50 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {art.sourceType === 'youtube' && (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                            <Youtube className="w-3 h-3" /> YouTube
                          </span>
                        )}
                        {art.sourceType === 'pdf' && (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                        )}
                        {art.sourceType === 'web' && (
                          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Web
                          </span>
                        )}
                        {art.sourceType === 'text' && (
                          <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Metin
                          </span>
                        )}
                        {art.sourceType !== 'youtube' && art.sourceType !== 'pdf' && art.sourceType !== 'web' && art.sourceType !== 'text' && (
                          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            {art.category || 'Dönüştürülen'}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-on-surface-variant">
                        {Math.floor((art.durationSeconds || 180) / 60)}m
                      </span>
                    </div>

                    <h4 
                      onClick={() => setReadingArticle(art)}
                      className="font-bold text-xs line-clamp-2 text-on-surface group-hover:text-primary transition-colors cursor-pointer leading-snug"
                    >
                      {art.title}
                    </h4>

                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-card-border">
                      <button
                        onClick={() => setReadingArticle(art)}
                        className="text-[10px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-medium"
                      >
                        <BookOpen className="w-3 h-3 text-primary" />
                        <span>Metni Oku</span>
                      </button>
                      <button
                        onClick={() => onPlayArticle(art)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Dinle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State when Dönüştürülenler category is selected and list is empty */}
          {selectedCategory === 'Dönüştürülenler' && convertedArticles.length === 0 && (
            <div className="bg-surface-container/60 border border-white/10 rounded-2xl p-6 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm">Henüz Dönüştürülmüş İçerik Bulunmuyor</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                YouTube videoları, PDF belgeleri veya Web makale bağlantılarını ekranın altındaki <b>(+)</b> butonuna basarak anında dinlenebilir sesli bültene dönüştürebilirsiniz.
              </p>
            </div>
          )}

      {/* VIRTUALIZED NEWS FEED STREAM */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold">
              {selectedCategory === 'Dönüştürülenler' ? 'Dönüştürülen İçerik Listeniz' : 'Haber Akışı'}
            </h2>
            {selectedCategory !== 'Dönüştürülenler' && !isOffline && (
              <button
                onClick={() => loadCategoryNews(false)}
                disabled={isRefreshing}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                title="Haber akışını güncel verilerle yenile"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            )}
          </div>
          <span className="text-xs font-mono text-on-surface-variant">{filteredArticles.length} makale</span>
        </div>

        {/* Scrollable container for virtual rendering */}
        <div ref={listParentRef} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const article = filteredArticles[virtualRow.index];
              if (!article) return null;
              const isBookmarked = bookmarkedIds.includes(article.id);

              return (
                <div
                  key={article.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <div className="bg-surface-container border border-card-border p-3.5 rounded-2xl flex gap-3 items-center hover:border-primary/40 transition-all shadow-sm">
                    {/* Thumbnail */}
                    <div 
                      onClick={() => setReadingArticle(article)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-variant flex flex-col items-center justify-center p-2 text-primary border border-card-border cursor-pointer"
                    >
                      {article.imageUrl ? (
                        <img
                          src={sanitizeImageUrl(article.imageUrl)}
                          alt={article.title}
                          className="w-full h-full object-cover opacity-90 absolute inset-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          {article.sourceType === 'youtube' ? (
                            <Youtube className="w-6 h-6 text-red-500 mb-1" />
                          ) : article.sourceType === 'pdf' ? (
                            <FileText className="w-6 h-6 text-amber-500 mb-1" />
                          ) : article.sourceType === 'web' ? (
                            <Link2 className="w-6 h-6 text-blue-500 mb-1" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-primary mb-1 opacity-80" />
                          )}
                          <span className="text-[9px] font-mono font-bold text-on-surface-variant truncate max-w-full">
                            {article.category || 'Dönüştürülen'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-primary">
                        {Math.floor((article.durationSeconds || 180) / 60)}m
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {article.sourceType === 'youtube' ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                              <Youtube className="w-3 h-3" /> YouTube
                            </span>
                          ) : article.sourceType === 'pdf' ? (
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <FileText className="w-3 h-3" /> PDF
                            </span>
                          ) : article.sourceType === 'web' ? (
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                              <Link2 className="w-3 h-3" /> Web Bağlantısı
                            </span>
                          ) : article.sourceType === 'text' ? (
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <FileText className="w-3 h-3" /> Metin
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              {(() => {
                                const cat = article.category || 'Gündem';
                                if (cat.length > 18 || (cat.includes(' ') && !['Kültür & Sanat', 'Etik & Bilim'].includes(cat))) {
                                  if (cat.toLowerCase().includes('teknoloji')) return 'Teknoloji';
                                  if (cat.toLowerCase().includes('ekonomi') || cat.toLowerCase().includes('finans')) return 'Ekonomi';
                                  if (cat.toLowerCase().includes('dünya') || cat.toLowerCase().includes('dunya')) return 'Dünya';
                                  if (cat.toLowerCase().includes('kültür') || cat.toLowerCase().includes('kultur')) return 'Kültür & Sanat';
                                  return 'Gündem';
                                }
                                return cat;
                              })()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(article.id);
                          }}
                          className={`p-1 rounded-full transition-all active:scale-90 ${
                            isBookmarked 
                              ? 'text-primary bg-primary/10 border border-primary/30 shadow-sm' 
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                          }`}
                          title={isBookmarked ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary' : ''}`} />
                        </button>
                      </div>

                      <h4 
                        onClick={() => setReadingArticle(article)}
                        className="font-display text-xs font-bold truncate text-on-surface cursor-pointer hover:text-primary transition-colors"
                      >
                        {sanitizeText(article.title)}
                      </h4>

                      <p className="text-[11px] text-on-surface-variant line-clamp-1">
                        {sanitizeText(article.summary)}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-on-surface-variant border-t border-card-border">
                        <span className="truncate max-w-[90px] font-medium">{article.author || 'VOX AI'}</span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setReadingArticle(article)}
                            className="bg-surface-variant hover:bg-surface-container-high text-on-surface border border-card-border px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-[10px] transition-colors"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-primary" />
                            <span>Metni Oku</span>
                          </button>

                          {!isOffline && (
                            <button
                              onClick={() => onPlayArticle(article)}
                              className="bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 active:scale-95 transition-transform text-[10px]"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Dinle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAGINATION / LOAD MORE CURSOR TRIGGER */}
        {hasMore && onLoadMore && (
          <div className="pt-2 text-center">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full py-3 px-4 bg-surface-container border border-white/10 hover:border-white/20 text-on-surface rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Daha Fazla Bülten Yükleniyor...</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-primary" />
                  <span>Daha Fazla Bülten Yükle (Sayfalama)</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>
      </>
      )}

      {/* Reader Detail Modal with Karaoke Word Highlighting */}
      {readingArticle && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-4 md:p-6 overflow-y-auto overscroll-contain animate-fade-in flex flex-col justify-between max-w-md mx-auto text-on-surface"
          style={{ touchAction: 'pan-y' }}
          onWheel={(e) => {
            e.currentTarget.scrollTop += e.deltaY;
          }}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {readingArticle.category}
                </span>
                <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  KARAOKE CANLI TAKİP
                </span>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="text-xs font-bold text-on-surface-variant hover:text-on-surface bg-white/10 px-3 py-1.5 rounded-full"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold leading-tight">
                {readingArticle.title}
              </h1>
              <p className="text-xs text-on-surface-variant">
                Yazar: {readingArticle.author || 'VOX AI Editor'} • {Math.floor(readingArticle.durationSeconds / 60)} dakika dinleme süresi
              </p>
            </div>

            {readingArticle.imageUrl && (
              <img
                src={sanitizeImageUrl(readingArticle.imageUrl)}
                alt={readingArticle.title}
                className="w-full h-44 rounded-2xl object-cover border border-white/10"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getTopicContextualImage(readingArticle.title, readingArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            )}

            <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">Yapay Zeka Özeti</span>
              <p className="text-xs leading-relaxed text-on-surface font-medium">{readingArticle.summary}</p>
            </div>

            {/* Karaoke Script Body with Highlighted Active Word */}
            <div className="space-y-4 bg-surface-container/80 border border-white/10 p-5 rounded-2xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SESLİ ANLATIM METNİ (EŞZAMANLI VURGU)
              </span>

              <div className="text-sm leading-relaxed text-on-surface space-y-3 font-sans">
                {readingArticle.content.split(' ').map((word, idx) => {
                  const isActive = isPlaying && currentArticle?.id === readingArticle.id && (idx === currentWordIndex || (currentWordIndex > 0 && Math.abs(idx - currentWordIndex) <= 1));
                  return (
                    <span
                      key={idx}
                      className={`inline-block mr-1.5 transition-colors duration-200 ${
                        isActive
                          ? 'text-emerald-400 font-extrabold bg-emerald-500/20 px-1 py-0.5 rounded border border-emerald-400/40 shadow-[0_0_10px_rgba(78,222,163,0.4)] scale-105'
                          : 'text-on-surface/90 hover:text-white'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>

            {readingArticle.keyPoints && (
              <div className="bg-surface-container p-4 rounded-2xl space-y-2 border border-white/10">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Öne Çıkan Başlıklar</span>
                <ul className="list-disc list-inside space-y-1 text-xs text-on-surface-variant">
                  {readingArticle.keyPoints.map((kp, idx) => (
                    <li key={idx}>{kp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/10 flex gap-3 mt-6">
            {isOffline ? (
              <button
                disabled
                className="flex-1 bg-surface-container text-zinc-400 py-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 border border-white/10 cursor-not-allowed opacity-80"
              >
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>Çevrimdışı Okuma Modu (Dinleme Devre Dışı)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onPlayArticle(readingArticle);
                }}
                className="flex-1 bg-primary text-on-primary py-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(78,222,163,0.3)] active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isPlaying && currentArticle?.id === readingArticle.id ? 'Seslendirmeyi Duraklat' : 'Karaoke Modunda Oku & Dinle'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* FAVORITE INTERESTS CUSTOMIZATION MODAL */}
      {showInterestsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowInterestsModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white p-1 rounded-full bg-surface-container-high/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center pt-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold">İlgi Alanlarımı Yönet</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Seçtiğiniz kategorilere göre güncel Türkçe haber akışınız otomatik olarak kişiselleştirilir.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto py-1">
              {ALL_AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = favoriteCategories.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleFavoriteCategory(interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(78,222,163,0.3)]'
                        : 'bg-surface-container-high/80 text-on-surface-variant hover:bg-surface-container-highest border border-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowInterestsModal(false);
                  loadCategoryNews(true);
                }}
                className="w-full bg-primary text-on-primary py-3 rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-[0_0_15px_rgba(78,222,163,0.3)]"
              >
                Kaydet ve Akışı Yenile ({favoriteCategories.length} Seçili)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
