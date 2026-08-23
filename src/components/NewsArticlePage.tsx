import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  Volume2, 
  Play, 
  Pause, 
  Clock, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Send, 
  Headphones,
  Newspaper,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { Article } from '../types';
import { useTheme } from '../lib/ThemeContext';
import { ttsService } from '../lib/ttsService';
import { sanitizeImageUrl, getTopicContextualImage, DEFAULT_VOX_FALLBACK_IMAGE, getArticleUrl, generateArticleSlug, fetchNewsByCategory } from '../lib/newsService';
import { NativeAdCard } from './NativeAdCard';
import { INITIAL_ARTICLES } from '../data/defaultArticles';

interface NewsArticlePageProps {
  articles: Article[];
  bookmarkedIds: string[];
  onToggleBookmark: (article: Article) => void;
  onPlayArticle: (article: Article) => void;
  onOpenPaywall?: (reason?: 'limit_reached' | 'pages_exceeded' | 'not_logged_in') => void;
}

export const NewsArticlePage: React.FC<NewsArticlePageProps> = ({
  articles,
  bookmarkedIds,
  onToggleBookmark,
  onPlayArticle,
  onOpenPaywall
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync TTS playback status
  useEffect(() => {
    const checkState = () => {
      const state = ttsService.getState();
      if (article && state.currentArticle?.id === article.id && state.isPlaying) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };
    checkState();
    const interval = setInterval(checkState, 500);
    return () => clearInterval(interval);
  }, [article]);

  // Update document title, meta tags, and JSON-LD for SEO on client-side
  useEffect(() => {
    if (!article) return;

    const fullTitle = `${article.title} | VOX`;
    document.title = fullTitle;

    const desc = article.summary || article.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && article.imageUrl) ogImg.setAttribute('content', article.imageUrl);

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', window.location.href);

    // Inject/update JSON-LD structured data for Google News
    let scriptTag = document.getElementById('vox-news-schema') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'vox-news-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': desc,
      'image': [article.imageUrl || 'https://voxozet.com/og-image.png'],
      'datePublished': article.createdAt || new Date().toISOString(),
      'dateModified': article.createdAt || new Date().toISOString(),
      'author': [{
        '@type': 'Person',
        'name': article.author || 'VOX'
      }],
      'publisher': {
        '@type': 'Organization',
        'name': 'VOX',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://voxozet.com/logo.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': window.location.href
      }
    });

    return () => {
      document.title = 'VOX | Oku, Dinle, Odaklan';
      const defaultDesc = 'Daha az oku. Daha çok dinle. Daha iyi odaklan.';
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
      if (ogTitle) ogTitle.setAttribute('content', 'VOX | Oku, Dinle, Odaklan');
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc);
      if (canonicalLink) canonicalLink.setAttribute('href', 'https://voxozet.com/');
    };
  }, [article]);

  // Find or fetch the article based on URL slug or ID
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsLoading(true);

    if (!slug) {
      setIsLoading(false);
      return;
    }

    const cleanSlug = slug.toLowerCase();

    // 1. Check in passed articles prop
    let found = articles.find(a => {
      const itemSlug = generateArticleSlug(a.title, a.id).toLowerCase();
      const rawId = a.id.toLowerCase();
      return itemSlug === cleanSlug || cleanSlug.includes(rawId) || rawId.includes(cleanSlug);
    });

    // 2. Check in localStorage cache
    if (!found) {
      try {
        const cachedRaw = localStorage.getItem('vox_cached_articles');
        if (cachedRaw) {
          const cachedList: Article[] = JSON.parse(cachedRaw);
          found = cachedList.find(a => {
            const itemSlug = generateArticleSlug(a.title, a.id).toLowerCase();
            const rawId = a.id.toLowerCase();
            return itemSlug === cleanSlug || cleanSlug.includes(rawId) || rawId.includes(cleanSlug);
          });
        }
      } catch (e) {}
    }

    // 3. Check in default static articles
    if (!found) {
      found = INITIAL_ARTICLES.find(a => {
        const itemSlug = generateArticleSlug(a.title, a.id).toLowerCase();
        const rawId = a.id.toLowerCase();
        return itemSlug === cleanSlug || cleanSlug.includes(rawId) || rawId.includes(cleanSlug);
      });
    }

    // 4. If still not found, fetch from server API
    if (!found) {
      fetch(`/api/news/article/${encodeURIComponent(cleanSlug)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.article) {
            setArticle(data.article);
            loadRelated(data.article);
          } else {
            // Fallback to first available or initial
            const fb = articles[0] || INITIAL_ARTICLES[0];
            setArticle(fb || null);
            if (fb) loadRelated(fb);
          }
        })
        .catch(() => {
          const fb = articles[0] || INITIAL_ARTICLES[0];
          setArticle(fb || null);
          if (fb) loadRelated(fb);
        })
        .finally(() => setIsLoading(false));
    } else {
      setArticle(found);
      loadRelated(found);
      setIsLoading(false);
    }
  }, [slug, articles]);

  const loadRelated = async (current: Article) => {
    const cat = current.category || 'Gündem';
    const sameCategory = articles.filter(a => a.id !== current.id && a.category === cat);
    if (sameCategory.length >= 4) {
      setRelatedArticles(sameCategory.slice(0, 5));
    } else {
      try {
        const liveItems = await fetchNewsByCategory(cat, 'tr', 10);
        const filtered = (liveItems || []).filter(a => a.id !== current.id);
        setRelatedArticles(filtered.slice(0, 5));
      } catch (e) {
        setRelatedArticles(articles.filter(a => a.id !== current.id).slice(0, 5));
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    const shareUrl = window.location.href;
    const shareTitle = `${article.title} - VOX Özet`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: article.summary,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled share or failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch (err) {}
    }
  };

  const isBookmarked = article ? bookmarkedIds.includes(article.id) : false;

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Az önce';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Bugün';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-6">
        <div className="h-6 w-24 bg-white/10 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-white/10 rounded-xl" />
            <div className="h-72 w-full bg-white/10 rounded-2xl" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-4 w-5/6 bg-white/10 rounded" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-64 w-full bg-white/10 rounded-2xl" />
            <div className="h-48 w-full bg-white/10 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Haber Bulunamadı</h2>
        <p className="text-sm text-gray-400">Aradığınız haber yayından kaldırılmış veya bağlantı değişmiş olabilir.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const cleanImg = sanitizeImageUrl(article.imageUrl) || getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;

  return (
    <div id="article-detail-page" className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* TOP NAVIGATION / BREADCRUMB */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-black/5 dark:border-white/10">
        <button
          id="btn-back-to-feed"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            theme === 'light'
              ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              : 'text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri</span>
        </button>

        {/* Action Controls: Share + Bookmark + TTS */}
        <div className="flex items-center gap-2">
          {/* TTS Audio Listen Button */}
          <button
            id="btn-article-play-audio"
            onClick={() => onPlayArticle(article)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title="Haberi Sesli Dinle"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Dinleniyor</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Sesli Dinle</span>
              </>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            id="btn-article-toggle-bookmark"
            onClick={() => onToggleBookmark(article)}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : theme === 'light'
                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
            }`}
            title={isBookmarked ? 'Kaydedilenlerden Çıkar' : 'Haberi Kaydet'}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Share Button */}
          <button
            id="btn-article-share"
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              theme === 'light'
                ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                : 'text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white'
            }`}
            title="Haberi Paylaş"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Paylaş</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TOP LEADERBOARD BANNER AD AREA */}
      <div className="mb-6">
        <NativeAdCard variant="banner" />
      </div>

      {/* BUNDLE-STYLE 2-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: MAIN ARTICLE (Span 8) */}
        <article className="lg:col-span-8 space-y-6">
          
          {/* Metadata Row: Source Publisher Logo / Badge + Category + Time */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="px-2.5 py-1 rounded-lg font-bold bg-white/10 text-white border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {article.author || 'VOX Stüdyo'}
            </span>

            <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {article.category || 'Gündem'}
            </span>

            <span className="flex items-center gap-1 text-gray-400 text-[11px] font-medium">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(article.createdAt)}
            </span>
          </div>

          {/* H1 Main Headline */}
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight sm:leading-tight ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {article.title}
          </h1>

          {/* Quick Summary Capsule (Bundle "Haberin Özeti" style) */}
          {article.summary && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
              theme === 'light'
                ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Haberin Özeti</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed font-medium">
                {article.summary}
              </p>
            </div>
          )}

          {/* Cover Hero Image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/10 border border-black/10 dark:border-white/10 shadow-lg">
            <img
              src={cleanImg}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            {/* Publisher Watermark / Tag */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
              {article.author || 'VOX Akıllı Haber'}
            </div>
          </div>

          {/* Key Bullet Points (if available) */}
          {article.keyPoints && article.keyPoints.length > 0 && (
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-white/[0.02] border-white/10'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                theme === 'light' ? 'text-slate-600' : 'text-gray-400'
              }`}>
                Öne Çıkan Başlıklar
              </h3>
              <ul className="space-y-2">
                {article.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Article Content Body */}
          <div className={`text-base sm:text-lg leading-relaxed space-y-4 font-normal ${
            theme === 'light' ? 'text-slate-800' : 'text-gray-200'
          }`}>
            {article.content ? (
              article.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p>{article.summary}</p>
            )}
          </div>

          {/* Attribution & Original Source Link */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#121814] border-white/10 text-gray-300'
          }`}>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-400">Yayıncı & Kaynak</span>
              <p className="text-xs font-semibold">
                Bu haber <strong className="text-emerald-400 font-bold">{article.author || 'Orijinal Kaynak'}</strong> tarafından yayınlanmış olup VOX Akıllı Akış motoru ile anlık derlenmiştir.
              </p>
            </div>

            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <span>Orijinal Habere Git</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Mobile In-Article Ad Container */}
          <div className="block lg:hidden pt-4">
            <NativeAdCard variant="feed" />
          </div>
        </article>

        {/* RIGHT SIDEBAR: ADSENSE BANNER + MORE FROM CATEGORY (Span 4) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* 1. Google AdSense Desktop Display Ad Banner */}
          <div className="sticky top-20 space-y-6">
            
            {/* Desktop Ad Card */}
            <div className="hidden lg:block">
              <NativeAdCard variant="sidebar" />
            </div>

            {/* 2. "DAHA FAZLA [KATEGORİ]" Bundle-Style Related News List */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              theme === 'light'
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#121814] border-white/10 shadow-lg'
            }`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    DAHA FAZLA {article.category ? article.category.toUpperCase() : 'GÜNDEM'}
                  </h3>
                </div>
                <Link
                  to={article.category ? `/${article.category.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')}` : '/gundem'}
                  className="text-[10px] font-bold text-emerald-400 hover:underline"
                >
                  Tümünü Gör
                </Link>
              </div>

              {/* Related Cards Grid */}
              <div className="space-y-3">
                {relatedArticles.map((rel) => {
                  const relUrl = getArticleUrl(rel);
                  const relImg = sanitizeImageUrl(rel.imageUrl) || getTopicContextualImage(rel.title, rel.category);
                  return (
                    <Link
                      key={rel.id}
                      to={relUrl}
                      className={`group flex items-start gap-3 p-2 rounded-xl transition-all ${
                        theme === 'light'
                          ? 'hover:bg-slate-100'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/10 border border-black/5 dark:border-white/10">
                        <img
                          src={relImg}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_VOX_FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium mb-1">
                          <span className="truncate text-emerald-500 font-bold">{rel.author || 'VOX'}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(rel.createdAt)}</span>
                        </div>
                        <h4 className={`text-xs font-bold line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {rel.title}
                        </h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 3. Pomodoro Focus Promo Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-[#121814] border border-emerald-500/30 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
                  <Headphones className="w-4 h-4" />
                  <span>Odaklanma Modu</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Canlı
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                Haber okurken arkada sakinleştirici yağmur ve doğa sesleriyle derin odaklanmaya geçin.
              </p>
              <Link
                to="/odaklan"
                className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all active:scale-95 shadow-md"
              >
                <span>Odaklanma Alanını Aç</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
};
