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
  TrendingUp,
  Globe,
  Maximize2,
  X,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Article } from '../types';
import { useTheme } from '../lib/ThemeContext';
import { ttsService } from '../lib/ttsService';
import { 
  sanitizeImageUrl, 
  getTopicContextualImage, 
  DEFAULT_VOX_FALLBACK_IMAGE, 
  getArticleUrl, 
  generateArticleSlug, 
  fetchNewsByCategory, 
  sanitizeNewsText,
  enrichArticleWithAI,
  buildOutboundSourceUrl,
  trackOutboundClick 
} from '../lib/newsService';
import { NativeAdCard } from './NativeAdCard';
import { VoxLogo } from './VoxLogo';
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
  const [isInAppViewerOpen, setIsInAppViewerOpen] = useState<boolean>(false);

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
            if (fb) {
              loadRelated(fb);
              enrichArticleWithAI(fb).then(enr => { if (enr) setArticle(enr); }).catch(() => {});
            }
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

      // Check if article needs AI summarization/expansion
      if (
        !found.content || 
        found.content.length < 250 || 
        !found.keyPoints || 
        found.keyPoints.some(k => k.includes('Canlı Akış') || k.includes('Kategori:'))
      ) {
        enrichArticleWithAI(found).then(enr => {
          if (enr && (enr.content !== found.content || enr.summary !== found.summary)) {
            setArticle(enr);
          }
        }).catch(() => {});
      }
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

        {/* Action Controls: Share + Bookmark + TTS + Original Source */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
            {sanitizeNewsText(article.title)}
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
                {sanitizeNewsText(article.summary)}
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
              {sanitizeNewsText(article.author) || 'VOX Akıllı Haber'}
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
                    <span>{sanitizeNewsText(point)}</span>
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
              sanitizeNewsText(article.content).split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p>{sanitizeNewsText(article.summary)}</p>
            )}
          </div>

          {/* DEDICATED PROMINENT "KAYNAK" SECTION AT THE BOTTOM OF THE ARTICLE */}
          <section
            id="article-source-section"
            className={`mt-8 p-5 sm:p-6 rounded-2xl border transition-all ${
              theme === 'light'
                ? 'bg-slate-50/90 border-slate-300/80 shadow-sm text-slate-800'
                : 'bg-gradient-to-br from-[#121915] via-[#0e1411] to-[#0c100e] border-emerald-500/30 text-gray-200 shadow-xl'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Kaynak & Yayıncı
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {article.author || 'Haber Merkezi'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    Bu haberin tam metni, tüm galerisi ve resmi detayları <strong className="text-emerald-500 dark:text-emerald-400 font-bold">{article.author || 'orijinal kaynak'}</strong> tarafından yayınlanmıştır.
                  </p>
                  {article.sourceUrl && (
                    <p className="text-xs text-gray-400 truncate max-w-md font-mono pt-0.5">
                      {(() => {
                        try {
                          return new URL(article.sourceUrl).hostname.replace('www.', '');
                        } catch {
                          return article.sourceUrl;
                        }
                      })()}
                    </p>
                  )}
                </div>
              </div>

              {article.sourceUrl && (() => {
                const outboundUrl = buildOutboundSourceUrl(article.sourceUrl, article);
                return (
                  <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsInAppViewerOpen(true)}
                      className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                        theme === 'light'
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
                          : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                      }`}
                      title="Haberi VOX içerisindeki önizleme penceresinde aç"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sitede Önizle</span>
                    </button>
                    <a
                      href={outboundUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOutboundClick(article, outboundUrl)}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
                      title={`${article.author || 'Orijinal kaynak'} sitesinde tam haberi aç`}
                    >
                      <span>Orijinal Habere Git</span>
                      <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    </a>
                  </div>
                );
              })()}
            </div>
          </section>

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

      {/* MOBILE STICKY FLOATING ORIGINAL ARTICLE BAR (Always accessible on scroll) */}
      {article.sourceUrl && (() => {
        const outboundUrl = buildOutboundSourceUrl(article.sourceUrl, article);
        return (
          <div className="sm:hidden fixed bottom-20 left-3 right-3 z-30 pointer-events-auto">
            <div className={`p-3 rounded-2xl border shadow-2xl flex items-center justify-between gap-2.5 backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-emerald-300/80 shadow-emerald-950/15 text-slate-800'
                : 'bg-[#0f1712]/95 border-emerald-500/40 text-white shadow-black/80'
            }`}>
              <div className="min-w-0 flex-1 pl-1">
                <p className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">Orijinal Kaynak</p>
                <p className="text-xs font-bold truncate leading-tight">{article.author || 'Tam Haberi Oku'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInAppViewerOpen(true)}
                  className="p-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all"
                  title="VOX'ta Önizle"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                </button>
                <a
                  href={outboundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOutboundClick(article, outboundUrl)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500 text-black active:scale-95 transition-all shadow-md"
                >
                  <span>Habere Git</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* IN-APP SOURCE VIEWER MODAL / IFRAME READER */}
      {isInAppViewerOpen && article.sourceUrl && (() => {
        const outboundUrl = buildOutboundSourceUrl(article.sourceUrl, article);
        return (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <header className="h-14 px-4 bg-[#0d120f] border-b border-white/10 flex items-center justify-between shrink-0 text-white select-none">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsInAppViewerOpen(false)}
                  className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Kapat ve VOX'a Dön"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">VOX'a Dön</span>
                </button>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {article.title}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold truncate">
                    {article.author || 'Kaynak Yayıncı'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={outboundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOutboundClick(article, outboundUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-md"
                  title="Yeni sekmede tam sayfa aç"
                >
                  <span>Yeni Sekmede Aç</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </a>
                <button
                  onClick={() => setIsInAppViewerOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Advisory Info Banner for iframe security policies */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-[11px] text-amber-300">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="truncate">
                  Bazı haber kaynakları güvenlik politikası (X-Frame-Options) gereği sayfanın uygulama içine gömülmesini kısıtlayabilir.
                </p>
              </div>
              <a
                href={outboundUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-400 shrink-0 hover:text-white"
              >
                Sayfa açılmazsa doğrudan sitede açın →
              </a>
            </div>

            {/* Embedded Iframe Container */}
            <div className="flex-1 w-full bg-white relative">
              <iframe
                src={outboundUrl}
                title={article.title}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
};
