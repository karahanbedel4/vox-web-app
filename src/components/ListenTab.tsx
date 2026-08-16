import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, Sparkles, CloudRain, ShieldCheck, ChevronUp, ChevronDown, X, Clock, Languages, Loader2, AlertTriangle, Youtube, ArrowRight, Sliders, Square } from 'lucide-react';
import { Article } from '../types';
import { PlaybackState } from '../lib/ttsService';

interface ListenTabProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onSetRate: (rate: number) => void;
  isAmbientActive: boolean;
  activeAmbientName?: string;
  onToggleAmbient: () => void;
  onStopAmbient?: () => void;
  onToggleLanguage?: (lang: 'tr' | 'en') => void;
  isTranslating?: boolean;
  onImportSuccess?: (article: Article) => void;
}

interface SentenceItem {
  id: number;
  text: string;
  startWordIndex: number;
  endWordIndex: number;
  startTime: number;
  endTime: number;
}

export const ListenTab: React.FC<ListenTabProps> = ({
  playbackState,
  onPlay,
  onPause,
  onSeek,
  onSetRate,
  isAmbientActive,
  activeAmbientName,
  onToggleAmbient,
  onStopAmbient,
  onToggleLanguage,
  isTranslating = false,
  onImportSuccess
}) => {
  const { isPlaying, currentTime, duration, playbackRate, currentWordIndex, currentArticle, chunkMetas, currentChunkIndex, languageMode } = playbackState;

  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [expandedTranscript, setExpandedTranscript] = useState(false);
  const [ytUrlInput, setYtUrlInput] = useState('');
  const [isProcessingYt, setIsProcessingYt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement | null>(null);

  // Find matching active sentence index based on current time
  const sentences = chunkMetas && chunkMetas.length > 0 ? chunkMetas : [];
  let safeActiveIndex = currentChunkIndex || 0;
  if (sentences.length > 0) {
    const foundIdx = sentences.findIndex(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    );
    if (foundIdx >= 0) {
      safeActiveIndex = foundIdx;
    } else if (currentTime >= (sentences[sentences.length - 1]?.endTime || 0)) {
      safeActiveIndex = sentences.length - 1;
    }
  }

  // Auto-scroll expanded transcript to active sentence
  useEffect(() => {
    if (expandedTranscript && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [safeActiveIndex, expandedTranscript]);

  // YouTube URL processing with detailed console.error logging & user error state management
  const handleProcessYouTubeUrl = async (urlToProcess?: string) => {
    const targetUrl = (urlToProcess || ytUrlInput).trim();
    if (!targetUrl) {
      setErrorMessage('Lütfen geçerli bir YouTube video bağlantısı (URL) girin.');
      return;
    }

    setIsProcessingYt(true);
    setErrorMessage(null);

    try {
      console.info(`[ListenTab] Processing YouTube URL: ${targetUrl}`);
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'youtube',
          url: targetUrl,
          summaryLength: 'normal'
        })
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any = null;
      const rawText = await response.text();
      try {
        json = JSON.parse(rawText);
      } catch {
        // Not JSON
      }

      if (!response.ok || !json?.success || !json?.data) {
        const serverError = json?.message || json?.error || (rawText.trim().startsWith('<') ? 'Sunucu geçici olarak yanıt veremedi. Lütfen tekrar deneyin.' : rawText) || 'YouTube videosu işlenirken bir sorun oluştu.';
        console.error('[ListenTab YouTube API Failure]:', { status: response.status, json, rawText });
        throw new Error(serverError);
      }

      const videoIdMatch = targetUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      const newArticle: Article = {
        id: 'vox_yt_' + Date.now(),
        title: json.data.title || 'YouTube Sesli Bülten',
        summary: json.data.summary || 'YouTube video özet metni.',
        content: json.data.content || '',
        category: json.data.category || 'Teknoloji',
        sourceUrl: targetUrl,
        sourceType: 'youtube',
        durationSeconds: json.data.durationSeconds || 300,
        imageUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : (json.data.imageUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80'),
        createdAt: new Date().toISOString(),
        author: json.data.author || 'YouTube Yayıncısı',
        keyPoints: json.data.keyPoints
      };

      setYtUrlInput('');
      if (onImportSuccess) {
        onImportSuccess(newArticle);
      }
    } catch (err: unknown) {
      console.error('[ListenTab YouTube Error Catch Block]:', err);
      const userMsg = (err as Error)?.message || 'YouTube URL işlenirken beklenmeyen bir hata oluştu. Lütfen bağlantıyı kontrol edip tekrar deneyin.';
      setErrorMessage(userMsg);
    } finally {
      setIsProcessingYt(false);
    }
  };

  if (!currentArticle) {
    return (
      <div className="pt-20 pb-28 px-4 max-w-md mx-auto text-center space-y-6 text-on-surface">
        <div className="w-24 h-24 rounded-full bg-surface-container/80 border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(111,251,190,0.15)]">
          <Volume2 className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="font-display text-2xl font-bold">Henüz Bir İçerik Seçilmedi</h2>
        <p className="text-xs text-on-surface-variant">
          Haber akışından bir haber seçin veya direkt aşağıya bir YouTube video adresi yapıştırıp hemen dinleyin.
        </p>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-left text-xs flex items-start gap-3 shadow-lg animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-bold text-red-300 block">YouTube İşleme Hatası</span>
              <p>{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick YouTube URL Loader Form */}
        <div className="bg-surface-container/90 border border-white/10 rounded-2xl p-4 text-left space-y-3 shadow-xl">
          <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Youtube className="w-4 h-4 text-red-500" /> YouTube Videosu Dinle
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={ytUrlInput}
              onChange={(e) => setYtUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProcessYouTubeUrl()}
              className="flex-1 bg-surface-container-high border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => handleProcessYouTubeUrl()}
              disabled={isProcessingYt || !ytUrlInput.trim()}
              className="bg-primary text-on-primary hover:brightness-110 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 disabled:opacity-50 transition-all active:scale-95 shrink-0"
            >
              {isProcessingYt ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEnglish = languageMode === 'en';
  const displayTitle = isEnglish && currentArticle.englishTitle ? currentArticle.englishTitle : currentArticle.title;

  // Formatting helpers
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, duration - currentTime);

  const currentSentence = sentences[safeActiveIndex] || {
    text: `${displayTitle}. ${currentArticle.summary}. ${currentArticle.content}`
  };

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto flex flex-col justify-between min-h-[80vh] text-on-surface select-none">
      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-left text-xs flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold text-red-300 block">YouTube / İşlem Hatası</span>
            <p>{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Tag */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant border border-white/10 text-[10px] font-bold text-primary tracking-widest uppercase shadow-sm">
          <Sparkles className="w-3 h-3" /> VOX PODCAST STÜDYO
        </div>
        <h1 className="font-display text-xl font-bold leading-snug pt-1">
          {displayTitle}
        </h1>
        <p className="text-xs text-on-surface-variant">
          Seslendiren: {currentArticle.author || 'VOX Studio AI'} • {formatTime(remainingTime)} kaldı
        </p>

        {/* Language Switcher Bar (TR / EN Podcast) */}
        {onToggleLanguage && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="inline-flex p-1 rounded-full bg-surface-container-high/90 border border-white/15 shadow-md">
              <button
                onClick={() => onToggleLanguage('tr')}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  languageMode === 'tr'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🇹🇷</span>
                <span>Türkçe</span>
              </button>
              <button
                onClick={() => onToggleLanguage('en')}
                disabled={isTranslating}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  languageMode === 'en'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {isTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <span>🇬🇧</span>
                )}
                <span>English (Podcast)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Album Cover / Content Thumbnail */}
      <div className="my-3 relative max-w-[200px] mx-auto aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
        <img
          src={currentArticle.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80'}
          alt={currentArticle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/90 text-on-primary px-2 py-0.5 rounded-full">
            {currentArticle.sourceType.toUpperCase()}
          </span>
          <span className="text-[10px] text-white/80 font-mono">
            {currentArticle.category}
          </span>
        </div>
      </div>

      {/* Modern Waveform + Live Transcript Card (as requested in mockup) */}
      <div className="my-4 relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-emerald-950/70 via-surface-container/90 to-surface-container p-5 text-left shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-4">
        {/* Animated Green Waveform at top */}
        <div className="flex items-end justify-center gap-1.5 h-12 px-2 opacity-90">
          {Array.from({ length: 32 }).map((_, idx) => {
            const height = isPlaying
              ? 12 + Math.sin(idx * 0.6 + currentTime * 4) * 18 + (idx % 3) * 6
              : 6 + (idx % 4) * 3;
            return (
              <div
                key={idx}
                className="w-1 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                style={{ height: `${Math.max(4, Math.min(42, height))}px` }}
              />
            );
          })}
        </div>

        {/* Header row inside transcript box */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSKRİPT</span>
          </div>
          <button
            onClick={() => setExpandedTranscript(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1 rounded-full transition-all active:scale-95 shadow-sm"
          >
            <span>TÜMÜNÜ GÖR</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Active Sentence Text */}
        <div 
          onClick={() => setExpandedTranscript(true)}
          className="py-1 min-h-[64px] flex items-center cursor-pointer group"
        >
          <p className="font-serif text-base leading-relaxed text-white font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] line-clamp-3 group-hover:text-emerald-200 transition-colors">
            {currentSentence?.text || currentArticle.summary || currentArticle.title}
          </p>
        </div>

        {/* Bottom Emerald Progress Bar */}
        <div className="w-full bg-emerald-950/60 h-1.5 rounded-full overflow-hidden border border-emerald-500/20">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-300 shadow-[0_0_10px_rgba(78,222,163,0.8)]"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Expanded YouTube Music / Spotify - Style Lyrics Modal */}
      {expandedTranscript && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-emerald-950 via-neutral-950 to-black backdrop-blur-2xl p-6 overflow-hidden flex flex-col justify-between max-w-md mx-auto animate-fade-in text-on-surface">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase block">
                {currentArticle.category} • TRANSKRİPT
              </span>
              <h3 className="font-display text-sm font-bold truncate max-w-[240px] text-white">
                {displayTitle}
              </h3>
            </div>
            <button
              onClick={() => setExpandedTranscript(false)}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            >
              <span>DARALT</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Scrolling Transcript Lines (YouTube Music Style Lyrics) */}
          <div className="my-4 flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-emerald-500/30 py-4">
            {sentences.map((st, idx) => {
              const isActive = idx === safeActiveIndex;
              return (
                <div
                  key={st.index ?? `chunk-${idx}-${st.startTime}`}
                  ref={isActive ? activeSentenceRef : null}
                  onClick={() => onSeek(st.startTime)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-start gap-3 ${
                    isActive
                      ? 'bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_25px_rgba(78,222,163,0.2)] scale-[1.02]'
                      : 'hover:bg-white/5 opacity-50 hover:opacity-90'
                  }`}
                >
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 mt-1 ${
                    isActive ? 'bg-emerald-400 text-black font-bold' : 'bg-white/10 text-white/60'
                  }`}>
                    {formatTime(st.startTime)}
                  </span>
                  <p className={`font-serif leading-relaxed ${
                    isActive
                      ? 'text-xl font-bold text-white drop-shadow-[0_0_15px_rgba(78,222,163,0.6)]'
                      : 'text-base font-medium text-white/70'
                  }`}>
                    {st.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Floating Mini Player Control */}
          <div className="bg-surface-container/90 border border-emerald-500/30 p-4 rounded-3xl backdrop-blur-xl shrink-0 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="flex-1 mx-3 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span>-{formatTime(remainingTime)}</span>
            </div>

            <div className="flex items-center justify-between px-2">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-emerald-300"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => onSeek(currentTime - 10)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={isPlaying ? onPause : onPlay}
                className="w-14 h-14 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(78,222,163,0.5)] active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => onSeek(currentTime + 30)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleAmbient}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isAmbientActive ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white/50'
                }`}
              >
                <CloudRain className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doğa Sesleri & Ambiyans Mikseri Launcher Card */}
      <div className={`border p-3.5 rounded-3xl flex items-center justify-between shadow-sm transition-all ${
        isAmbientActive 
          ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(78,222,163,0.15)]' 
          : 'bg-gradient-to-r from-emerald-950/40 via-surface-container to-surface-container border border-primary/30'
      }`}>
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <CloudRain className="w-4 h-4 animate-pulse" />
          </div>
          <div className="truncate">
            <h3 className="font-display font-extrabold text-xs text-on-surface truncate">
              {isAmbientActive ? `ÇALINIYOR: ${activeAmbientName || 'Doğa Sesleri'}` : 'DOĞA & ODAK SESLERİ MİKSERİ'}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-medium truncate">
              {isAmbientActive ? 'Bağımsız Arka Plan Ambiyans Sesi' : 'Yağmur, Fırtına & YouTube Arka Plan Sesleri'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAmbientActive && onStopAmbient && (
            <button
              onClick={onStopAmbient}
              className="bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold text-xs px-3 py-2 rounded-2xl flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Durdur</span>
            </button>
          )}

          <button
            onClick={onToggleAmbient}
            className="bg-primary text-on-primary font-extrabold text-xs px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAmbientActive ? 'Mikser' : 'Mikseri Aç'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="space-y-6">
        {/* Seek Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Primary Playback Buttons */}
        <div className="flex items-center justify-between px-2">
          {/* Speed Selector Button */}
          <div className="relative">
            <button
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-primary hover:bg-white/10"
            >
              {playbackRate}x
            </button>
            {speedMenuOpen && (
              <div className="absolute bottom-10 left-0 bg-surface-container border border-white/15 rounded-xl p-2 flex flex-col gap-1 z-50 shadow-2xl">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      onSetRate(r);
                      setSpeedMenuOpen(false);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${playbackRate === r ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-white/10'}`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rewind 10s */}
          <button
            onClick={() => onSeek(currentTime - 10)}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface hover:text-primary active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play / Pause Main Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_30px_rgba(78,222,163,0.4)] active:scale-95 transition-transform hover:brightness-110"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* Forward 30s */}
          <button
            onClick={() => onSeek(currentTime + 30)}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface hover:text-primary active:scale-95 transition-transform"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* WoodRainSynth Ambient Background Toggle */}
          <button
            onClick={onToggleAmbient}
            title="Ahşap Yağmuru Mikseri Katmanı"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isAmbientActive
                ? 'bg-primary/20 text-primary border border-primary shadow-[0_0_15px_rgba(78,222,163,0.3)]'
                : 'bg-white/5 text-on-surface-variant/60 border border-white/10'
            }`}
          >
            <CloudRain className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

