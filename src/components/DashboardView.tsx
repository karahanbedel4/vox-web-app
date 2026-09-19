import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Cpu, Coins, RefreshCw, BookOpen, Lock, Sparkles, ChevronRight, Play, Bookmark, Search, X, Globe, ArrowUp, ChevronDown, Send, Radio, Zap, Clock } from 'lucide-react';
import { Article } from '../types';
import { fetchNewsByCategory, searchGoogleNews, checkNewNewsUpdates, getTopicContextualImage, sanitizeImageUrl, DEFAULT_VOX_FALLBACK_IMAGE, getArticleUrl, sanitizeNewsText, isDummyArticle, calculateReadingTime } from '../lib/newsService';
import { getArticlesPaginated } from '../lib/firebase';
import { cacheTop3Articles } from '../lib/offlineService';
import { useTheme } from '../lib/ThemeContext';
import { INITIAL_ARTICLES } from '../data/defaultArticles';
import { VoxLogo } from './VoxLogo';
import { XLogoIcon } from './XLogoIcon';
import { NativeAdCard } from './NativeAdCard';
import { FeaturedNewsSlider } from './FeaturedNewsSlider';
import { AiSeoKnowledgeSection } from './AiSeoKnowledgeSection';

export type CategoryType = 'Tümü' | 'Gündem' | 'Ekonomi' | 'Teknoloji' | 'Spor' | 'Dünya' | 'Sağlık';

interface DashboardViewProps {
  category?: CategoryType;
  articles: Article[];
  bookmarkedIds: string[];
  onToggleBookmark: (articleId: string) => void;
  onSelectArticle: (article: Article) => void;
  onOpenPaywall: (reason?: 'limit_reached' | 'pages_exceeded' | 'not_logged_in') => void;
}


