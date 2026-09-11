import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { LIVE_TV_CHANNELS, LiveTvChannel } from '../data/liveTvData';

type ViewMode = 'grid' | 'focus';

export function LiveTvPage() {
  const { theme } = useTheme();

  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Layout mode: 'grid' (3x3) or 'focus' (1 main + thumbnails)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  // Active focused channel (for focus mode or fullscreen)
  const [focusedChannelId, setFocusedChannelId] = useState<string>(LIVE_TV_CHANNELS[0].id);

  // Audio Coordination: Which channel currently has audio unmuted? (null = ALL MUTED)
  const [unmutedChannelId, setUnmutedChannelId] = useState<string | null>(null);

  // Cinema Mode (Hide Left Sidebar for Full-Screen news viewing)
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // FAQ Accordion Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  // Comprehensive SEO & GEO Optimization for Google Search & Google Gemini
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Canlı TV - Kesintisiz Canlı Haber Kanalları İzle | VOX';

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'CNN TÜRK, Sözcü TV, HalkTV, Habertürk, NTV, Bloomberg HT, TRT Haber, TV100 ve Haber Global canlı yayınlarını tek ekranda donmadan, reklamsız ve kesintisiz izleyin.');

    // Inject Rich JSON-LD Structured Data for Google Rich Snippets & Gemini AI Overviews
    const jsonLdId = 'vox-canli-tv-jsonld';
    let scriptTag = document.getElementById(jsonLdId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = jsonLdId;
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://voxozet.com/canli-tv',
          'url': 'https://voxozet.com/canli-tv',
          'name': 'Canlı TV - Kesintisiz Canlı Haber Kanalları İzle | VOX',
          'description': 'Türkiye’nin 9 lider haber kanalının resmi canlı yayınları tek ekranda mozaik ve odak modunda.',
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
              }
            ]
          }
        },
        {
          '@type': 'ItemList',
          'name': 'VOX Canlı TV Haber Kanalları Listesi',
          'numberOfItems': LIVE_TV_CHANNELS.length,
          'itemListElement': LIVE_TV_CHANNELS.map((ch, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': ch.name,
            'url': ch.youtubeUrl,
            'description': ch.description
          }))
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'VOX Canlı TV sayfasında hangi kanallar izlenebilir?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'VOX Canlı TV sayfasında CNN TÜRK, Sözcü TV, HalkTV, Habertürk, NTV, Bloomberg HT, TRT Haber, TV100 ve Haber Global kanallarının resmi YouTube canlı yayınları tek ekranda eş zamanlı olarak izlenebilir.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Canlı TV yayınları ücretsiz midir?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Evet, VOX Canlı TV tamamen ücretsizdir. Herhangi bir abonelik, üyelik veya kart bilgisi gerekmeksizin tüm haber yayınları kesintisiz izlenebilir.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Yayınların sesi neden sayfa açıldığında kapalıdır?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Aynı anda 9 farklı kanalın sesinin birbirine girmesini önlemek ve tarayıcı ses politikalarına uyum sağlamak için tüm yayınlar varsayılan olarak sessiz başlar. İzlemek istediğiniz kanalın sesini tek bir tıkla açabilirsiniz. Bir kanalın sesi açıldığında diğerleri otomatik susturulur.'
              }
            },
            {
              '@type': 'Question',
              'name': 'Geniş Ekran ve F11 Sinema Modu nasıl kullanılır?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Klavyenizden F11 tuşuna basarak veya üst kontrol çubuğundaki Geniş Ekran / Menüyü Gizle butonuna tıklayarak sol kenar çubuğunu gizleyebilir ve haber kutularının monitörünüzün tamamına yayılmasını sağlayabilirsiniz.'
              }
            }
          ]
        }
      ]
    };

    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      document.title = prevTitle;
      if (prevDesc && metaDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
      const existing = document.getElementById(jsonLdId);
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // Filter channels based on category and search
  const filteredChannels = LIVE_TV_CHANNELS.filter(ch => {
    const matchesCat = selectedCategory === 'Tümü' || ch.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Helper to send postMessage commands to YouTube iframes
  const sendIframeCommand = useCallback((channelId: string, func: 'mute' | 'unMute' | 'setVolume', args: any[] = []) => {
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
    } else {
      // Mute all other channels first to prevent audio clash
      LIVE_TV_CHANNELS.forEach(ch => {
        if (ch.id !== channelId) {
          sendIframeCommand(ch.id, 'mute');
        }
      });

      // Unmute and set volume to 100 on the selected channel
      sendIframeCommand(channelId, 'unMute');
      sendIframeCommand(channelId, 'setVolume', [100]);
      setUnmutedChannelId(channelId);
    }
  }, [unmutedChannelId, sendIframeCommand]);

  // Mute all channels
  const handleMuteAll = useCallback(() => {
    LIVE_TV_CHANNELS.forEach(ch => {
      sendIframeCommand(ch.id, 'mute');
    });
    setUnmutedChannelId(null);
  }, [sendIframeCommand]);

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
  const currentUnmutedChannel = LIVE_TV_CHANNELS.find(c => c.id === unmutedChannelId);
  const activeFsChannel = LIVE_TV_CHANNELS.find(c => c.id === fullscreenChannelId);

  return (
    <div className={`min-h-screen px-3 sm:px-6 lg:px-8 py-5 md:py-8 transition-colors ${
      theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#0a0d0b] text-white'
    }`}>
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
              <div className="hidden lg:flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15">
                {LIVE_TV_CHANNELS.map(ch => {
                  const isCurrent = ch.id === activeFsChannel.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setFullscreenChannelId(ch.id);
                        handleToggleSound(ch.id);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
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
                <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <Tv className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <span>Canlı TV</span>
                  <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    CANLI YAYIN
                  </span>
                </h1>
              </div>
              <p className={`text-xs sm:text-sm font-normal max-w-2xl ${
                theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
              }`}>
                Türkiye'nin önde gelen 9 haber kanalının kesintisiz canlı yayınları tek ekranda. Tüm yayınlar otomatik ve <strong>sessiz</strong> başlar; dilediğiniz kanalın sesini tek tıkla açabilir, <strong>F11 Geniş Ekran</strong> veya tam ekran modunda kesintisiz izleyebilirsiniz.
              </p>
            </div>

            {/* Master Sound & Layout Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              {/* Sound Status Banner / Quick Mute All */}
              {unmutedChannelId ? (
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="truncate max-w-[150px]">
                    {currentUnmutedChannel?.name || 'Ses Açık'}
                  </span>
                  <button
                    onClick={handleMuteAll}
                    className="ml-1 text-[11px] underline hover:text-white transition-colors cursor-pointer"
                    title="Tümünü Sessize Al"
                  >
                    Sessize Al
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
                  title="3x3 Mozaik Izgara"
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
              {['Tümü', 'Gündem', 'Ekonomi'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white shadow-sm'
                      : theme === 'light'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat} {cat === 'Tümü' ? `(${LIVE_TV_CHANNELS.length})` : cat === 'Gündem' ? '(8)' : '(1)'}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kanal ara (NTV, Sözcü, CNN...)"
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

        {/* FOCUS VIEW MODE (1 LARGE MAIN STAGE + 8 THUMBNAILS) */}
        {viewMode === 'focus' && (() => {
          const focusedChannel = LIVE_TV_CHANNELS.find(c => c.id === focusedChannelId) || LIVE_TV_CHANNELS[0];
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
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {LIVE_TV_CHANNELS.map(ch => {
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
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className={`flex flex-col rounded-xl border overflow-hidden transition-all duration-200 group ${
                    isUnmuted
                      ? 'ring-2 ring-emerald-500 border-emerald-500/80 shadow-lg'
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
                    </div>

                    {/* Right: Only 2 Essential Controls (Sleek Icon Buttons) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Sound Toggle Icon Button */}
                      <button
                        onClick={() => handleToggleSound(channel.id)}
                        className={`w-7 h-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                          isUnmuted
                            ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                            : theme === 'light'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                        }`}
                        title={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç'}
                        aria-label={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç'}
                      >
                        {isUnmuted ? (
                          <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
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

                    {/* Subtle floating sound badge if unmuted */}
                    {isUnmuted && (
                      <div className="absolute top-2 left-2 z-10 pointer-events-none bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md backdrop-blur-sm">
                        <Volume2 className="w-3 h-3" />
                        <span>Ses Aktif</span>
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
                <span>Bilgi & Rehber</span>
              </div>
              <h2 id="faq-section-heading" className="text-lg sm:text-xl font-black mt-1">
                VOX Canlı TV Hakkında & Sıkça Sorulan Sorular
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Resmi YouTube API Akışları</span>
            </div>
          </div>

          {/* SSS / Accordion Items */}
          <div className="divide-y divide-white/10 mt-2">
            {[
              {
                q: "VOX Canlı TV'de hangi haber kanalları yer alıyor?",
                a: "VOX Canlı TV sayfasında CNN TÜRK, Sözcü TV, HalkTV, Habertürk, NTV, Bloomberg HT, TRT Haber, TV100 ve Haber Global olmak üzere Türkiye'nin önde gelen 9 haber ve ekonomi kanalının resmi YouTube canlı yayınları tek ekranda eş zamanlı olarak sunulmaktadır."
              },
              {
                q: "F11 Geniş Ekran ve Sinema Modu nasıl çalışır?",
                a: "Klavyenizden F11 tuşuna bastığınızda veya üst araç çubuğundaki 'Geniş Ekran' butonuna tıkladığınızda sol kenar menüsü otomatik olarak gizlenir. Böylece 9 haber kutusu ekranınızın tüm yüzeyine yayılarak maksimum izleme alanı elde edilir. Menüyü geri getirmek için sol üstte beliren 'Menüyü Göster' butonuna basabilir veya ESC/F11 tuşunu kullanabilirsiniz."
              },
              {
                q: "Yayınların sesi neden başta kapalı ve ses nasıl açılır?",
                a: "Aynı anda 9 farklı kanalın sesinin birbirine girmesini önlemek ve web tarayıcılarının otomatik oynatma güvenlik politikalarına uymak için tüm yayınlar varsayılan olarak sessiz başlar. Takip etmek istediğiniz kanalın kutucuğundaki 'Sesi Aç' butonuna basarak anında net ses alabilirsiniz. Bir kanalın sesini açtığınızda diğer tüm kanallar otomatik olarak sessize alınır."
              },
              {
                q: "Canlı TV yayını izlemek ücretli midir veya üyelik gerekir mi?",
                a: "Hayır, VOX Canlı TV tamamen ücretsizdir. Herhangi bir üyelik, kayıt veya ödeme gerekmeden tüm haber kanallarını 7/24 kesintisiz ve donmadan izleyebilirsiniz."
              },
              {
                q: "Yayınlar resmi ve güvenli midir?",
                a: "Evet. VOX Canlı TV'deki tüm video yayınları, ilgili yayın kuruluşlarının onaylı YouTube resmi yayın akışlarından beslenmektedir. Sayfamızda üçüncü taraf korsan yayınlar kesinlikle yer almaz."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base gap-4 cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="group-hover:text-red-500 transition-colors">{faq.q}</span>
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
                          {faq.a}
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
            <span className="font-mono text-[10px]">9 Canlı Kanal Aktif</span>
          </div>
          <p>
            Tüm canlı yayınlar doğrudan haber kuruluşlarının resmi YouTube yayın akışlarından beslenmektedir. Tarayıcı ses politikaları ve kullanıcı konforu gereği sayfadaki tüm yayınlar sessiz modda başlar. Dilediğiniz yayının sesini "Sesi Aç" butonuna basarak dinleyebilirsiniz.
          </p>
        </div>

      </div>
    </div>
  );
}
