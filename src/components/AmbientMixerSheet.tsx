import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Volume2, VolumeX, Plus, X, Check, Youtube, Music, Play, Square, Sparkles } from 'lucide-react';
import { triggerHapticImpact } from '../lib/haptics';
import { woodRainSynth } from '../lib/audioSynth';

export interface AmbientChannel {
  id: string;
  name: string;
  type: 'youtube' | 'synth' | 'stream';
  url?: string;
  youtubeId?: string;
  volume: number; // 0-100
  active: boolean;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

interface AmbientMixerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  channels: AmbientChannel[];
  onToggleChannel: (id: string) => void;
  onVolumeChange: (id: string, vol: number) => void;
  onAddCustomChannel: (name: string, url: string) => void;
}

export const AmbientMixerSheet: React.FC<AmbientMixerSheetProps> = ({
  isOpen,
  onClose,
  channels,
  onToggleChannel,
  onVolumeChange,
  onAddCustomChannel
}) => {
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [customInputName, setCustomInputName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Sync MP3 audio streams and Synth engine
  useEffect(() => {
    // 1. Synth Channels sync
    const activeSynthChannels = channels.filter(c => c.type === 'synth' && c.active && c.volume > 0);
    if (activeSynthChannels.length > 0) {
      woodRainSynth.start();
      activeSynthChannels.forEach(ch => {
        woodRainSynth.setChannelVolume(ch.id === 'synth-rain' ? 'rain' : ch.id, ch.volume / 100);
      });
    } else {
      woodRainSynth.stop();
    }

    // 2. Stream Audio Elements sync
    channels.forEach(ch => {
      if (ch.type === 'stream' && ch.url) {
        if (!audioRefs.current[ch.id]) {
          const audio = new Audio(ch.url);
          audio.loop = true;
          audioRefs.current[ch.id] = audio;
        }
        const audio = audioRefs.current[ch.id];
        if (ch.active && ch.volume > 0) {
          audio.volume = ch.volume / 100;
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
    });

    // 3. YouTube Iframes volume & mute sync
    channels.forEach(ch => {
      if (ch.type === 'youtube' && ch.youtubeId && ch.active) {
        const iframe = document.getElementById(`yt-player-${ch.id}`) as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'setVolume',
              args: [ch.volume]
            }), '*');
            if (ch.volume === 0) {
              iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'mute'
              }), '*');
            } else {
              iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'unMute'
              }), '*');
            }
          } catch (e) {}
        }
      }
    });
  }, [channels]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const triggerHaptic = () => {
    triggerHapticImpact('light').catch(() => {});
  };

  const handleAddCustom = () => {
    if (!customInputUrl.trim()) return;
    triggerHaptic();
    onAddCustomChannel(customInputName.trim(), customInputUrl.trim());
    setCustomInputUrl('');
    setCustomInputName('');
    setShowAddCustom(false);
  };

  return (
    <>
      {/* ALWAYS MOUNTED HIDDEN YOUTUBE IFRAMES (Keeps playing even when modal popup is closed!) */}
      <div className="hidden pointer-events-none opacity-0 w-0 h-0 absolute overflow-hidden">
        {channels.map(ch => {
          if (ch.type === 'youtube' && ch.active && ch.youtubeId) {
            return (
              <iframe
                key={`yt-frame-${ch.id}`}
                id={`yt-player-${ch.id}`}
                src={`https://www.youtube-nocookie.com/embed/${ch.youtubeId}?enablejsapi=1&autoplay=1&loop=1&playlist=${ch.youtubeId}&vq=small`}
                allow="autoplay"
                className="hidden w-0 h-0"
                title={ch.name}
                onLoad={() => {
                  const iframe = document.getElementById(`yt-player-${ch.id}`) as HTMLIFrameElement;
                  if (iframe?.contentWindow) {
                    try {
                      iframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'setPlaybackQuality',
                        args: ['small']
                      }), '*');
                      iframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'setVolume',
                        args: [ch.volume]
                      }), '*');
                    } catch (e) {}
                  }
                }}
              />
            );
          }
          return null;
        })}
      </div>

      {/* MODAL SHEET UI */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in touch-none"
          onClick={onClose}
        >
          <div 
            className="w-full max-w-md bg-surface-container border border-card-border rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[85vh] text-on-surface cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-on-surface">
                    Doğa & Odak Sesleri Mikseri
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">Uygulama İçi Bağımsız Ses Düzeyi</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-card-border text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channel Cards */}
            <div className="space-y-3">
              {channels.map((ch) => (
                <div 
                  key={ch.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    ch.active 
                      ? 'bg-primary/10 border-primary/40 shadow-sm' 
                      : 'bg-surface-variant/40 border-card-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {ch.type === 'youtube' ? (
                        <Youtube className={`w-4 h-4 shrink-0 ${ch.active ? 'text-red-400' : 'text-on-surface-variant/50'}`} />
                      ) : ch.type === 'synth' ? (
                        <Sparkles className={`w-4 h-4 shrink-0 ${ch.active ? 'text-primary' : 'text-on-surface-variant/50'}`} />
                      ) : (
                        <Music className={`w-4 h-4 shrink-0 ${ch.active ? 'text-teal-400' : 'text-on-surface-variant/50'}`} />
                      )}
                      <p className="font-display text-xs font-bold text-on-surface truncate">{ch.name}</p>
                    </div>

                    <button
                      onClick={() => { triggerHaptic(); onToggleChannel(ch.id); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                        ch.active 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-extrabold shadow-sm' 
                          : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-bold'
                      }`}
                    >
                      {ch.active ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Durdur (%{ch.volume})</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Başlat</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Independent Volume Slider */}
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-3.5 h-3.5 text-on-surface-variant/60 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ch.active ? ch.volume : 0}
                      onChange={(e) => onVolumeChange(ch.id, parseInt(e.target.value))}
                      className="w-full accent-primary bg-black/40 h-2 rounded-lg cursor-pointer"
                    />
                    <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Audio Stream Drawer */}
            <div className="pt-2 border-t border-card-border">
              {!showAddCustom ? (
                <button
                  onClick={() => { triggerHaptic(); setShowAddCustom(true); }}
                  className="w-full py-3 rounded-2xl border border-dashed border-card-border hover:border-primary/50 text-xs font-semibold text-on-surface-variant hover:text-primary flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Özel Ambiyans Bağlantısı Ekle</span>
                </button>
              ) : (
                <div className="bg-surface-variant/60 border border-card-border p-4 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                      ÖZEL AMBİYANS BAĞLANTISI
                    </span>
                    <button onClick={() => setShowAddCustom(false)} className="text-on-surface-variant hover:text-on-surface text-xs font-bold">
                      İptal
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ses Başlığı (Örn: Yağmur ve Şimşek)"
                    value={customInputName}
                    onChange={(e) => setCustomInputName(e.target.value)}
                    className="w-full bg-input-bg border border-input-border text-on-surface rounded-xl px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                  />

                  <input
                    type="text"
                    placeholder="YouTube veya MP3 Bağlantısı"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    className="w-full bg-input-bg border border-input-border text-on-surface rounded-xl px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
                  />

                  <button
                    onClick={handleAddCustom}
                    disabled={!customInputUrl.trim()}
                    className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Miksere Ekle</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
