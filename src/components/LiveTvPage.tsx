import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Grid3X3, 
  Layout, 
  Radio, 
  Sparkles, 
  Search,
  Check,
  RotateCcw,
  SlidersHorizontal,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Info,
  Trophy,
  Smartphone,
  Play,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { 
  LIVE_TV_CHANNELS, 
  LIVE_TV_CATEGORIES, 
  LiveTvChannel, 
  TV_DIRECTORY_CHANNELS, 
  LIVE_TV_SEO_FAQS, 
  TARGET_KEYWORDS_CANLI_TV,
  TvDirectoryChannel 
} from '../data/liveTvData';
import { liveTvBackgroundAudio } from '../lib/liveTvBackgroundAudio';
import { triggerHapticImpact } from '../lib/haptics';

type ViewMode = 'grid' | 'focus';

// Animated Sound Wave Equalizer for indicating active audio on cards & floating docks
function LiveAudioEqualizer({ active = true, className = '' }: { active?: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-0.5 h-3.5 ${className}`} aria-label="Canlı Ses Dalgaları">
      <span className={`w-0.5 rounded-full transition-all ${active ? 'bg-emerald-400 animate-pulse h-3.5' : 'bg-zinc-500 h-1'}`} />
      <span className={`w-0.5 rounded-full transition-all ${active ? 'bg-emerald-400 animate-bounce h-2.5' : 'bg-zinc-500 h-2'}`} />
      <span className={`w-0.5 rounded-full transition-all ${active ? 'bg-emerald-400 animate-pulse h-3' : 'bg-zinc-500 h-1.5'}`} />
      <span className={`w-0.5 rounded-full transition-all ${active ? 'bg-emerald-400 animate-bounce h-2' : 'bg-zinc-500 h-1'}`} />
    </div>
  );
}

export function LiveTvPage() {
  const { theme } = useTheme();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial category from URL slug, hash, or query
  const resolveCategoryFromUrl = useCallback(() => {
    // 1. Path param /canli-tv/:categorySlug
    if (categorySlug) {
      const slugLower = categorySlug.toLowerCase().trim();
      const match = LIVE_TV_CATEGORIES.find(c => c.slug === slugLower);
      if (match) return match.name;
    }
    // 2. Hash fragment (#spor, #ekonomi, #gundem)
    const hash = location.hash.replace('#', '').toLowerCase().trim();
    if (hash) {
      const match = LIVE_TV_CATEGORIES.find(c => c.slug === hash || c.name.toLowerCase() === hash);
      if (match) return match.name;
    }
    // 3. Query string (?kategori=spor)
    const params = new URLSearchParams(location.search);
    const catQuery = params.get('kategori') || params.get('category');
    if (catQuery) {
      const qLower = catQuery.toLowerCase().trim();
      const match = LIVE_TV_CATEGORIES.find(c => c.slug === qLower || c.name.toLowerCase() === qLower);
      if (match) return match.name;
    }
    return 'Tümü';
  }, [categorySlug, location.hash, location.search]);

  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>(resolveCategoryFromUrl);

  // Sync category state whenever the URL changes (e.g. forward/back buttons or hash changes)
  useEffect(() => {
    const resolved = resolveCategoryFromUrl();
    if (resolved !== selectedCategory) {
      setSelectedCategory(resolved);
    }
  }, [resolveCategoryFromUrl]);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Layout mode: 'grid' (3x3) or 'focus' (1 main + thumbnails)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  // Active focused channel (for focus mode or fullscreen)
  const [focusedChannelId, setFocusedChannelId] = useState<string>(LIVE_TV_CHANNELS[0].id);

  // Audio Coordination: Which channel currently has audio unmuted? (null = ALL MUTED)
  const [unmutedChannelId, setUnmutedChannelId] = useState<string | null>(null);

  // Active audio notification toast (when user minimizes and returns to browser tab)
  const [showResumeNotice, setShowResumeNotice] = useState<boolean>(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth scroll highlighted channel (when clicked from floating dock or notice)
  const [highlightedChannelId, setHighlightedChannelId] = useState<string | null>(null);

  // Cinema Mode (Hide Left Sidebar for Full-Screen news viewing)
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // FAQ Accordion Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // TRT Spor Live Status state (Auto-detected from YouTube streams)
  const [trtSporStatus, setTrtSporStatus] = useState<{ isLive: boolean; videoId?: string; title?: string } | null>(null);

  // Polling backend for TRT Spor live status
  useEffect(() => {
    let isMounted = true;
    const checkTrtSpor = async () => {
      try {
        const res = await fetch('/api/live-tv/trt-spor-status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setTrtSporStatus({
              isLive: Boolean(data.isLive && data.videoId),
              videoId: data.videoId,
              title: data.title
            });
          }
        }
      } catch (err) {
        // Fallback: stay hidden if status cannot be determined
      }
    };

    checkTrtSpor();
    const interval = setInterval(checkTrtSpor, 3 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute all available channels (including dynamically detected live TRT Spor stream)
  const allChannels: LiveTvChannel[] = useMemo(() => {
    if (trtSporStatus?.isLive && trtSporStatus.videoId) {
      const dynamicTrt: LiveTvChannel = {
        id: 'trt-spor',
        name: 'TRT Spor (Canlı)',
        shortName: 'TRT SPOR',
        youtubeId: trtSporStatus.videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${trtSporStatus.videoId}`,
        category: 'Spor',
        brandColor: '#E30A17',
        badgeColor: 'bg-red-600',
        description: trtSporStatus.title || 'TRT Spor anlık özel canlı yayın yayını.',
        resolution: '1080p HD',
        isDynamicLive: true
      };
      // Place right with sport channels
      return [dynamicTrt, ...LIVE_TV_CHANNELS];
    }
    return LIVE_TV_CHANNELS;
  }, [trtSporStatus]);

  // Fullscreen state: which channel is in full screen (null = none)
  const [fullscreenChannelId, setFullscreenChannelId] = useState<string | null>(null);
  const [isFullscreenOverlayControlsVisible, setIsFullscreenOverlayControlsVisible] = useState<boolean>(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize Cinema Mode with PersistentLayout & F11 / Fullscreen
  useEffect(() => {
    const handleCinemaEvent = (e: any) => {
      if (e && typeof e.detail === 'boolean') {
        setIsCinemaMode(e.detail);
      }
    };
    window.addEventListener('vox_toggle_cinema_mode', handleCinemaEvent);

    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      if (isFs) {
        setIsCinemaMode(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('vox_toggle_cinema_mode', handleCinemaEvent);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleCinemaMode = useCallback(() => {
    const nextState = !isCinemaMode;
    setIsCinemaMode(nextState);
    window.dispatchEvent(new CustomEvent('vox_toggle_cinema_mode', { detail: nextState }));
  }, [isCinemaMode]);

  // Category change handler with clean SEO-friendly URL navigation
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const catObj = LIVE_TV_CATEGORIES.find(c => c.name === catName);
    if (catObj && catObj.slug) {
      navigate(`/canli-tv/${catObj.slug}`);
    } else {
      navigate('/canli-tv');
    }
  };

  // Comprehensive SEO & GEO Optimization for Google Search & Google Gemini + Dynamic Audio Title
  useEffect(() => {
    const activeCategoryInfo = LIVE_TV_CATEGORIES.find(c => c.name === selectedCategory) || LIVE_TV_CATEGORIES[0];
    const prevTitle = document.title;
    
    // Dynamic Tab Title: If a channel is unmuted, indicate audio is playing in the tab switcher!
    if (unmutedChannelId) {
      const activeCh = allChannels.find(c => c.id === unmutedChannelId);
      if (activeCh) {
        document.title = `🔊 ${activeCh.name} (Canlı Ses Açık) | VOX Canlı TV`;
      } else {
        document.title = activeCategoryInfo.seoTitle;
      }
    } else {
      document.title = activeCategoryInfo.seoTitle;
    }

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', activeCategoryInfo.seoDescription);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    const prevKeywords = metaKeywords ? metaKeywords.getAttribute('content') : null;
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    const categoryKeywordsStr = activeCategoryInfo.keywords.join(', ');
    metaKeywords.setAttribute('content', categoryKeywordsStr);

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', activeCategoryInfo.seoTitle);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', activeCategoryInfo.seoDescription);

    // Update Twitter tags
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', activeCategoryInfo.seoTitle);
    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', activeCategoryInfo.seoDescription);

    // Canonical link update
    const currentCanonicalUrl = activeCategoryInfo.slug 
      ? `https://voxozet.com/canli-tv/${activeCategoryInfo.slug}` 
      : 'https://voxozet.com/canli-tv';
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', currentCanonicalUrl);
    }

    // Inject Rich JSON-LD Structured Data for Google Rich Snippets & Gemini AI Overviews
    const jsonLdId = 'vox-canli-tv-jsonld';
    let scriptTag = document.getElementById(jsonLdId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = jsonLdId;
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }

    const currentChannels = allChannels.filter(ch => selectedCategory === 'Tümü' || ch.category === selectedCategory);

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': currentCanonicalUrl,
          'url': currentCanonicalUrl,
          'name': activeCategoryInfo.seoTitle,
          'description': activeCategoryInfo.seoDescription,
          'keywords': categoryKeywordsStr,
          'inLanguage': 'tr-TR',
          'isPartOf': {
            '@type': 'WebSite',
            '@id': 'https://voxozet.com/#website',
            'url': 'https://voxozet.com',
            'name': 'VOX'
          },
          'breadcrumb': {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Ana Sayfa',
                'item': 'https://voxozet.com/'
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Canlı TV',
                'item': 'https://voxozet.com/canli-tv'
              },
              ...(activeCategoryInfo.slug ? [{
                '@type': 'ListItem',
                'position': 3,
                'name': `${activeCategoryInfo.name} Kanalları`,
                'item': currentCanonicalUrl
              }] : [])
            ]
          }
        },
        {
          '@type': 'ItemList',
          'name': `${activeCategoryInfo.h1Title} & TV Kanalları Listesi`,
          'numberOfItems': currentChannels.length + TV_DIRECTORY_CHANNELS.length,
          'itemListElement': [
            ...currentChannels.map((ch, index) => ({
              '@type': 'ListItem',
              'position': index + 1,
              'name': ch.name,
              'url': ch.youtubeUrl,
              'description': ch.description
            })),
            ...TV_DIRECTORY_CHANNELS.map((td, index) => ({
              '@type': 'ListItem',
              'position': currentChannels.length + index + 1,
              'name': td.name,
              'url': `https://voxozet.com/canli-tv#${td.id}`,
              'description': td.description
            }))
          ]
        },
        {
          '@type': 'SoftwareApplication',
          'name': 'VOX Mobil TV (PWA)',
          'operatingSystem': 'Android, iOS, Windows, macOS',
          'applicationCategory': 'EntertainmentApplication',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'TRY'
          },
          'description': 'Kesintisiz canlı televizyon izleme ve mobil TV uygulaması. Ücretsiz indirin ve ana ekrana ekleyin.'
        },
        {
          '@type': 'FAQPage',
          'mainEntity': LIVE_TV_SEO_FAQS.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': faq.answer
            }
          }))
        }
      ]
    };

    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      document.title = prevTitle;
      if (prevDesc && metaDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
      if (prevKeywords && metaKeywords) {
        metaKeywords.setAttribute('content', prevKeywords);
      }
      const existing = document.getElementById(jsonLdId);
      if (existing) {
        existing.remove();
      }
    };
  }, [selectedCategory, allChannels, unmutedChannelId]);

  // Filter channels based on category and search
  const filteredChannels = allChannels.filter(ch => {
    const matchesCat = selectedCategory === 'Tümü' || ch.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Helper to send postMessage commands to YouTube iframes
  const sendIframeCommand = useCallback((channelId: string, func: 'mute' | 'unMute' | 'setVolume' | 'playVideo' | 'pauseVideo', args: any[] = []) => {
    try {
      const iframe = document.getElementById(`yt-live-${channelId}`) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func,
          args
        }), '*');
      }

      // Also support fullscreen iframe if present
      const fsIframe = document.getElementById(`yt-live-fs-${channelId}`) as HTMLIFrameElement;
      if (fsIframe && fsIframe.contentWindow) {
        fsIframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func,
          args
        }), '*');
      }
    } catch (e) {
      console.warn('Error sending iframe command:', e);
    }
  }, []);

  // Handle toggling sound for a specific channel
  const handleToggleSound = useCallback((channelId: string) => {
    if (unmutedChannelId === channelId) {
      // Mute this channel
      sendIframeCommand(channelId, 'mute');
      setUnmutedChannelId(null);
      liveTvBackgroundAudio.stopSession();
      triggerHapticImpact('light');
    } else {
      // Mute all other channels first to prevent audio clash
      allChannels.forEach(ch => {
        if (ch.id !== channelId) {
          sendIframeCommand(ch.id, 'mute');
        }
      });

      // Unmute, set volume to 100 and ensure play command on the selected channel
      sendIframeCommand(channelId, 'unMute');
      sendIframeCommand(channelId, 'setVolume', [100]);
      sendIframeCommand(channelId, 'playVideo');
      setUnmutedChannelId(channelId);
      triggerHapticImpact('medium');

      const targetCh = allChannels.find(c => c.id === channelId);
      if (targetCh) {
        // Register with MediaSession and background audio keep-alive for Safari & Chrome
        liveTvBackgroundAudio.startSession({
          channelId: targetCh.id,
          channelName: targetCh.name,
          category: targetCh.category,
          brandColor: targetCh.brandColor,
          onPlay: () => {
            sendIframeCommand(channelId, 'unMute');
            sendIframeCommand(channelId, 'setVolume', [100]);
            sendIframeCommand(channelId, 'playVideo');
          },
          onPause: () => {
            sendIframeCommand(channelId, 'mute');
            setUnmutedChannelId(null);
          }
        });
      }
    }
  }, [unmutedChannelId, sendIframeCommand, allChannels]);

  // Mute all channels
  const handleMuteAll = useCallback(() => {
    allChannels.forEach(ch => {
      sendIframeCommand(ch.id, 'mute');
    });
    setUnmutedChannelId(null);
    liveTvBackgroundAudio.stopSession();
    triggerHapticImpact('light');
  }, [sendIframeCommand, allChannels]);

  // Scroll smoothly to channel card and pulse highlight
  const scrollToChannel = useCallback((channelId: string) => {
    if (viewMode === 'focus') {
      setFocusedChannelId(channelId);
    }
    const cardEl = document.getElementById(`channel-card-${channelId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedChannelId(channelId);
      setTimeout(() => {
        setHighlightedChannelId(null);
      }, 2500);
    }
  }, [viewMode]);

  // Mobile Background & Tab Resumption Listener (Safari on iOS & Chrome on Android)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && unmutedChannelId) {
        // Re-assert play & unMute so that even if the mobile OS throttled the video stream, it continues seamlessly
        sendIframeCommand(unmutedChannelId, 'playVideo');
        sendIframeCommand(unmutedChannelId, 'unMute');
        sendIframeCommand(unmutedChannelId, 'setVolume', [100]);

        // Show floating notification so user knows which channel is active
        setShowResumeNotice(true);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          setShowResumeNotice(false);
        }, 7500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [unmutedChannelId, sendIframeCommand]);

  // Clean up audio session on unmount
  useEffect(() => {
    return () => {
      liveTvBackgroundAudio.stopSession();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Handle entering full screen
  const handleEnterFullscreen = useCallback((channelId: string) => {
    setFullscreenChannelId(channelId);
    // If not already unmuted, we can unmute it or let user control
    handleToggleSound(channelId);

    // Request native browser fullscreen if supported
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, [handleToggleSound]);

  // Handle exiting full screen
  const handleExitFullscreen = useCallback(() => {
    setFullscreenChannelId(null);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Close fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenChannelId) {
        handleExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenChannelId, handleExitFullscreen]);

  // Auto-hide fullscreen overlay controls on inactivity
  const handleFullscreenMouseMove = useCallback(() => {
    setIsFullscreenOverlayControlsVisible(true);
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setIsFullscreenOverlayControlsVisible(false);
    }, 3500);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  // Find currently unmuted channel name
  const currentUnmutedChannel = allChannels.find(c => c.id === unmutedChannelId);
  const activeFsChannel = allChannels.find(c => c.id === fullscreenChannelId);

  return (
    <div className={`min-h-screen px-3 sm:px-6 lg:px-8 py-5 md:py-8 transition-colors ${
      theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#0a0d0b] text-white'
    }`}>
      {/* ACTIVE AUDIO RESUME NOTIFICATION TOAST (Shows on returning to browser if audio is playing) */}
      <AnimatePresence>
        {showResumeNotice && currentUnmutedChannel && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed top-16 md:top-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 p-3 rounded-2xl bg-[#0e1712]/95 border border-emerald-500/60 text-white shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
                style={{ backgroundColor: currentUnmutedChannel.brandColor }}
              >
                {currentUnmutedChannel.shortName}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <LiveAudioEqualizer active={true} />
                  <p className="text-xs font-black truncate text-white">
                    {currentUnmutedChannel.name}
                  </p>
                </div>
                <p className="text-[11px] text-emerald-300/85 truncate">
                  Yayın sesi açık • Arka planda devam etti
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => scrollToChannel(currentUnmutedChannel.id)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold transition-all cursor-pointer"
              >
                Kanala Git
              </button>
              <button
                onClick={() => {
                  handleToggleSound(currentUnmutedChannel.id);
                  setShowResumeNotice(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Sesi Kapat</span>
              </button>
              <button
                onClick={() => setShowResumeNotice(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Bildirimi Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* SEAMLESS CORNERLESS FULLSCREEN OVERLAY ("köşesiz tüm sayfaya yayılan görüntü") */}
      <AnimatePresence>
        {fullscreenChannelId && activeFsChannel && (
          <motion.div
            ref={fullscreenContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseMove={handleFullscreenMouseMove}
            onTouchStart={handleFullscreenMouseMove}
            className="fixed inset-0 z-[99999] w-screen h-screen bg-black rounded-none border-0 p-0 m-0 overflow-hidden flex flex-col select-none"
          >
            {/* Top Auto-Hiding Control Bar */}
            <motion.div
              animate={{ 
                opacity: isFullscreenOverlayControlsVisible ? 1 : 0,
                y: isFullscreenOverlayControlsVisible ? 0 : -30
              }}
              transition={{ duration: 0.25 }}
              className={`absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between gap-4 pointer-events-${isFullscreenOverlayControlsVisible ? 'auto' : 'none'}`}
            >
              {/* Left: Active Channel Badge & Info */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md shrink-0"
                  style={{ backgroundColor: activeFsChannel.brandColor }}
                >
                  {activeFsChannel.shortName}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                      {activeFsChannel.name}
                    </h2>
                    <span className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      CANLI
                    </span>
                    <span className="hidden sm:inline-block text-xs text-zinc-400 font-mono">
                      {activeFsChannel.resolution}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 hidden sm:block">
                    {activeFsChannel.description}
                  </p>
                </div>
              </div>

              {/* Center: Quick Channel Switcher Pills */}
              <div className="hidden lg:flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15 max-w-[50vw] overflow-x-auto">
                {allChannels.map(ch => {
                  const isCurrent = ch.id === activeFsChannel.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setFullscreenChannelId(ch.id);
                        handleToggleSound(ch.id);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-zinc-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {ch.name}
                    </button>
                  );
                })}
              </div>

              {/* Right: Controls & Exit Button */}
              <div className="flex items-center gap-2">
                {/* Unmute/Mute Toggle */}
                <button
                  onClick={() => handleToggleSound(activeFsChannel.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                    unmutedChannelId === activeFsChannel.id
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
                  }`}
                  title={unmutedChannelId === activeFsChannel.id ? 'Sesi Kapat' : 'Sesi Aç'}
                >
                  {unmutedChannelId === activeFsChannel.id ? (
                    <>
                      <Volume2 className="w-4 h-4 animate-pulse text-emerald-300" />
                      <span>Ses Açık</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Sesi Aç</span>
                    </>
                  )}
                </button>

                {/* Exit Fullscreen Button */}
                <button
                  onClick={handleExitFullscreen}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Tam Ekrandan Çık (ESC)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </div>
            </motion.div>

            {/* Seamless Edge-to-Edge Cornerless Video Frame */}
            <div className="w-full h-full flex-1 relative bg-black rounded-none p-0 m-0 overflow-hidden">
              <iframe
                id={`yt-live-fs-${activeFsChannel.id}`}
                src={`https://www.youtube-nocookie.com/embed/${activeFsChannel.youtubeId}?autoplay=1&mute=${unmutedChannelId === activeFsChannel.id ? '0' : '1'}&controls=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`}
                title={`${activeFsChannel.name} Tam Ekran Canlı Yayın`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className="w-full h-full border-0 rounded-none object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className={`transition-all duration-300 space-y-4 sm:space-y-5 ${
        isCinemaMode ? 'w-full px-2 sm:px-4 md:px-6' : 'w-full max-w-[1720px] mx-auto px-2 sm:px-4 md:px-6'
      }`}>
        
        {/* TOP HEADER & CONTROLS */}
        <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#101712] border-white/10 shadow-md'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title & Pulse Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedCategory === 'Spor'
                    ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-500'
                    : selectedCategory === 'Ekonomi'
                    ? 'bg-amber-600/15 border border-amber-500/30 text-amber-500'
                    : 'bg-red-600/15 border border-red-500/30 text-red-500'
                }`}>
                  {selectedCategory === 'Spor' ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <Tv className="w-5 h-5" />
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <span>
                    {selectedCategory === 'Spor' 
                      ? 'Canlı Spor TV' 
                      : selectedCategory === 'Ekonomi'
                      ? 'Canlı Ekonomi TV'
                      : selectedCategory === 'Gündem'
                      ? 'Canlı Haber TV'
                      : 'Canlı TV'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    CANLI YAYIN
                  </span>
                </h1>
              </div>
              <p className={`text-xs sm:text-sm font-normal max-w-2xl ${
                theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                {selectedCategory === 'Spor' ? (
                  <>
                    <strong>HT Spor</strong>, <strong>A Spor</strong> ve <strong>beIN SPORTS HABER</strong> şifresiz HD canlı yayınlarını tek ekranda donmadan izleyin. Maç özetleri, transfer haberleri ve canlı spor bültenleri.
                    {trtSporStatus?.isLive ? (
                      <span className="ml-1 text-emerald-400 font-semibold">(TRT Spor özel canlı yayını devrede!)</span>
                    ) : (
                      <span className="ml-1 text-zinc-500 text-[11px]">(TRT Spor canlı yayın açtığında buraya otomatik eklenir.)</span>
                    )}
                  </>
                ) : selectedCategory === 'Ekonomi' ? (
                  <>
                    <strong>Bloomberg HT</strong> canlı yayını ile Borsa İstanbul, altın, döviz ve küresel finans piyasalarını eş zamanlı ve kesintisiz izleyin.
                  </>
                ) : selectedCategory === 'Gündem' ? (
                  <>
                    CNN TÜRK, Sözcü TV, HalkTV, Habertürk, NTV, TRT Haber, TV100 ve Haber Global canlı yayınlarını tek ekranda eş zamanlı takip edin.
                  </>
                ) : (
                  <>
                    Türkiye'nin önde gelen {allChannels.length} haber ve spor kanalının kesintisiz canlı yayınları tek ekranda. Tüm yayınlar otomatik ve <strong>sessiz</strong> başlar; dilediğiniz kanalın sesini tek tıkla açabilir, <strong>F11 Geniş Ekran</strong> veya tam ekran modunda kesintisiz izleyebilirsiniz.
                  </>
                )}
              </p>
            </div>

            {/* Master Sound & Layout Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              {/* Sound Status Banner / Quick Mute All / Mobile Indicator */}
              {unmutedChannelId ? (
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  <LiveAudioEqualizer active={true} />
                  <button
                    onClick={() => scrollToChannel(unmutedChannelId)}
                    className="truncate max-w-[150px] sm:max-w-[200px] text-left hover:underline cursor-pointer flex items-center gap-1"
                    title="Kanala odaklan"
                  >
                    <span>{currentUnmutedChannel?.name || 'Ses Açık'}</span>
                    <ArrowUpRight className="w-3 h-3 shrink-0 opacity-70" />
                  </button>
                  <button
                    onClick={handleMuteAll}
                    className="ml-1 px-2 py-0.5 rounded-md bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-black transition-colors cursor-pointer shadow-sm"
                    title="Tümünü Sessize Al"
                  >
                    Sesi Kapat
                  </button>
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-zinc-400'
                }`}>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Tüm Kanallar Sessiz</span>
                </div>
              )}

              {/* View Mode Toggle: Grid (3x3) vs Focus (1 Big + Small) */}
              <div className={`flex items-center p-1 rounded-xl border ${
                theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/15 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Mozaik Izgara"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Izgara</span>
                </button>
                <button
                  onClick={() => setViewMode('focus')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'focus'
                      ? theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/15 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Odak Modu (1 Büyük Yayın + Kanal Listesi)"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Odak</span>
                </button>
              </div>

              {/* Cinema Mode / Full Page (Hide Left Sidebar) Toggle */}
              <button
                onClick={handleToggleCinemaMode}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                  isCinemaMode
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                    : theme === 'light'
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title={isCinemaMode ? 'Kenar Çubuğunu Göster (F11 veya ESC)' : 'Geniş Ekran / Sol Menüyü Gizle (F11)'}
              >
                {isCinemaMode ? (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Menüyü Göster</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Geniş Ekran</span>
                    <span className="text-[10px] opacity-75 px-1 py-0.5 rounded bg-black/20 font-mono">F11</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECONDARY FILTER BAR: Category Pills & Search */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {LIVE_TV_CATEGORIES.map(cat => {
                const count = cat.name === 'Tümü'
                  ? allChannels.length
                  : allChannels.filter(c => c.category === cat.name).length;
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm'
                        : theme === 'light'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-black/20 text-white' : 'opacity-70'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kanal ara (A Spor, NTV, Sözcü, HT...)"
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition-all ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-red-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FOCUS VIEW MODE (1 LARGE MAIN STAGE + THUMBNAILS) */}
        {viewMode === 'focus' && (() => {
          const focusedChannel = allChannels.find(c => c.id === focusedChannelId) || allChannels[0];
          return (
            <div className="space-y-4">
              {/* Big Stage */}
              <div className={`rounded-2xl border overflow-hidden transition-all ${
                theme === 'light'
                  ? 'bg-white border-slate-200 shadow-lg'
                  : 'bg-[#101712] border-white/10 shadow-xl'
              }`}>
                {/* Header */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                      style={{ backgroundColor: focusedChannel.brandColor }}
                    >
                      {focusedChannel.shortName}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black tracking-tight">{focusedChannel.name}</span>
                        <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          CANLI
                        </span>
                      </div>
                      <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {focusedChannel.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Toggle */}
                    <button
                      onClick={() => handleToggleSound(focusedChannel.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        unmutedChannelId === focusedChannel.id
                          ? 'bg-emerald-600 text-white'
                          : theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      {unmutedChannelId === focusedChannel.id ? (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-200" />
                          <span>Ses Açık</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>Sesi Aç</span>
                        </>
                      )}
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      onClick={() => handleEnterFullscreen(focusedChannel.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer shadow-sm"
                      title="Köşesiz Tam Ekran"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tam Ekran</span>
                    </button>
                  </div>
                </div>

                {/* Big Aspect Video Container */}
                <div className="aspect-video w-full bg-black relative">
                  <iframe
                    id={`yt-live-${focusedChannel.id}`}
                    src={`https://www.youtube-nocookie.com/embed/${focusedChannel.youtubeId}?autoplay=1&mute=${unmutedChannelId === focusedChannel.id ? '0' : '1'}&controls=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`}
                    title={`${focusedChannel.name} Canlı Yayın`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>

              {/* Smaller Channel Selectors Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
                {allChannels.map(ch => {
                  const isSelected = ch.id === focusedChannel.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setFocusedChannelId(ch.id);
                        handleToggleSound(ch.id);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-600/10 text-white shadow-md'
                          : theme === 'light'
                            ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            : 'bg-[#101712] border-white/5 hover:border-white/15 text-zinc-300'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: ch.brandColor }}
                      >
                        {ch.shortName}
                      </div>
                      <span className="text-[11px] font-bold truncate w-full">{ch.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 3X3 GRID MODE (BÜYÜK, BİRBİRİNE YAKIN VE SADELEŞTİRİLMİŞ BÜTÜNSEL VİDEO DUVARI) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3">
            {filteredChannels.map((channel, index) => {
              const isUnmuted = unmutedChannelId === channel.id;

              return (
                <motion.div
                  key={channel.id}
                  id={`channel-card-${channel.id}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className={`flex flex-col rounded-xl border overflow-hidden transition-all duration-300 group scroll-mt-24 ${
                    highlightedChannelId === channel.id
                      ? 'ring-4 ring-emerald-400 border-emerald-400 scale-[1.01] shadow-2xl'
                      : isUnmuted
                        ? 'ring-2 ring-emerald-500 border-emerald-500/90 shadow-xl shadow-emerald-950/30'
                        : theme === 'light'
                          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                          : 'bg-[#101712] border-white/10 hover:border-white/20 shadow-md'
                  }`}
                >
                  {/* Clean Channel Header: Minimalist & Uncluttered */}
                  <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-white/5 select-none">
                    {/* Left: Channel Brand Icon, Full Name & Subtle Live Dot */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white shadow-sm shrink-0"
                        style={{ backgroundColor: channel.brandColor }}
                      >
                        {channel.shortName}
                      </div>
                      <h3 className={`text-xs sm:text-sm font-bold truncate tracking-tight ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>
                        {channel.name}
                      </h3>
                      <span className="flex items-center gap-1 text-red-500 text-[10px] font-semibold shrink-0 ml-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="hidden xs:inline">Canlı</span>
                      </span>

                      {isUnmuted && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black shrink-0 border border-emerald-500/40">
                          <LiveAudioEqualizer active={true} />
                          <span className="hidden sm:inline">SES AÇIK</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Sound Toggle (Clear touch target) & Fullscreen */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Sound Toggle Button */}
                      <button
                        onClick={() => handleToggleSound(channel.id)}
                        className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                          isUnmuted
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm active:scale-95'
                            : theme === 'light'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white'
                        }`}
                        title={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç (Arka planda çalar)'}
                        aria-label={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç'}
                      >
                        {isUnmuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Kapat</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px] hidden xs:inline">Sesi Aç</span>
                          </>
                        )}
                      </button>

                      {/* Fullscreen Icon Button */}
                      <button
                        onClick={() => handleEnterFullscreen(channel.id)}
                        className={`w-7 h-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                          theme === 'light'
                            ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600'
                            : 'bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white'
                        }`}
                        title="Tam Ekran İzle"
                        aria-label="Tam Ekran"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Video Player Container (16:9 aspect ratio) */}
                  <div className="aspect-video w-full bg-black relative overflow-hidden">
                    <iframe
                      id={`yt-live-${channel.id}`}
                      src={`https://www.youtube-nocookie.com/embed/${channel.youtubeId}?autoplay=1&mute=1&controls=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`}
                      title={`${channel.name} Canlı Yayın`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />

                    {/* Interactive floating sound badge if unmuted */}
                    {isUnmuted && (
                      <div className="absolute top-2 left-2 z-10 bg-black/85 border border-emerald-500/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur-md select-none">
                        <LiveAudioEqualizer active={true} />
                        <span className="text-emerald-400 text-[10px] font-black">SES AKTİF</span>
                        <button
                          onClick={() => handleToggleSound(channel.id)}
                          className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-black cursor-pointer active:scale-95 transition-all shadow"
                          title="Sesi Kapat"
                        >
                          Kapat
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* EMPTY STATE (If search returns 0) */}
        {filteredChannels.length === 0 && (
          <div className={`p-12 text-center rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#101712] border-white/10'
          }`}>
            <Tv className="w-12 h-12 mx-auto text-zinc-500 mb-3" />
            <h3 className="text-base font-bold">Aradığınız kriterde kanal bulunamadı</h3>
            <p className="text-xs text-zinc-400 mt-1">Lütfen arama terimini veya kategori filtresini değiştirin.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tümü');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}

        {/* TV KANALLARI LİSTESİ & REHBERİ (TRT 1, TV8, SHOW TV, STAR TV, KANAL D, NOW TV, HALK TV, TJK TV, İCTİMAİ TV) */}
        <section 
          id="tv-kanallari-listesi"
          aria-labelledby="directory-section-heading"
          className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#101712] border-white/10 shadow-md'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                <Tv className="w-4 h-4" />
                <span>TV Kanalları Listesi & Rehber</span>
              </div>
              <h2 id="directory-section-heading" className="text-lg sm:text-xl font-black mt-1">
                Türkiye & Azerbaycan Canlı TV Kanalları Listesi
              </h2>
              <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                TRT 1, TV8, Show TV, Star TV, Kanal D, NOW TV, Halk TV, TJK TV & Tay TV ve İctimai TV kanalları hakkında güncel yayın bilgileri ve izleme seçenekleri:
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-red-600/10 text-red-500 font-bold border border-red-500/20 whitespace-nowrap self-start md:self-auto">
              Kesintisiz Canlı TV
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {TV_DIRECTORY_CHANNELS.map((ch) => {
              const matchedLiveChannel = allChannels.find(c => 
                c.name.toLowerCase().includes(ch.name.toLowerCase()) || 
                ch.name.toLowerCase().includes(c.name.toLowerCase())
              );

              return (
                <div 
                  key={ch.id}
                  id={ch.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-red-500/30 ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white/[0.03] border-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-black text-base sm:text-lg text-red-500 tracking-tight">
                        {ch.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ch.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            {ch.badge}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                        }`}>
                          {ch.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-emerald-500 mb-1.5">
                      {ch.highlight}
                    </div>

                    <p className={`text-xs leading-relaxed mb-3 ${
                      theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
                    }`}>
                      {ch.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {ch.keywords.slice(0, 2).map((kw, ki) => (
                        <span 
                          key={ki} 
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            theme === 'light' ? 'bg-slate-200/70 text-slate-600' : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {matchedLiveChannel ? (
                      <button
                        onClick={() => {
                          setFocusedChannelId(matchedLiveChannel.id);
                          setViewMode('focus');
                          setUnmutedChannelId(matchedLiveChannel.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          triggerHapticImpact();
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-400 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Canlı İzle</span>
                      </button>
                    ) : ch.streamUrl ? (
                      <a 
                        href={ch.streamUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-400 whitespace-nowrap transition-colors"
                      >
                        <span>İzle</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MOBİL TV & PWA ÜCRETSİZ İNDİR BİLGİ KARTI */}
        <section 
          id="mobil-tv-ucretsiz-indir"
          className={`p-6 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
              : 'bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border-emerald-500/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Mobil TV & PWA</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                Televizyon Kanalları Ücretsiz İndir (Mobil TV)
              </h3>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                theme === 'light' ? 'text-slate-600' : 'text-zinc-300'
              }`}>
                VOX Mobil TV uygulamasını telefonunuza tek tıkla ücretsiz indirin. Mağaza aramadan iPhone ve Android cihazınızda tarayıcınızın <strong>"Ana Ekrana Ekle"</strong> butonuna dokunarak TV kanalları listesine her an kesintisiz ve donmadan ulaşabilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Ücretsiz Yükle</span>
              </span>
            </div>
          </div>
        </section>

        {/* SEO & GEMINI AI KNOWLEDGE HUB / FAQ SECTION */}
        <section 
          id="canli-tv-bilgi-merkezi"
          aria-labelledby="faq-section-heading"
          className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#101712] border-white/10 shadow-md'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Google & Gemini AI Uyumlu SSS</span>
              </div>
              <h2 id="faq-section-heading" className="text-lg sm:text-xl font-black mt-1">
                Canlı TV & Kanallar Hakkında Sıkça Sorulan Sorular
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Doğrulanmış Bilgi Altyapısı</span>
            </div>
          </div>

          {/* SSS / Accordion Items */}
          <div className="divide-y divide-white/10 mt-2">
            {LIVE_TV_SEO_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base gap-4 cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="group-hover:text-red-500 transition-colors">{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-500' : 'text-zinc-400'}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className={`text-xs sm:text-sm mt-2.5 leading-relaxed ${
                          theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
                        }`}>
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER NOTICE / STREAM INFORMATION */}
        <div className={`p-4 rounded-xl border text-[11px] space-y-1 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/5 text-zinc-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">Yayın Bilgilendirmesi</span>
            <span className="font-mono text-[10px]">{allChannels.length} Canlı Kanal Listeleniyor</span>
          </div>
          <p>
            Tüm canlı yayınlar doğrudan haber ve spor kuruluşlarının resmi YouTube yayın akışlarından beslenmektedir. Tarayıcı ses politikaları ve kullanıcı konforu gereği sayfadaki tüm yayınlar sessiz modda başlar. Dilediğiniz yayının sesini "Sesi Aç" butonuna basarak dinleyebilirsiniz.
          </p>
        </div>

      </div>

      {/* PERSISTENT FLOATING LIVE TV AUDIO DOCK (Sticky Mini-Bar for Mobile & Desktop) */}
      <AnimatePresence>
        {unmutedChannelId && currentUnmutedChannel && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={`fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-auto sm:min-w-[360px] sm:max-w-md z-40 p-3 rounded-2xl border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 select-none transition-colors ${
              theme === 'light'
                ? 'bg-white/95 border-emerald-500/50 text-slate-900 shadow-emerald-950/15'
                : 'bg-[#0f1712]/95 border-emerald-500/50 text-white shadow-black/80'
            }`}
          >
            {/* Left: Channel Brand Icon & Equalizer & Name */}
            <div 
              onClick={() => scrollToChannel(currentUnmutedChannel.id)}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              title="Kanala gitmek için tıklayın"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: currentUnmutedChannel.brandColor }}
              >
                {currentUnmutedChannel.shortName}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <LiveAudioEqualizer active={true} />
                  <span className="text-xs font-black truncate group-hover:text-emerald-400 transition-colors">
                    {currentUnmutedChannel.name}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-500 font-semibold truncate flex items-center gap-1">
                  <span>Sesi Açık</span>
                  <span>•</span>
                  <span>Safari/Chrome arka planda çalar</span>
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => scrollToChannel(currentUnmutedChannel.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                }`}
                title="Kanala Kaydır"
              >
                Kanala Git
              </button>
              <button
                onClick={() => handleToggleSound(currentUnmutedChannel.id)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Sesi Kapat"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Sesi Kapat</span>
              </button>
              <button
                onClick={() => handleEnterFullscreen(currentUnmutedChannel.id)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                }`}
                title="Tam Ekran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
