import React from 'react';
import { Play, Pause, X, RotateCw, Volume2 } from 'lucide-react';
import { Article } from '../types';
import { PlaybackState } from '../lib/ttsService';
import { getTopicContextualImage, sanitizeImageUrl, DEFAULT_VOX_FALLBACK_IMAGE } from '../lib/newsService';

interface MiniPlayerProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onOpenFullPlayer: () => void;
  onClose: () => void;
  onSeekForward?: () => void;
  isHidden?: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  playbackState,
  onPlay,
  onPause,
  onOpenFullPlayer,
  onClose,
  onSeekForward,
  isHidden = false,
}) => {
  const { currentArticle, isPlaying, currentTime, duration, isMiniPlayerDismissed } = playbackState;

  if (!currentArticle || isHidden || isMiniPlayerDismissed) {
    return null;
  }

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      onClick={onOpenFullPlayer}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,16px))] left-0 right-0 z-40 max-w-md mx-auto px-3 transition-all duration-300 ease-out cursor-pointer group"
    >
      <div className="relative overflow-hidden bg-surface-container-high/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] hover:border-primary/40 transition-all">
        {/* Top Progress Line (YouTube Music style) */}
        <div className="w-full bg-white/10 h-[3px] absolute top-0 left-0 right-0 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-linear shadow-[0_0_8px_var(--color-primary)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 pt-3 gap-3">
          {/* Thumbnail & Equalizer */}
          <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-surface-container border border-white/10 shadow-md">
            {currentArticle.imageUrl ? (
              <img
                src={sanitizeImageUrl(currentArticle.imageUrl)}
                alt={currentArticle.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getTopicContextualImage(currentArticle.title, currentArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-surface-container flex items-center justify-center text-primary font-bold text-sm">
                VOX
              </div>
            )}

            {/* Playing Indicator Overlay */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-[2px]">
                <span className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-0.5 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-0.5 h-2.5 bg-primary rounded-full animate-bounce" />
              </div>
            )}
          </div>

          {/* Title & Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors leading-snug">
              {currentArticle.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
              <span className="truncate max-w-[120px] font-medium text-primary/90">
                {currentArticle.author || currentArticle.category || 'VOX Audio'}
              </span>
              <span>•</span>
              <span className="tabular-nums font-mono text-[10px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Play / Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) {
                  onPause();
                } else {
                  onPlay();
                }
              }}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              title={isPlaying ? 'Durdur' : 'Oynat'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Seek +15s (Optional) */}
            {onSeekForward && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekForward();
                }}
                className="w-8 h-8 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center justify-center transition-colors active:scale-90"
                title="15 saniye ileri"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Dismiss / Close */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5 flex items-center justify-center transition-colors active:scale-90"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
