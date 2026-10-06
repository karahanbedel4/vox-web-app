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
  BookOpen,
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
  fetchArticleByIdOrSlug,
  fetchFullScrapedArticle,
  buildOutboundSourceUrl,
  trackOutboundClick 
} from '../lib/newsService';
import { NativeAdCard } from './NativeAdCard';
import { VoxLogo } from './VoxLogo';
import { ShareModal } from './ShareModal';
import { INITIAL_ARTICLES } from '../data/defaultArticles';
import { incrementUserArticlesRead } from '../lib/firebase';
import { appStorage } from '../lib/storage';

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
  const [isLoadingFullContent, setIsLoadingFullContent] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

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

  // Track article read count when article page is visited (avoiding session duplication)
  useEffect(() => {
    if (!article?.id) return;
    try {
      const readKey = `vox_read_${article.id}`;
      if (!sessionStorage.getItem(readKey)) {
        sessionStorage.setItem(readKey, '1');
        const userRaw = appStorage.getItemSync('vox_local_email_user') || appStorage.getItemSync('vox_local_guest_user');
        const userId = userRaw ? JSON.parse(userRaw)?.uid : undefined;
        incrementUserArticlesRead(userId);
      }
    } catch (e) {}
  }, [article?.id]);

  // ESC key listener to immediately close In-App Source Viewer and return to VOX
  useEffect(() => {
    if (!isInAppViewerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInAppViewerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInAppViewerOpen]);

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

    const rawImg = article.imageUrl || 'https://voxozet.com/og-image.png';
    const cleanImg = rawImg.startsWith('//') ? `https:${rawImg}` : rawImg;

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', cleanImg);

    const ogImgSecure = document.querySelector('meta[property="og:image:secure_url"]');
    if (ogImgSecure) ogImgSecure.setAttribute('content', cleanImg);

    const ogImgAlt = document.querySelector('meta[property="og:image:alt"]');
    if (ogImgAlt) ogImgAlt.setAttribute('content', article.title);

    const twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg) twImg.setAttribute('content', cleanImg);

    const twImgAlt = document.querySelector('meta[name="twitter:image:alt"]');
    if (twImgAlt) twImgAlt.setAttribute('content', article.title);

    const twCard = document.querySelector('meta[name="twitter:card"]');
    if (twCard) twCard.setAttribute('content', 'summary_large_image');

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', 'article');

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    const twUrl = document.querySelector('meta[name="twitter:url"]');
    if (twUrl) twUrl.setAttribute('content', window.location.href);

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
      const defaultImg = 'https://voxozet.com/og-image.png';
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
      if (ogTitle) ogTitle.setAttribute('content', 'VOX | Oku, Dinle, Odaklan');
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc);
      if (ogImg) ogImg.setAttribute('content', defaultImg);
      if (ogImgSecure) ogImgSecure.setAttribute('content', defaultImg);
      if (twImg) twImg.setAttribute('content', defaultImg);
      if (ogType) ogType.setAttribute('content', 'website');
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

      // Check if article needs full scraped article body or fresh clean summary
      const isShortContent = !found.content || found.content.length < 250 || !found.content.includes('\n\n') || found.content === found.summary || found.content === found.title;
      const hasRoboticFiller = found.content?.includes('sahadaki gelişmeler') ||
        found.content?.includes('süreç titizlikle') ||
        found.content?.includes('resmi birimler') ||
        found.content?.includes('VOX Akıllı Akış') ||
        found.content?.includes('resmi makamlar ve yetkili birimler');
      const isMissingRealSummary = !found.summary || found.summary === found.title || found.summary.includes('son dakika gelişmesi');

      if (isShortContent || hasRoboticFiller || isMissingRealSummary) {
        setIsLoadingFullContent(true);
        fetchArticleByIdOrSlug(found.id || cleanSlug, found.sourceUrl, found.title, found.category, found.author, found.imageUrl)
          .then(async (fullArt) => {
            if (fullArt && fullArt.content && fullArt.content.length > 250 && fullArt.content !== fullArt.title) {
              setArticle(prev => prev ? ({
                ...prev,
                ...fullArt,
                imageUrl: prev.imageUrl || fullArt.imageUrl
              }) : fullArt);
            } else if (found.sourceUrl && found.sourceUrl.startsWith('http')) {
              // Direct scrape fallback
              const scraped = await fetchFullScrapedArticle(found.sourceUrl);
              if (scraped && scraped.paragraphs && scraped.paragraphs.length > 0) {
                setArticle(prev => prev ? ({
                  ...prev,
                  summary: scraped.summary || prev.summary,
                  content: scraped.content || scraped.paragraphs!.join('\n\n'),
                  imageUrl: prev.imageUrl || scraped.imageUrl
                }) : null);
              } else {
                const enr = await enrichArticleWithAI(found);
                if (enr && enr.content && enr.content !== found.title) {
                  setArticle(prev => prev ? ({
                    ...prev,
                    ...enr,
                    imageUrl: prev.imageUrl || enr.imageUrl
                  }) : null);
                }
              }
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingFullContent(false));
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

  const handleShare = () => {
    setIsShareModalOpen(true);
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isPlaying
                ? theme === 'light'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-950 border-white shadow-sm'
                : theme === 'light'
                ? 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                : 'bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10'
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
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : theme === 'light'
                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
            title={isBookmarked ? 'Kaydedilenlerden Çıkar' : 'Haberi Kaydet'}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Share Button */}
          <button
            id="btn-article-share"
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              theme === 'light'
                ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                : 'text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
            title="Haberi Paylaş"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Paylaş</span>
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
            <span className={`px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1.5 ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-white/10 text-white border-white/10'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {article.author || 'VOX Stüdyo'}
            </span>

            <span className={`px-2.5 py-1 rounded-lg font-semibold border ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-white/5 text-zinc-300 border-white/10'
            }`}>
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

          {/* Spot Summary (Haber Özeti / Lead text - Sözcü & Newsroom Standard) */}
          {article.summary && 
            article.summary.trim() !== article.title.trim() && 
            article.summary.length > 25 && 
            !article.summary.includes('son dakika gelişmesi') && (
              <p className={`text-base sm:text-lg lg:text-xl font-medium leading-relaxed ${
                theme === 'light' ? 'text-slate-600' : 'text-zinc-300'
              }`}>
                {sanitizeNewsText(article.summary)}
              </p>
          )}

          {/* Cover Hero Image */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg bg-surface-container">
            <img
              src={cleanImg}
              alt={article.title}
              referrerPolicy="no-referrer"
              loading="eager"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
            
            {/* Publisher Watermark Badge */}
            {article.author && (
              <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-xs font-bold text-white border border-white/20 shadow-md">
                {sanitizeNewsText(article.author) || 'VOX Akıllı Haber'}
              </div>
            )}
          </div>

          {/* Article Body Content (Sade, Akıcı ve Doğal Metin) */}
          <div className="pt-2 space-y-4">
            {isLoadingFullContent && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Haberin detayları yükleniyor...</span>
              </div>
            )}

            {/* Full Article Content Body */}
            <div className={`text-base sm:text-lg leading-relaxed space-y-4 font-normal ${
              theme === 'light' ? 'text-slate-800' : 'text-gray-200'
            }`}>
              {(() => {
                const rawBody = article.content || '';
                const allSplits = sanitizeNewsText(rawBody).split(/\n\n+/).map(p => p.trim()).filter(Boolean);
                const normSummary = (article.summary || '').trim().toLowerCase();
                const normTitle = (article.title || '').trim().toLowerCase();

                const paragraphs = allSplits.filter(p => {
                  if (p.length < 8) return false;
                  const normP = p.toLowerCase();
                  if (normP === normTitle) return false;
                  if (normSummary && normSummary.length > 30 && (normP === normSummary || normP.startsWith(normSummary.substring(0, 40)))) return false;
                  if (normP.includes('sürecin titizlikle yürütüldüğü') || normP.includes('sahadaki son durum yakından')) return false;
                  if (normP.includes('süreç titizlikle yürütülüyor') || normP.includes('sektör temsilcileri tarafından')) return false;
                  if (normP.includes('resmi makamlar ve yetkili birimler tarafından yapılan')) return false;
                  if (normP.includes('resmi birimler ve yetkili makamlar')) return false;
                  if (normP.includes('telif hakkı mega ajans') || normP.includes('izin alınmadan, kaynak gösterilerek')) return false;
                  return true;
                });

                if (paragraphs.length === 0) {
                  if (isLoadingFullContent) {
                    return (
                      <div className="py-6 space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-11/12" />
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                        <div className="flex items-center gap-2 text-xs text-emerald-500 pt-2 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Haber içeriği ve detaylar aktarılıyor...</span>
                        </div>
                      </div>
                    );
                  }

                  const outboundUrl = article.sourceUrl ? buildOutboundSourceUrl(article.sourceUrl, article) : '';

                  return (
                    <div className={`p-4 sm:p-5 rounded-2xl border my-4 space-y-3.5 ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-white/[0.04] border-white/10 text-zinc-200'
                    }`}>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Haber Özeti</span>
                      </div>

                      <p className="text-sm sm:text-base leading-relaxed font-normal">
                        {article.summary && article.summary.length > 20
                          ? sanitizeNewsText(article.summary)
                          : 'Bu haberin temel gelişmeleri ve önemli detayları özetlenmiştir.'}
                      </p>

                      {article.sourceUrl && (
                        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-black/5 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => setIsInAppViewerOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Devamını Oku</span>
                          </button>

                          <a
                            href={outboundUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackOutboundClick(article, outboundUrl)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                              theme === 'light'
                                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
                                : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white'
                            }`}
                            title="Yeni sekmede aç"
                          >
                            <span>Yeni Sekmede Aç</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                }

                return paragraphs.map((paragraph, pIdx) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 
                        key={pIdx} 
                        className={`text-xl sm:text-2xl font-bold tracking-tight pt-5 pb-1 ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {paragraph.replace(/^##\s*/, '')}
                      </h2>
                    );
                  }
                  return (
                    <p key={pIdx} className="leading-relaxed">
                      {paragraph}
                    </p>
                  );
                });
              })()}
            </div>
          </div>

          {/* Subtle Clean Source Attribution */}
          <div className={`mt-8 pt-4 border-t flex items-center justify-between text-xs ${
            theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-white/10 text-zinc-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">Kaynak:</span>
              <strong className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-zinc-200'}`}>
                {article.author || 'Orijinal Kaynak'}
              </strong>
            </div>
            {article.sourceUrl && (
              <span className="font-mono text-[11px] opacity-70">
                {(() => {
                  try {
                    return new URL(article.sourceUrl).hostname.replace('www.', '');
                  } catch {
                    return '';
                  }
                })()}
              </span>
            )}
          </div>

          {/* Article Bottom Share Callout Banner */}
          <div className={`mt-6 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            theme === 'light'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-bold leading-snug ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Bu Haberi Paylaşın
                </h4>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Sosyal ağlar, WhatsApp veya doğrudan bağlantı kopyalayarak çevrenize ulaştırın.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Haberi Paylaş</span>
            </button>
          </div>

          {/* Discreet Legal, Publisher Rights & Google News API Disclaimer */}
          <div className={`mt-6 pt-3 pb-1 border-t text-[11px] leading-relaxed select-text ${
            theme === 'light'
              ? 'border-slate-200/80 text-slate-400'
              : 'border-white/5 text-zinc-500'
          }`}>
            <p className="opacity-75">
              <strong className="font-semibold">Yasal Bilgilendirme:</strong> Bu haber içeriği, orijinal yayıncının editöryal metnine hiçbir müdahalede bulunulmaksızın Google Haberler (Google News) ve açık RSS servisleri aracılığıyla sayfaya yansıtılmıştır. Haberde yer alan tüm bilgi, görsel, yorum ve hukuki sorumluluk münhasıran ilgili kaynak kuruluşa aittir; VOX içerik sağlayıcı konumunda olmayıp haber metni veya doğruluğu üzerinde herhangi bir sorumluluk kabul etmemektedir.
            </p>
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
            <div className={`p-4 rounded-2xl border space-y-3 ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#141715] border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  theme === 'light' ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                  <Headphones className="w-4 h-4 text-emerald-500" />
                  <span>Odaklanma Modu</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Canlı
                </span>
              </div>
              <p className={`text-[11px] leading-snug ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                Haber okurken arkada sakinleştirici yağmur ve doğa sesleriyle derin odaklanmaya geçin.
              </p>
              <Link
                to="/odaklan"
                className={`inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                }`}
              >
                <span>Odaklanma Alanını Aç</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </aside>

      </div>

      {/* UNIVERSAL FLOATING ORIGINAL ARTICLE BAR (Mobile, Tablet & Desktop) */}
      {article.sourceUrl && (() => {
        const outboundUrl = buildOutboundSourceUrl(article.sourceUrl, article);
        return (
          <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[420px] sm:max-w-xl z-40 pointer-events-auto">
            <div className={`px-4 py-2.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 sm:gap-6 backdrop-blur-xl transition-all ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-900/10'
                : 'bg-[#141715]/95 border-white/15 text-white shadow-black/90'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/10 border-white/10 text-zinc-300'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Kaynak</p>
                  <p className="text-xs sm:text-sm font-bold truncate">{article.author || 'Orijinal Yayıncı'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsInAppViewerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 transition-all shadow-md cursor-pointer"
                  title="Devamını Oku"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Devamını Oku</span>
                </button>

                <a
                  href={outboundUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOutboundClick(article, outboundUrl)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                    theme === 'light'
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                  }`}
                  title="Yeni sekmede aç"
                >
                  <span className="hidden sm:inline">Yeni Sekmede Aç</span>
                  <span className="sm:hidden">Yeni Sekme</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
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
            <header className="h-14 px-3 sm:px-4 bg-[#0d120f] border-b border-white/10 flex items-center justify-between shrink-0 text-white select-none">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  onClick={() => setIsInAppViewerOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-md shrink-0"
                  title="Kapat ve VOX'a Dön"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>VOX'a Dön</span>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all border border-white/10"
                  title="Yeni sekmede tam sayfa aç"
                >
                  <span className="hidden sm:inline">Yeni Sekmede Aç</span>
                  <span className="sm:hidden">Yeni Sekme</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
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
                Sayfa açılmazsa sitede açın →
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

              {/* Floating Return Pill so mobile users can effortlessly tap to return from any scroll depth */}
              <button
                type="button"
                onClick={() => setIsInAppViewerOpen(false)}
                className="fixed bottom-5 left-4 z-[90] px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-2xl flex items-center gap-1.5 border border-black/10 active:scale-95 transition-all cursor-pointer"
                title="VOX'a Dön"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>VOX'a Dön</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        article={article}
      />
    </div>
  );
};
