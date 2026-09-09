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
  ChevronRight, 
  ExternalLink,
  Search,
  Check,
  RotateCcw,
  SlidersHorizontal,
  X
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

  // Fullscreen state: which channel is in full screen (null = none)
  const [fullscreenChannelId, setFullscreenChannelId] = useState<string | null>(null);
  const [isFullscreenOverlayControlsVisible, setIsFullscreenOverlayControlsVisible] = useState<boolean>(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="max-w-7xl mx-auto space-y-6">
        
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
                Türkiye'nin önde gelen 9 haber kanalının kesintisiz canlı yayınları tek ekranda. Tüm yayınlar otomatik ve <strong>sessiz</strong> başlar; dilediğiniz kanalın sesini tek tıkla açabilir, köşesiz tam ekran modunda kesintisiz izleyebilirsiniz.
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
                  title="Odak Modu (1 Büyük Ekran)"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Odak</span>
                </button>
              </div>
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

        {/* 3X3 GRID MODE (KUTU KUTU SAYFAYI KAPLAYACAK ŞEKİLDE) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {filteredChannels.map((channel, index) => {
              const isUnmuted = unmutedChannelId === channel.id;

              return (
                <motion.div
                  key={channel.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl group ${
                    isUnmuted
                      ? 'ring-2 ring-emerald-500 border-emerald-500/50'
                      : theme === 'light'
                        ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                        : 'bg-[#101712] border-white/10 hover:border-white/20 shadow-md'
                  }`}
                >
                  {/* Channel Header */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/10">
                    {/* Left: Channel Brand Icon & Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] text-white shadow-sm shrink-0"
                        style={{ backgroundColor: channel.brandColor }}
                      >
                        {channel.shortName}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs sm:text-sm font-black truncate tracking-wide">
                            {channel.name}
                          </h3>
                          <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            CANLI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Sound Toggle Button */}
                      <button
                        onClick={() => handleToggleSound(channel.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isUnmuted
                            ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                            : theme === 'light'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                        }`}
                        title={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç (Diğerlerini Sessize Alır)'}
                        aria-label={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç'}
                      >
                        {isUnmuted ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                            <span className="text-[10px] hidden sm:inline">Ses Açık</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">Sessiz</span>
                          </>
                        )}
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        onClick={() => handleEnterFullscreen(channel.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600'
                            : 'bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white'
                        }`}
                        title="Köşesiz Tam Ekran İzle"
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

                    {/* Bottom floating sound pill if unmuted */}
                    {isUnmuted && (
                      <div className="absolute top-2 left-2 z-10 pointer-events-none bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <Volume2 className="w-3 h-3" />
                        <span>Ses Aktif</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Info & Links */}
                  <div className="p-3 flex items-center justify-between text-[11px] border-t border-white/10">
                    <span className={`truncate max-w-[180px] font-medium ${
                      theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                    }`}>
                      {channel.description}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEnterFullscreen(channel.id)}
                        className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Genişlet</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <a
                        href={channel.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                        title="YouTube'da Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
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