function formatTwitterAuthor(author?: string): string {
  if (!author) return 'Özet Geç Haber';
  const a = author.trim();
  const aLower = a.toLowerCase();
  if (aLower.includes('ozetgechaber') || aLower.includes('özet geç')) return 'Özet Geç Haber';
  if (aLower.includes('conflicttr') || aLower.includes('conflict tr')) return 'Conflict TR';
  if (aLower.includes('vaziyet')) return 'Vaziyet';
  return a.replace(/^@/, '') || 'Özet Geç Haber';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  category = 'Tümü',
  articles,
  bookmarkedIds,
  onToggleBookmark,
  onSelectArticle,
  onOpenPaywall
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleArticleCardClick = (art: Article) => {
    if (art.sourceType === 'twitter' || art.sourceType === 'telegram') {
      onSelectArticle(art);
    } else {
      navigate(getArticleUrl(art));
    }
  };
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    (category as CategoryType) || 'Tümü'
  );
  const [liveNews, setLiveNews] = useState<Article[]>(() => {
    try {
      const cached = localStorage.getItem('vox_cached_articles');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(a => !isDummyArticle(a));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('vox_cached_articles');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.filter(a => !isDummyArticle(a)).length > 0) return false;
      }
    } catch (e) {}
    return true;
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pagination / Infinite scroll state
  const [visibleCount, setVisibleCount] = useState<number>(14);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Live real-time incoming articles indicator
  const [newArticlesCount, setNewArticlesCount] = useState<number>(0);
  const [latestTimestamp, setLatestTimestamp] = useState<string>('');

  // Search filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleSearchResults, setGoogleSearchResults] = useState<Article[] | null>(null);

  const loadCategoryArticles = async (showFullLoader = true) => {
    if (showFullLoader && liveNews.length === 0) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const liveFetched = await fetchNewsByCategory(activeCategory, 'tr', 100);
      const firestoreRes = await getArticlesPaginated(25, null, activeCategory === 'Tümü' ? undefined : activeCategory);
      const firestoreList = (firestoreRes.articles || []).filter(a => !isDummyArticle(a));

      const mergedMap = new Map<string, Article>();

      if (liveFetched && liveFetched.length > 0) {
        liveFetched.forEach(a => {
          if (a.title && !isDummyArticle(a)) mergedMap.set(a.title.toLowerCase().trim(), a);
        });
      }

      firestoreList.forEach(a => {
        if (a.title && !mergedMap.has(a.title.toLowerCase().trim())) {
          mergedMap.set(a.title.toLowerCase().trim(), a);
        }
      });

      const finalArticles = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      if (finalArticles.length > 0) {
        setLiveNews(finalArticles);
        cacheTop3Articles(finalArticles);
        try {
          localStorage.setItem('vox_cached_articles', JSON.stringify(finalArticles.slice(0, 50)));
        } catch (e) {}
        if (finalArticles[0]?.createdAt) {
          setLatestTimestamp(finalArticles[0].createdAt);
        }
      } else {
        const fallbackList = articles.filter(a => !isDummyArticle(a) && (activeCategory === 'Tümü' || a.category === activeCategory));
        if (fallbackList.length > 0) setLiveNews(fallbackList);
      }
      setNewArticlesCount(0);
    } catch (e) {
      console.warn('DashboardView fetch error:', e);
      const fallbackList = articles.filter(a => !isDummyArticle(a) && (activeCategory === 'Tümü' || a.category === activeCategory));
      if (fallbackList.length > 0) setLiveNews(fallbackList);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load & category change
  useEffect(() => {
    setGoogleSearchResults(null);
    setVisibleCount(14);
    setNewArticlesCount(0);
    loadCategoryArticles(true);
  }, [activeCategory]);

  // Dynamic SEO & Title updates for Category Changes on Client
  useEffect(() => {
    let pageTitle = 'Son Dakika Haber & Gündem Haberleri - En Son Haber Özetleri | VOX';
    let pageDesc = 'Son dakika haber, haber gündem, TRT Haber gündem, A Haber gündem, Haber 7 ve en son haber başlıklarını yapay zeka ile hap özetler halinde sesli dinleyin ve okuyun.';
    let pageKeywords = 'haber gündem, trt haber gündem, a haber gündem, haber, haber 7, son dakika haber, en son haber, internet haber, spor haber, türkiye gündemi son dakika';

    if (activeCategory === 'Spor') {
      pageTitle = 'Son Dakika Spor Haberleri & Canlı Spor TV | VOX Spor';
      pageDesc = 'Son dakika spor haber, transfer gelişmeleri, Süper Lig özetleri ve HT Spor, A Spor, beIN SPORTS HABER ile TJK TV canlı yayınları tek ekranda.';
      pageKeywords = 'spor haber, son dakika spor haberleri, transfer haberleri, canlı spor tv, maç özetleri, tjk tv at yarışı, a spor canlı';
    } else if (activeCategory === 'Ekonomi') {
      pageTitle = 'Ekonomi Haberleri & Borsa Gündemi - Canlı Piyasa | VOX Ekonomi';
      pageDesc = 'Son dakika ekonomi haberleri, Borsa İstanbul, altın fiyatları, dolar kuru ve küresel piyasaları yapay zeka özetleriyle takip edin.';
      pageKeywords = 'ekonomi haberleri, borsa istanbul, bIST 100, altın fiyatları, dolar kuru, ekonomi gündem, faiz kararı';
    } else if (activeCategory === 'Teknoloji') {
      pageTitle = 'Teknoloji Haberleri & Yapay Zeka Gündemi | VOX Teknoloji';
      pageDesc = 'Son dakika teknoloji haberleri, yapay zeka gelişmeleri, ChatGPT, Gemini, Apple ve Google son dakika teknoloji gündemi.';
      pageKeywords = 'teknoloji haberleri, yapay zeka, openai, gemini, apple haberleri, teknoloji gündem';
    }

    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDesc);
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', pageKeywords);
  }, [activeCategory]);

  // Background check for new incoming articles (every 30 seconds)
  useEffect(() => {
    if (!latestTimestamp || googleSearchResults !== null) return;

    const checkInterval = setInterval(async () => {
      try {
        const check = await checkNewNewsUpdates(activeCategory, latestTimestamp);
        if (check.hasNew && check.count > 0) {
          setNewArticlesCount(check.count);
        }
      } catch (e) {}
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [latestTimestamp, activeCategory, googleSearchResults]);

  // IntersectionObserver for seamless Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading]);

  // Handle Google News Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) {
      setGoogleSearchResults(null);
      return;
    }

    setIsSearchingGoogle(true);
    try {
      const results = await searchGoogleNews(clean);
      setGoogleSearchResults(results);
    } catch (err) {
      console.warn('Search submit error:', err);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setGoogleSearchResults(null);
  };

  // Apply new live articles and scroll to top
  const handleApplyNewArticles = () => {
    loadCategoryArticles(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute displayed list based on search or category filter
  const displayList = useMemo(() => {
    if (googleSearchResults !== null) {
      return googleSearchResults;
    }

    let list = liveNews.length > 0 ? liveNews : articles;

    // Apply active category filter
    if (activeCategory && activeCategory !== 'Tümü') {
      const targetCat = activeCategory.trim().toLowerCase();
      const filtered = list.filter(a => {
        const cat = (a.category || '').trim().toLowerCase();
        return cat === targetCat || (targetCat === 'gündem' && (!cat || cat === 'genel' || cat === 'haberler'));
      });
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    // Apply local query search filter if user typed without submitting
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [googleSearchResults, liveNews, articles, activeCategory, searchQuery]);

  const isSearchActive = Boolean(searchQuery.trim() || googleSearchResults !== null);
  const showFeaturedSlider = !isSearchActive && displayList.length >= 3;

  const streamArticles = useMemo(() => {
    const startIdx = showFeaturedSlider ? 3 : 0;
    return displayList.slice(startIdx, startIdx + visibleCount).map(art => ({
      ...art,
      title: sanitizeNewsText(art.title),
      summary: sanitizeNewsText(art.summary),
      author: sanitizeNewsText(art.author)
    }));
  }, [displayList, visibleCount, showFeaturedSlider]);

  const hasMore = showFeaturedSlider
    ? (3 + visibleCount < displayList.length)
    : (visibleCount < displayList.length);

  const remainingCount = showFeaturedSlider
    ? Math.max(0, displayList.length - 3 - visibleCount)
    : Math.max(0, displayList.length - visibleCount);

  const isHotNews = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    return diffMins <= 25;
  };

  return (
    <div className={`p-3.5 sm:p-5 md:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-5 transition-colors duration-300 ${
      theme === 'light' ? 'text-slate-800' : 'text-gray-200'
    }`}>
      {/* HEADER TITLE BAR WITH COMPACT SEARCH & REFRESH */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-3.5 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-white/5 border-white/10 text-white'
          }`}>
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-950' : 'text-white'
            }`}>
              <span>Haber Akışı</span>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                theme === 'light'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-white/10 text-zinc-300 border-white/10'
              }`}>
                {displayList.length} Haber
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Canlı
              </span>
            </h1>
            <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
              Anlık son dakika haberleri, tarafsız kaynaklar ve yapay zeka ile özet akış
            </p>
          </div>
        </div>

        {/* RIGHT: COMPACT SEARCH INPUT & REFRESH BUTTON */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto">
          <form 
            onSubmit={handleSearchSubmit} 
            className="relative flex-1 md:w-64 focus-within:md:w-72 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Haberlerde ara..."
              className={`w-full rounded-xl pl-8 pr-8 py-2 text-xs focus:outline-none transition-all shadow-inner ${
                theme === 'light'
                  ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  : 'bg-[#141715] border border-white/10 text-white placeholder-gray-500 focus:border-white/30'
              }`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          <button
            onClick={() => loadCategoryArticles(false)}
            disabled={isRefreshing}
            className={`border px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
            }`}
            title="Haberleri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      {/* PILL TABS CATEGORY FILTER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['Tümü', 'Gündem', 'Ekonomi', 'Teknoloji', 'Spor', 'Dünya', 'Sağlık'] as const).map(tab => {
          const isActive = activeCategory === tab && googleSearchResults === null;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveCategory(tab);
                setGoogleSearchResults(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? theme === 'light'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : 'bg-white text-slate-900 shadow-sm font-bold'
                  : theme === 'light'
                    ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {tab === 'Tümü' && '🌐 '}
              {tab === 'Gündem' && '⚡ '}
              {tab === 'Ekonomi' && '📈 '}
              {tab === 'Teknoloji' && '💻 '}
              {tab === 'Spor' && '⚽ '}
              {tab === 'Dünya' && '🌍 '}
              {tab === 'Sağlık' && '🏥 '}
              {tab}
            </button>
          );
        })}

        {googleSearchResults !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            theme === 'light'
              ? 'bg-slate-100 text-slate-800 border-slate-300'
              : 'bg-white/10 text-zinc-200 border-white/15'
          }`}>
            <span>Arama Sonuçları ({googleSearchResults.length})</span>
            <button onClick={handleClearSearch} className="hover:opacity-75 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* FLOATING REAL-TIME NEW ARTICLES NOTIFICATION PILL */}
      {newArticlesCount > 0 && (
        <div className="sticky top-20 z-30 flex justify-center">
          <button
            onClick={handleApplyNewArticles}
            className={`font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs transition-all transform hover:scale-105 active:scale-95 cursor-pointer border ${
              theme === 'light'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-white text-slate-900 border-zinc-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{newArticlesCount} Yeni Haber Geldi — Akışı Güncelle</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SKELETON LOADER WITH LIVE RADAR SCANNER */}
      {isLoading || isSearchingGoogle ? (
        <div className="space-y-3.5">
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            theme === 'light'
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-white/[0.03] border-white/10 text-zinc-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-500 relative z-10" />
              </div>
              <div>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <span>VOX Canlı Akış Taranıyor...</span>
                  <span className="text-[10px] font-normal opacity-75">(Son dakika gelişmeleri)</span>
                </p>
                <p className="text-[11px] opacity-75">TRT, NTV, Habertürk ve canlı kaynak akışları kontrol ediliyor...</p>
              </div>
            </div>
            <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between gap-3.5 animate-pulse ${
                theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#141715] border border-white/5'
              }`}>
                <div className={`w-full aspect-[16/10] rounded-xl shrink-0 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                <div className="space-y-2.5">
                  <div className={`h-3 w-28 rounded ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                  <div className={`h-5 w-4/5 rounded ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                  <div className={`h-3.5 w-full rounded ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                  <div className={`h-8 w-24 rounded-xl ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                  <div className={`h-8 w-24 rounded-xl ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : displayList.length === 0 ? (
        <div className={`text-center py-16 rounded-3xl space-y-3 ${
          theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#141715] border border-white/5'
        }`}>
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className={`text-base font-bold ${theme === 'light' ? 'text-slate-800' : 'text-gray-300'}`}>Haber Bulunamadı</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Arama kriterinize veya seçilen kategoriye uygun haber şu anda mevcut değil. Lütfen başka bir kelime ile arama yapın.
          </p>
        </div>
      ) : (
        /* NEWS COHESIVE GRID VIEW WITH PROGRESSIVE INFINITE SCROLL & NATIVE ADS */
        <div className="space-y-4 sm:space-y-5">
          {/* BUNDLE-STYLE 3-ITEM FEATURED SLIDER AT THE TOP OF NEWS STREAM */}
          {showFeaturedSlider && (
            <div className="space-y-3 sm:space-y-4">
              <FeaturedNewsSlider
                articles={displayList.slice(0, 9)}
                onSelectArticle={handleArticleCardClick}
              />

              {/* SPONSORED MONETIZATION BANNER (Between Featured Slider & Remaining Stream) */}
              <NativeAdCard variant="banner" className="my-1" />

              {/* SECTION HEADING FOR THE STREAM ARTICLES STARTING FROM ITEM 3+ */}
              <div className="flex items-center justify-between pt-2 pb-1 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className={`text-sm sm:text-base font-black tracking-tight ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {activeCategory === 'Tümü' ? 'Son Dakika & Güncel Akış' : `${activeCategory} Gelişmeleri`}
                  </h2>
                </div>
                <span className={`text-xs font-mono font-bold ${
                  theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  {Math.max(0, displayList.length - 3)} Haber
                </span>
              </div>
            </div>
          )}

          {isSearchActive && (
            <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5">
              <h2 className={`text-sm sm:text-base font-bold tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                Arama Sonuçları ({displayList.length})
              </h2>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {streamArticles.map((article, index) => {
              const isBookmarked = bookmarkedIds.includes(article.id);
              const readingTime = calculateReadingTime(article);
              // Native AdCard inserted every 6 articles for organic monetization
              const isFeedReady = !isLoading && !isSearchingGoogle && displayList.length > 0;
              const showAd = isFeedReady && (index + 1) % 6 === 0;

              return (
                <React.Fragment key={article.id}>
                  <div
                    className={`p-4 sm:p-4.5 rounded-2xl flex flex-col justify-between gap-3.5 transition-all duration-200 group border shadow-sm hover:shadow-md ${
                      theme === 'light'
                        ? 'bg-white border-slate-200/90 hover:border-slate-300'
                        : 'bg-[#141715] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Enlarged Editorial Thumbnail Image */}
                    <div
                      onClick={() => handleArticleCardClick(article)}
                      className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/5 cursor-pointer group-hover:scale-[1.01] transition-transform"
                    >
                      <img
                        src={sanitizeImageUrl(article.imageUrl) || getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE}
                        alt={article.title}
                        className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 shadow-sm">
                          {article.sourceType === 'twitter' ? '𝕏 Canlı Akış' : article.sourceType === 'telegram' ? 'Telegram Canlı' : (article.category || activeCategory)}
                        </span>

                        {article.sourceType === 'twitter' && (
                          <span className="text-[10px] font-bold text-white bg-black/85 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/15 shadow-sm">
                            <XLogoIcon className="w-2.5 h-2.5 text-zinc-300" />
                            <span>𝕏</span>
                          </span>
                        )}
                        {article.sourceType === 'telegram' && (
                          <span className="text-[10px] font-bold text-white bg-[#229ED9]/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
                            <Send className="w-2.5 h-2.5 text-white" />
                            <span>TG</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Badges */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-semibold text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/15 shadow-sm">
                          <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{readingTime} dk okuma</span>
                        </span>

                        {isHotNews(article.createdAt) && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/85 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/30 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Son Dakika</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* News Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                      <div className="space-y-2">
                        {/* Author & Bookmark */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {article.sourceType === 'twitter' ? (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border truncate ${
                                theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-zinc-300'
                              }`}>
                                <XLogoIcon className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{formatTwitterAuthor(article.author)}</span>
                              </span>
                            ) : article.sourceType === 'telegram' ? (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border truncate ${
                                theme === 'light' ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-[#229ED9]/10 border-[#229ED9]/20 text-[#229ED9]'
                              }`}>
                                <Send className="w-3 h-3 text-[#229ED9] shrink-0" />
                                <span className="truncate">{article.author}</span>
                              </span>
                            ) : (
                              <span className={`text-xs font-medium truncate block ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                                {article.author || 'Anadolu Ajansı'}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPaywall('limit_reached');
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                              isBookmarked 
                                ? 'text-amber-500 bg-amber-500/10' 
                                : theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-gray-500 hover:text-gray-300'
                            }`}
                            title="Haberleri kaydetmek için VOX uygulamasını indirin"
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>

                        {/* Article Headline */}
                        <h3
                          onClick={() => handleArticleCardClick(article)}
                          className={`font-display text-base sm:text-lg font-bold group-hover:text-emerald-500 transition-colors cursor-pointer leading-snug line-clamp-2 ${
                            theme === 'light' ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {article.title}
                        </h3>

                        {/* Article Summary */}
                        <p className={`text-xs sm:text-[13px] line-clamp-2 leading-relaxed ${
                          theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                        }`}>
                          {article.summary}
                        </p>
                      </div>

                      {/* Card Action Buttons Row */}
                      <div className={`pt-3 flex items-center justify-between gap-2 border-t ${
                        theme === 'light' ? 'border-slate-100' : 'border-white/5'
                      }`}>
                        <button
                          onClick={() => handleArticleCardClick(article)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            theme === 'light'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                              : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Haberi Oku</span>
                        </button>

                        <button
                          onClick={() => onOpenPaywall('limit_reached')}
                          className={`font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border ${
                            theme === 'light'
                              ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                              : 'bg-white hover:bg-zinc-100 text-slate-950 border-white'
                          }`}
                          title="Sesli dinlemek için iOS uygulamasını indirin"
                        >
                          <span> Dinle</span>
                          <Lock className="w-3 h-3 opacity-80" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* In-Feed Native Ad spanning both columns in grid */}
                  {showAd && (
                    <div className="col-span-1 sm:col-span-2">
                      <NativeAdCard key={`ad-feed-${article.id}-${index}`} variant="feed" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* INFINITE SCROLL SENTINEL & LOAD MORE BUTTON */}
          <div ref={observerTarget} className="py-6 text-center">
            {hasMore ? (
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 mx-auto cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                    : 'bg-[#161c23] hover:bg-[#1f2730] text-gray-200 border-white/10 shadow-sm'
                }`}
              >
                <span>Daha Fazla Haber Göster ({remainingCount} kalan)</span>
                <ChevronDown className="w-4 h-4 text-emerald-400" />
              </button>
            ) : (
              <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                Tüm güncel haberler listelendi ({displayList.length} haber).
              </p>
            )}
          </div>

          {/* AI & GOOGLE SEO KNOWLEDGE SECTION */}
          <AiSeoKnowledgeSection pageContext={activeCategory === 'Spor' ? 'spor' : 'gundem'} />
        </div>
      )}
    </div>
  );
};

