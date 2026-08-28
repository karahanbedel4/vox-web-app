import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Newspaper, 
  BookOpen, 
  RefreshCw, 
  Sliders, 
  CloudRain, 
  TreePine, 
  Coffee, 
  Zap, 
  Waves, 
  Wind, 
  Moon, 
  Music, 
  Headphones,
  Bell, 
  X, 
  Bookmark, 
  CheckCircle2,
  ArrowRight,
  Battery,
  BatteryCharging,
  Signal,
  Calendar,
  Clock,
  Pencil,
  Target,
  Trophy,
  Check,
  Volume2,
  Sparkles,
  Quote,
  Trash2,
  Filter,
  Award,
  PartyPopper,
  ListTodo,
  CheckCheck,
  Film,
  Tv,
  ListMusic,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../types';
import { triggerHapticImpact, triggerHapticNotification } from '../lib/haptics';
import { AmbientChannel } from './AmbientMixerSheet';
import { fetchNewsByCategory } from '../lib/newsService';
import { appStorage } from '../lib/storage';
import { useTheme } from '../lib/ThemeContext';
import { woodRainSynth } from '../lib/audioSynth';
import { universalSynthService } from '../lib/universalSynthService';
import { 
  useFocus, 
  formatFocusTime, 
  MOTIVATIONAL_FOCUS_QUOTES, 
  sendPomodoroWebNotification,
  playTaskCompleteChime,
  playMindfulnessBell
} from '../lib/FocusContext';
import { ALL_SOUND_SHELVES, SoundTrack, getShelfIcon } from '../lib/soundtrackData';

interface FocusTabProps {
  articles: Article[];
  bookmarkedIds?: string[];
  onToggleBookmark?: (id: string) => void;
  onPlayArticle?: (article: Article) => void;
  onSelectArticle: (article: Article) => void;
  onOpenPaywall: (reason?: 'limit_reached' | 'pages_exceeded' | 'not_logged_in') => void;
  ambientChannels: AmbientChannel[];
  onToggleAmbientChannel: (id: string) => void;
  onVolumeChange?: (id: string, vol: number) => void;
  onOpenAmbientMixer: () => void;
  onStartPlaylist?: (shelfId: string, trackId?: string) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  activePlaylistShelfId?: string;
  isContinuousPlaylistMode?: boolean;
  onToggleContinuousPlaylistMode?: () => void;
}

/**
 * Cookie helper utilities for consent management
 */
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Returns a customized icon component based on channel name or id keywords
 */
function getChannelIconComponent(name: string = '', id: string = '') {
  const n = (name + ' ' + id).toLowerCase();
  if (n.includes('yağmur') || n.includes('rain')) return CloudRain;
  if (n.includes('fırtına') || n.includes('şimşek') || n.includes('thunder')) return Zap;
  if (n.includes('orman') || n.includes('ağaç') || n.includes('kuş') || n.includes('forest') || n.includes('nature') || n.includes('doğa')) return TreePine;
  if (n.includes('kafe') || n.includes('kahve') || n.includes('cafe') || n.includes('coffee')) return Coffee;
  if (n.includes('deniz') || n.includes('dalga') || n.includes('ocean') || n.includes('wave')) return Waves;
  if (n.includes('ateş') || n.includes('fire') || n.includes('şömine')) return Flame;
  if (n.includes('rüzgar') || n.includes('wind')) return Wind;
  if (n.includes('gece') || n.includes('night')) return Moon;
  if (n.includes('müzik') || n.includes('çalışma') || n.includes('work') || n.includes('focus') || n.includes('derin')) return Headphones;
  
  return Music;
}

// Preset cycle options (Clean paired sets)
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6];
const WORK_OPTIONS = [15, 20, 25, 45, 50];
const BREAK_OPTIONS = [5, 10, 15];

export const FocusTab: React.FC<FocusTabProps> = ({
  articles,
  bookmarkedIds = [],
  onToggleBookmark,
  onPlayArticle,
  onSelectArticle,
  onOpenPaywall,
  ambientChannels,
  onToggleAmbientChannel,
  onVolumeChange,
  onOpenAmbientMixer,
  onStartPlaylist,
  onNextTrack,
  onPrevTrack,
  activePlaylistShelfId = 'series',
  isContinuousPlaylistMode = true,
  onToggleContinuousPlaylistMode
}) => {
  const { theme } = useTheme();

  // GLOBAL FOCUS STATE (POMODORO & TASKS)
  const {
    sessionType,
    workMinutes,
    breakMinutes,
    targetRounds,
    completedSessions,
    focusGoal,
    timeLeft,
    isRunning,
    progressPercent,
    tasks,
    filteredTasks,
    taskFilter,
    quoteIndex,
    celebrationToast,
    showSessionSummaryModal,
    sessionSummaryData,
    statusMessage,
    setTaskFilter,
    setTargetRounds,
    setWorkMinutes,
    setBreakMinutes,
    setFocusGoal,
    resetCompletedSessions,
    toggleTimer,
    resetTimer,
    startBreak,
    skipBreakAndStartWork,
    closeSessionSummaryModal,
    addTask: addContextTask,
    toggleTaskDone,
    removeTask,
    saveEditingTask: saveContextEditingTask,
    clearCompletedTasks,
    handleNextQuote,
    setShowSessionSummaryModal,
    setCelebrationToast,
    showTemporaryStatus
  } = useFocus();

  // Local Task Editing & UI states
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>('');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [phoneActiveTab, setPhoneActiveTab] = useState<'timer' | 'player'>('timer');

  // "Lights Out" / Zen Focus Minimalist Mode State
  const [isLightsOut, setIsLightsOut] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return appStorage.getItemSync('vox_lights_out_mode') === 'true';
  });

  const toggleLightsOut = () => {
    const nextVal = !isLightsOut;
    setIsLightsOut(nextVal);
    try {
      appStorage.setItemSync('vox_lights_out_mode', String(nextVal));
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vox_toggle_lights_out', { detail: nextVal }));
    }
    triggerHapticImpact('medium').catch(() => {});
    showTemporaryStatus(nextVal ? '🌙 Işıkları Kapat (Zen Modu) Açıldı' : '☀️ Normal Mod Açıldı');
  };

  // Currently playing active soundtrack from ambient channels
  const currentPlayingTrack = useMemo(() => {
    for (const shelf of ALL_SOUND_SHELVES) {
      for (const track of shelf.tracks) {
        const ch = ambientChannels.find(c => (c.id === track.id || (Boolean(track.youtubeId) && Boolean(c.youtubeId) && c.youtubeId === track.youtubeId)) && c.active && c.volume > 0);
        if (ch) {
          return { track, shelf, volume: ch.volume };
        }
      }
    }
    return null;
  }, [ambientChannels]);

  // All flattened tracks for Next/Previous jumping within phone mockup
  const allFlattenedTracks = useMemo(() => {
    return ALL_SOUND_SHELVES.flatMap(s => s.tracks);
  }, []);

  const handleNextInMockup = () => {
    triggerHapticImpact('light').catch(() => {});
    if (onNextTrack) {
      onNextTrack();
      return;
    }
    if (!currentPlayingTrack) {
      // Start first track
      if (allFlattenedTracks.length > 0) {
        onToggleAmbientChannel(allFlattenedTracks[0].id);
      }
      return;
    }
    const idx = allFlattenedTracks.findIndex(t => t.id === currentPlayingTrack.track.id);
    const nextIdx = (idx + 1) % allFlattenedTracks.length;
    onToggleAmbientChannel(allFlattenedTracks[nextIdx].id);
  };

  const handlePrevInMockup = () => {
    triggerHapticImpact('light').catch(() => {});
    if (onPrevTrack) {
      onPrevTrack();
      return;
    }
    if (!currentPlayingTrack) return;
    const idx = allFlattenedTracks.findIndex(t => t.id === currentPlayingTrack.track.id);
    const prevIdx = (idx - 1 + allFlattenedTracks.length) % allFlattenedTracks.length;
    onToggleAmbientChannel(allFlattenedTracks[prevIdx].id);
  };

  const scrollToSoundtracksSection = () => {
    const el = document.getElementById('soundtracks-full-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectTargetRounds = (rounds: number) => {
    setTargetRounds(rounds);
    triggerHapticImpact('light').catch(() => {});
    showTemporaryStatus(`🎯 Hedef: ${rounds} Tur (${workMinutes} dk/seans)`);
  };

  const handleResetSessions = () => {
    resetCompletedSessions();
    triggerHapticImpact('light').catch(() => {});
    showTemporaryStatus('🔄 Tur sayacı sıfırlandı');
  };

  const handleSelectWorkMinutes = (mins: number) => {
    setWorkMinutes(mins);
    triggerHapticImpact('light').catch(() => {});
  };

  const handleSelectBreakMinutes = (mins: number) => {
    setBreakMinutes(mins);
    triggerHapticImpact('light').catch(() => {});
  };

  const startEditingTask = (task: { id: string; text: string }) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const saveEditingTask = (id: string) => {
    const clean = editingTaskText.trim();
    if (!clean) {
      removeTask(id);
    } else {
      saveContextEditingTask(id, clean);
    }
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    addContextTask(newTaskText);
    setNewTaskText('');
    setIsAddingTask(false);
  };

  // Live Time, Date and Real Device Battery State for Phone Mockup
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  });
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
  });
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean }>({
    level: 88,
    charging: false
  });

  useEffect(() => {
    // Live clock and date ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' }));
    }, 1000);

    // Battery Status API detection
    let batteryInstance: any = null;
    const syncBattery = (b: any) => {
      if (!b) return;
      const lvl = typeof b.level === 'number' ? Math.round(b.level * 100) : 88;
      setBatteryInfo({
        level: Math.max(1, Math.min(100, lvl)),
        charging: Boolean(b.charging)
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        syncBattery(battery);
        battery.addEventListener('levelchange', () => syncBattery(battery));
        battery.addEventListener('chargingchange', () => syncBattery(battery));
      }).catch(() => {});
    }

    return () => {
      clearInterval(timer);
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange', () => {});
          batteryInstance.removeEventListener('chargingchange', () => {});
        } catch (e) {}
      }
    };
  }, []);

  // NOTIFICATION STATE & STORAGE CONSENT
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = appStorage.getItemSync('vox_push_consent');
      if (stored === 'granted' || stored === 'dismissed' || stored === 'denied') {
        return true;
      }
      const cookieVal = getCookie('vox_push_consent');
      if (cookieVal === 'granted' || cookieVal === 'dismissed' || cookieVal === 'denied') {
        return true;
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        return true;
      }
    } catch (e) {}
    return false;
  });

  // LIVE NEWS FEED STATE
  const [liveNews, setLiveNews] = useState<Article[]>([]);
  const [isLoadingLiveFeed, setIsLoadingLiveFeed] = useState<boolean>(false);

  // Check initial notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = Notification.permission;
        setNotifPermission(perm);
        if (perm === 'granted') {
          setCookie('vox_push_consent', 'granted', 365);
          appStorage.setItemSync('vox_push_consent', 'granted');
          setHasConsented(true);
        }
      } catch (e) {}
    }
  }, []);

  // Close summary modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSessionSummaryModal) {
        closeSessionSummaryModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSessionSummaryModal, closeSessionSummaryModal]);

  // Fetch live API news for the right-side feed
  const loadLiveFeed = async () => {
    setIsLoadingLiveFeed(true);
    try {
      const fetched = await fetchNewsByCategory('Tümü');
      if (Array.isArray(fetched) && fetched.length > 0) {
        setLiveNews(fetched);
      }
    } catch (err) {
      console.warn('Mini news feed live fetch error:', err);
    } finally {
      setIsLoadingLiveFeed(false);
    }
  };

  useEffect(() => {
    loadLiveFeed();
    const interval = setInterval(loadLiveFeed, 90000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    triggerHapticImpact('medium').catch(() => {});
    
    // Always dismiss popup immediately on click and store user consent
    setHasConsented(true);
    setCookie('vox_push_consent', 'granted', 365);
    try {
      appStorage.setItemSync('vox_push_consent', 'granted');
    } catch (e) {}

    // Check if browser supports Web Push Notifications (Desktop / Android / iOS PWA)
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showTemporaryStatus('🔔 Sesli seans ve mola uyarıları aktif edildi!');
      playMindfulnessBell();
      return;
    }

    try {
      let permission: NotificationPermission = 'default';
      
      const req = Notification.requestPermission();
      if (req && typeof (req as any).then === 'function') {
        permission = await req;
      } else {
        // Legacy callback support for older mobile WebKit
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }

      setNotifPermission(permission);

      if (permission === 'granted') {
        triggerHapticNotification('success').catch(() => {});
        showTemporaryStatus('🔔 Bildirimler ve sesli uyarılar aktif edildi!');
        sendPomodoroWebNotification(
          'VOX Odaklanma',
          '🔔 Bildirimler aktif! Seans ve mola geçişlerinde anlık bildirim alacaksınız.'
        );
      } else {
        showTemporaryStatus('🔔 Seans geçişlerinde sesli uyarılar çalacak.');
      }
    } catch (err) {
      console.warn('Notification permission handler notice:', err);
      showTemporaryStatus('🔔 Sesli seans uyarıları devrede.');
    }
  };

  const dismissNotificationBanner = () => {
    triggerHapticImpact('light').catch(() => {});
    setCookie('vox_push_consent', 'dismissed', 30);
    try {
      appStorage.setItemSync('vox_push_consent', 'dismissed');
    } catch (e) {}
    setHasConsented(true);
  };

  const formatTime = formatFocusTime;

  // Right side news list (Filtered for real news & tweets, no dummy items)
  const displayArticles = useMemo(() => {
    const raw = liveNews.length > 0 ? liveNews : articles;
    return raw.filter(a => 
      a && a.title && 
      !a.id.includes('quantum-geopolitics') && 
      !a.id.includes('silicon-forest') && 
      !a.id.includes('ethics-of-ai') &&
      !a.id.includes('dunya-diplomasi-2026') &&
      !a.id.includes('kultur-sanat-dijital-muze')
    ).slice(0, 12);
  }, [liveNews, articles]);

  return (
    <div className={`p-3 sm:p-5 md:p-8 max-w-7xl mx-auto space-y-6 transition-colors duration-200 ${
      theme === 'light' ? 'text-slate-800' : 'text-gray-200'
    }`}>
      
      {/* Clean & Compact Top Header (Contrast-safe across light & dark themes) */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <h1 className={`font-display text-xl md:text-2xl font-black tracking-tight ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            Odaklanma Alanı
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Lights Out / Zen Focus Mode Toggle Button */}
          <button
            onClick={toggleLightsOut}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
              isLightsOut
                ? 'bg-amber-400 text-black border-amber-400 ring-2 ring-amber-400/40'
                : theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Işıkları Kapat: Haberleri ve yan menüyü gizleyip sadece sayaç, müzik ve hedeflere odaklan"
          >
            {isLightsOut ? (
              <>
                <Moon className="w-3.5 h-3.5 fill-current" />
                <span>Işıkları Aç</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>Işıkları Kapat (Zen)</span>
              </>
            )}
          </button>

          {/* Completed Session Progress Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors ${
            (completedSessions || 0) >= (targetRounds || 4)
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : theme === 'light'
                ? 'bg-white border border-slate-200 text-slate-800'
                : 'bg-[#161c23] border border-white/10 text-white'
          }`}>
            {(completedSessions || 0) >= (targetRounds || 4) ? (
              <Trophy className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-[#10b981] fill-current" />
            )}
            <span>
              {(completedSessions || 0) >= (targetRounds || 4) 
                ? `Hedef Tamamlandı! (${completedSessions || 0}/${targetRounds || 4} Tur)` 
                : `${completedSessions || 0} / ${targetRounds || 4} Tur Tamamlandı`}
            </span>
          </div>

          {completedSessions > 0 && (
            <button
              onClick={handleResetSessions}
              className={`p-2 rounded-xl text-xs transition-colors border shadow-sm ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  : 'bg-[#161c23] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Tamamlanan tur sayacını sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* WEB PUSH NOTIFICATION PROMPT CARD */}
      {!hasConsented && notifPermission !== 'granted' && (
        <div className={`border rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm relative group ${
          theme === 'light'
            ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
            : 'bg-[#161c23] border-[#10b981]/30 text-white'
        }`}>
          <button
            onClick={dismissNotificationBanner}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3 pr-6 sm:pr-0">
            <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0 text-[#10b981]">
              <Bell className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-left">
              <h3 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Mola bildirimlerini açın</h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>Çalışma veya mola tamamlandığında anlık bildirim alın.</p>
            </div>
          </div>

          <button
            onClick={requestNotificationPermission}
            className="py-2 px-3.5 bg-[#10b981] text-black font-extrabold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 fill-current" />
            <span>Bildirimleri Aç</span>
          </button>
        </div>
      )}

      {/* MINIMAL HIGH-DENSITY TUR / SÜRE / MOLA CONTROL RIBBON */}
      <div className={`border rounded-2xl p-2.5 sm:p-3 shadow-sm transition-all ${
        theme === 'light'
          ? 'bg-white border-slate-200'
          : 'bg-[#101612] border-white/10'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* 1. Hedef Tur Sayısı */}
          <div className="flex items-center gap-2">
            <span className={`font-bold flex items-center gap-1 text-[11px] shrink-0 ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
              <Target className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>Tur:</span>
            </span>
            <div className="flex items-center gap-1">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectTargetRounds(r)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    (targetRounds || 4) === r
                      ? 'bg-[#1ed760] text-black border-[#1ed760] shadow-sm font-black scale-105'
                      : theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tur Süresi */}
          <div className="flex items-center gap-2">
            <span className={`font-bold flex items-center gap-1 text-[11px] shrink-0 ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]" />
              <span>Süre:</span>
            </span>
            <div className="flex items-center gap-1">
              {WORK_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectWorkMinutes(m)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    (workMinutes || 25) === m
                      ? 'bg-[#1ed760] text-black border-[#1ed760] shadow-sm font-black'
                      : theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* 3. Mola Süresi */}
          <div className="flex items-center gap-2">
            <span className={`font-bold flex items-center gap-1 text-[11px] shrink-0 ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Mola:</span>
            </span>
            <div className="flex items-center gap-1">
              {BREAK_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectBreakMinutes(m)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    (breakMinutes || 5) === m
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm font-black'
                      : theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* 4. İlerleme Göstergesi */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="flex items-center gap-1">
              {Array.from({ length: targetRounds || 4 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center text-[7px] font-black ${
                    idx < (completedSessions || 0)
                      ? 'bg-[#1ed760] text-black ring-1 ring-[#1ed760]/50'
                      : idx === (completedSessions || 0) && isRunning
                        ? 'bg-amber-400 animate-pulse text-black'
                        : theme === 'light' ? 'bg-slate-200 text-slate-400' : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {idx < (completedSessions || 0) ? '✓' : ''}
                </span>
              ))}
            </div>
            <span className="font-mono font-bold text-[11px] text-[#1ed760]">
              %{Math.min(100, Math.round(((completedSessions || 0) / (targetRounds || 4)) * 100))}
            </span>
          </div>

        </div>
      </div>

      {/* 2-COLUMN SPLIT GRID LAYOUT */}
      <div className={`grid grid-cols-1 ${isLightsOut ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 items-start transition-all duration-300`}>
        
        {/* LEFT COLUMN: Modern Phone Mockup Display (Centered when Lights Out is active) */}
        <div className={`${isLightsOut ? 'lg:col-span-12 max-w-2xl mx-auto w-full' : 'lg:col-span-7'} space-y-6 transition-all duration-300`}>

          {/* POMODORO CONTROLLER (Responsive: iPhone Mockup on Desktop >= md, Clean Native Card on Mobile < md) */}
          <div className="relative mx-auto w-full md:max-w-[420px]">
            
            {/* Ambient Glow Behind Phone / Card */}
            <div className={`absolute -inset-4 rounded-[50px] blur-3xl transition-opacity duration-1000 pointer-events-none opacity-35 ${
              sessionType === 'work' ? 'bg-gradient-to-b from-[#1ed760]/20 via-emerald-950/20 to-black' : 'bg-gradient-to-b from-amber-500/20 via-orange-950/20 to-black'
            }`} />

            {/* Chassis: Desktop uses iPhone frame with border-[6px], Mobile uses clean native card */}
            <div className={`relative transition-all overflow-hidden ${
              theme === 'light'
                ? 'bg-white border border-slate-200 shadow-xl rounded-3xl p-4 sm:p-5 md:border-[6px] md:border-slate-800 md:rounded-[48px] md:bg-[#0a0d0b] md:p-4 md:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(30,215,96,0.12)]'
                : 'bg-[#121814] border border-white/10 shadow-2xl rounded-3xl p-4 sm:p-5 md:border-[6px] md:border-[#1d2620] md:rounded-[48px] md:bg-[#0a0d0b] md:p-4 md:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(30,215,96,0.12)]'
            }`}>
              
              {/* Desktop Top Status Bar (Hidden on Mobile) */}
              <div className="hidden md:flex items-center justify-between px-3 pt-1 pb-3 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight text-white">
                    {currentTime}
                  </span>
                </div>
                
                {/* Dynamic Island Pill */}
                <div className="w-20 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-white/10 mr-1" />
                </div>

                {/* Status Bar Right: Signal + Device Battery Level & Charging Status */}
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Signal className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-mono font-bold text-gray-300">
                    %{batteryInfo.level}
                  </span>
                  {batteryInfo.charging ? (
                    <BatteryCharging className="w-4 h-4 text-[#1ed760] animate-pulse" title="Şarj Ediliyor" />
                  ) : (
                    <Battery className="w-4 h-4 text-[#1ed760]" title={`Pil Seviyesi: %${batteryInfo.level}`} />
                  )}
                </div>
              </div>

              {/* Inner Screen Content */}
              <div className="space-y-3 pt-0.5 pb-1">
                
                {/* 1. Sleek Compact Date & Goal Header (Redundant 2nd clock removed, saves vertical space) */}
                <div className="px-1 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3 h-3 text-[#1ed760]" />
                      <span className="capitalize">{currentDateStr}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsEditingGoal(true)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#1ed760] hover:underline cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>
                  </div>

                  {isEditingGoal ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={focusGoal}
                        onChange={(e) => setFocusGoal(e.target.value)}
                        placeholder="Odaklanma hedefi..."
                        className="w-full bg-black/10 dark:bg-white/10 border-2 border-[#1ed760] rounded-xl px-3 py-1.5 text-xl sm:text-2xl font-black text-[#1ed760] uppercase outline-none shadow-sm"
                        autoFocus
                        onBlur={() => setIsEditingGoal(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                      />
                      <button
                        onClick={() => setIsEditingGoal(false)}
                        className="p-2 bg-[#1ed760] text-black font-bold rounded-xl text-xs hover:brightness-110 transition-transform active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsEditingGoal(true)}
                      className="group cursor-pointer py-0.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      title="Hedefi düzenlemek için tıklayın"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black text-[#1ed760] tracking-tight uppercase leading-tight drop-shadow-sm select-none">
                        {focusGoal}
                      </h2>
                    </div>
                  )}
                </div>

                {/* In-Mockup Tab Switcher: Pomodoro Timer vs. In-Mockup Music Player */}
                <div className="flex items-center p-1 bg-black/40 rounded-2xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneActiveTab('timer');
                      triggerHapticImpact('light').catch(() => {});
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      phoneActiveTab === 'timer'
                        ? 'bg-[#1ed760] text-black shadow-md shadow-[#1ed760]/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Pomodoro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhoneActiveTab('player');
                      triggerHapticImpact('light').catch(() => {});
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                      phoneActiveTab === 'player'
                        ? 'bg-[#1ed760] text-black shadow-md shadow-[#1ed760]/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Müzik Çalar</span>
                    {currentPlayingTrack && (
                      <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse" />
                    )}
                  </button>
                </div>

                {/* TAB 1: TIMER, QUOTES & TASKS */}
                {phoneActiveTab === 'timer' ? (
                  <>
                    {/* 2. Rotating Motivational & Praising Quotes Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0e1712] to-teal-950/50 border border-emerald-500/30 p-3 sm:p-3.5 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 text-[#1ed760] animate-pulse" />
                      <span>{MOTIVATIONAL_FOCUS_QUOTES[quoteIndex].category}</span>
                    </div>

                    <button
                      onClick={handleNextQuote}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
                      title="Sonraki Motivasyon Sözü"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="mt-1.5 min-h-[38px] flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={quoteIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-xs sm:text-[13px] font-medium text-white leading-relaxed italic drop-shadow-sm"
                      >
                        "{MOTIVATIONAL_FOCUS_QUOTES[quoteIndex].text}"
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. Enhanced Interactive Tasks / To-Do List */}
                <div className="bg-slate-900/60 md:bg-[#0e1410] border border-slate-800/80 md:border-white/5 rounded-2xl p-3.5 space-y-3">
                  
                  {/* Task Header & Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-200">
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4 text-[#1ed760]" />
                        <span>GÖREVLER ({tasks.filter(t => t.done).length}/{tasks.length})</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {tasks.some(t => t.done) && (
                          <button
                            onClick={clearCompletedTasks}
                            className="text-[10px] text-gray-400 hover:text-red-400 font-medium transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Bitenleri Temizle"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Temizle</span>
                          </button>
                        )}
                        <span className="font-mono text-[11px] font-black text-[#1ed760]">
                          %{tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-[#1ed760] to-teal-400 transition-all duration-300 rounded-full"
                        style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.done).length / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        onClick={() => setTaskFilter('all')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          taskFilter === 'all'
                            ? 'bg-[#1ed760] text-black shadow-sm'
                            : 'bg-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        Tümü ({tasks.length})
                      </button>
                      <button
                        onClick={() => setTaskFilter('pending')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          taskFilter === 'pending'
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        Bekleyen ({tasks.filter(t => !t.done).length})
                      </button>
                      <button
                        onClick={() => setTaskFilter('completed')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          taskFilter === 'completed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white/10 text-gray-300 hover:text-white'
                        }`}
                      >
                        Biten ({tasks.filter(t => t.done).length})
                      </button>
                    </div>
                  )}

                  {/* Task List Items */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {filteredTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-xl border transition-all group ${
                          task.done
                            ? 'bg-emerald-500/10 border-emerald-500/25'
                            : 'bg-white/[0.05] border-white/10 hover:border-[#1ed760]/40'
                        }`}
                      >
                        {editingTaskId === task.id ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              value={editingTaskText}
                              onChange={(e) => setEditingTaskText(e.target.value)}
                              onBlur={() => saveEditingTask(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditingTask(task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                              className="flex-1 bg-black/70 border border-[#1ed760] rounded-lg px-2 py-1 text-xs text-white outline-none"
                            />
                            <button
                              onMouseDown={() => saveEditingTask(task.id)}
                              className="px-2 py-1 bg-[#1ed760] text-black font-bold text-[10px] rounded-lg hover:brightness-110"
                            >
                              Kaydet
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleTaskDone(task.id)}
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
                                task.done 
                                   ? 'bg-[#1ed760] border-[#1ed760] text-black shadow-sm' 
                                  : 'border-white/30 hover:border-[#1ed760] bg-transparent'
                              }`}
                              title={task.done ? 'Tamamlandı (Geri al)' : 'Görevi Tamamla (Push Bildirimi At)'}
                            >
                              {task.done && <Check className="w-3 h-3 text-black stroke-[3]" />}
                            </button>

                            <div 
                              onClick={() => startEditingTask(task)}
                              className="flex-1 min-w-0 cursor-text py-0.5 px-1 rounded hover:bg-white/5 transition-colors"
                              title="Görevi düzenlemek için tıklayın"
                            >
                              <span className={`block truncate ${task.done ? 'line-through text-gray-400 font-normal' : 'text-gray-100 font-medium hover:text-[#1ed760]'}`}>
                                {task.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => startEditingTask(task)}
                                className="p-1 text-gray-400 hover:text-[#1ed760] transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {filteredTasks.length === 0 && (
                      <div 
                        onClick={() => setIsAddingTask(true)}
                        className="text-xs text-gray-400 hover:text-gray-200 py-3 px-2 border border-dashed border-white/15 rounded-xl text-center cursor-pointer transition-colors"
                      >
                        {taskFilter === 'pending' ? '🎉 Bekleyen görev yok!' : taskFilter === 'completed' ? 'Henüz tamamlanan görev yok.' : '+ İlk hedefini veya görevini yazmak için tıkla...'}
                      </div>
                    )}
                  </div>

                  {/* Add Task Input Row */}
                  {isAddingTask ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Görev yazın (Enter)..."
                        className="flex-1 bg-black/60 border border-[#1ed760] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-400 outline-none shadow-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addTask();
                          if (e.key === 'Escape') setIsAddingTask(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTask}
                        className="py-1.5 px-3 bg-[#1ed760] text-black rounded-xl text-xs font-bold hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-sm"
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskText('');
                        }}
                        className="p-1.5 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="İptal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(true)}
                      className="w-full text-left text-xs text-gray-400 hover:text-white py-1 px-2 rounded-xl transition-colors flex items-center gap-1.5 hover:bg-white/5 cursor-pointer"
                    >
                      <span className="text-[#1ed760] font-bold text-sm">+</span>
                      <span>Yeni görev veya not ekle...</span>
                    </button>
                  )}
                </div>

                {/* FLOATING HUD CONTROLLER CARD */}
                <div className={`relative bg-gradient-to-b from-[#141b16] to-[#0a0d0b] border-2 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl transition-all ${
                  sessionType === 'work' 
                    ? 'border-[#1ed760]/30 shadow-[0_0_35px_rgba(30,215,96,0.12)]' 
                    : 'border-amber-400/30 shadow-[0_0_35px_rgba(251,191,36,0.12)]'
                }`}>
                  
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={resetTimer}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Zamanlayıcıyı Başa Al"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Active State Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${sessionType === 'work' ? 'bg-[#1ed760]' : 'bg-amber-400'}`} />
                      <span className="text-[11px] font-bold text-gray-300">
                        {sessionType === 'work' ? `Çalışma (${workMinutes}m)` : `Dinlenme (${breakMinutes}m)`}
                      </span>
                    </div>

                    {/* Round Indicator */}
                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-emerald-400" title="Geçerli Seans / Hedef">
                      {Math.min(targetRounds, completedSessions + 1)}/{targetRounds} Tur
                    </div>
                  </div>

                  {/* Main Timer Display */}
                  <div className="text-center space-y-1 py-1">
                    <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-wider drop-shadow-md">
                      {formatTime(timeLeft)}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${sessionType === 'work' ? 'bg-[#1ed760]' : 'bg-amber-400'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tactile Big Action Button */}
                  <div className="flex flex-col items-center justify-center pt-1 space-y-3">
                    <div className="relative">
                      {/* Pulsing Aura when Running */}
                      <div className={`absolute -inset-2 rounded-full blur-md transition-opacity ${
                        isRunning 
                          ? 'bg-orange-500/40 animate-ping opacity-50'
                          : 'opacity-0'
                      }`} />

                      <button
                        onClick={toggleTimer}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
                          isRunning
                            ? 'bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] hover:scale-105'
                        }`}
                        title={isRunning ? 'Zamanlayıcıyı Duraklat' : 'Zamanlayıcıyı Başlat'}
                      >
                        {isRunning ? (
                          <Pause className="w-8 h-8 fill-current text-white" />
                        ) : (
                          <Play className="w-8 h-8 fill-current ml-1 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Animated Audio Equalizer Bars */}
                    <div className="flex items-center gap-1 h-4">
                      <span className={`w-1 bg-[#1ed760] rounded-full transition-all duration-300 ${isRunning ? 'h-4 animate-pulse' : 'h-1.5 opacity-40'}`} />
                      <span className={`w-1 bg-[#1ed760] rounded-full transition-all duration-500 ${isRunning ? 'h-3 animate-pulse' : 'h-1.5 opacity-40'}`} />
                      <span className={`w-1 bg-[#1ed760] rounded-full transition-all duration-200 ${isRunning ? 'h-4 animate-pulse' : 'h-1.5 opacity-40'}`} />
                    </div>

                    {statusMessage && (
                      <span className="text-[11px] font-bold text-[#1ed760] bg-[#1ed760]/10 px-3 py-1 rounded-full border border-[#1ed760]/30">
                        {statusMessage}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* TAB 2: IN-MOCKUP MUSIC PLAYER VIEW (Aşağı kaydırmadan doğrudan mock-up içinde parçalar arası geçiş ve oynatıcı) */
              <div className="space-y-4 pt-1">
                {currentPlayingTrack ? (
                  <div className="bg-gradient-to-b from-[#141b16] to-[#0a0d0b] border border-[#1ed760]/30 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl">
                    {/* Artwork Preview */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <img
                        src={currentPlayingTrack.track.coverImage || `https://img.youtube.com/vi/${currentPlayingTrack.track.youtubeId}/hqdefault.jpg`}
                        alt={currentPlayingTrack.track.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1ed760] text-black">
                          {currentPlayingTrack.shelf.title}
                        </span>
                        <div className="flex items-end gap-0.5 h-3">
                          <div className="w-0.5 bg-[#1ed760] rounded-full animate-eq-1" />
                          <div className="w-0.5 bg-[#1ed760] rounded-full animate-eq-2" />
                          <div className="w-0.5 bg-[#1ed760] rounded-full animate-eq-3" />
                        </div>
                      </div>
                    </div>

                    {/* Title and Subtitle */}
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-extrabold text-white truncate">
                        {currentPlayingTrack.track.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {currentPlayingTrack.track.subtitle}
                      </p>
                    </div>

                    {/* Mockup Next / Prev / Play / Pause Controls */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <button
                        type="button"
                        onClick={handlePrevInMockup}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Önceki Parça"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleAmbientChannel(currentPlayingTrack.track.id)}
                        className="w-14 h-14 rounded-full bg-[#1ed760] text-black font-extrabold flex items-center justify-center shadow-lg shadow-[#1ed760]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Durdur / Oynat"
                      >
                        <Pause className="w-6 h-6 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={handleNextInMockup}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Sonraki Parça"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* In-Mockup Volume Slider */}
                    {onVolumeChange && (
                      <div className="px-2 pt-1 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={currentPlayingTrack.volume}
                          onChange={(e) => onVolumeChange(currentPlayingTrack.track.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#1ed760] bg-white/20"
                        />
                        <span className="text-[10px] font-mono text-[#1ed760] shrink-0 w-8 text-right">
                          %{currentPlayingTrack.volume}
                        </span>
                      </div>
                    )}

                    {/* Quick Jump to Full Library Button */}
                    <button
                      type="button"
                      onClick={scrollToSoundtracksSection}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ListMusic className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>Tüm Parçaları Aşağıda Gör & Keşfet</span>
                    </button>
                  </div>
                ) : (
                  /* No Track Currently Playing */
                  <div className="bg-black/40 border border-dashed border-white/15 rounded-3xl p-6 text-center space-y-3">
                    <Headphones className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Henüz Müzik Çalmıyor</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Aşağıdaki listeden veya hemen başlata basarak müzik dinleyebilirsiniz.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (allFlattenedTracks.length > 0) {
                            onToggleAmbientChannel(allFlattenedTracks[0].id);
                          }
                        }}
                        className="py-2 px-4 rounded-xl bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#1ed760]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>İlk Müziği Başlat</span>
                      </button>
                      <button
                        type="button"
                        onClick={scrollToSoundtracksSection}
                        className="text-xs text-gray-400 hover:text-white py-1 transition-colors"
                      >
                        Tüm kütüphaneye göz at ↓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

              </div>

              {/* Desktop Home Bar */}
              <div className="hidden md:block w-32 h-1 bg-white/20 rounded-full mx-auto mt-3" />
            </div>
          </div>

          {/* SPOTIFY / APPLE MUSIC STYLE HORIZONTAL ALBUM SHELVES WITH PLAYLIST CONTINUOUS AUTO-ADVANCE */}
          <section className="space-y-6 pt-2">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
              theme === 'light' ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#1ed760]/20 border border-[#1ed760]/30 flex items-center justify-center text-[#1ed760] shadow-sm">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`font-display text-base md:text-lg font-bold ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    Odaklanma Müzikleri & Efsane Soundtracks
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                    Dizi, film müzikleri ve doğa sesleri • Biri bitince diğeri otomatik başlar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {onToggleContinuousPlaylistMode && (
                  <button
                    onClick={() => {
                      triggerHapticImpact('light').catch(() => {});
                      onToggleContinuousPlaylistMode();
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isContinuousPlaylistMode
                        ? 'bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]/40 shadow-sm'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                    title="Playlist Otomatik Geçiş Modu: Bir parça bitince sonrakine otomatik geçer"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{isContinuousPlaylistMode ? 'Sıralı Çalma: Açık' : 'Sıralı Çalma: Kapalı'}</span>
                  </button>
                )}

                <button
                  onClick={onOpenAmbientMixer}
                  className="px-3 py-1.5 rounded-xl bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/30 text-xs font-bold hover:bg-[#1ed760]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gelişmiş Mikser</span>
                  <span className="sm:hidden">Mikser</span>
                </button>
              </div>
            </div>

            {/* Horizontal Sound Shelves */}
            <div className="space-y-7">
              {ALL_SOUND_SHELVES.map((shelf) => {
                const ShelfIcon = getShelfIcon(shelf.iconName);
                const isCurrentActiveShelf = activePlaylistShelfId === shelf.id;
                const activeTrackInShelf = shelf.tracks.find(t => {
                  const ch = ambientChannels.find(c => (c.id === t.id || (Boolean(t.youtubeId) && Boolean(c.youtubeId) && c.youtubeId === t.youtubeId)) && c.active && c.volume > 0);
                  return Boolean(ch);
                });

                return (
                  <div key={shelf.id} className="space-y-3">
                    {/* Shelf Header */}
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex items-center gap-2">
                        <ShelfIcon className="w-4 h-4 text-[#1ed760]" />
                        <h3 className={`text-sm md:text-base font-bold tracking-tight ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {shelf.title}
                        </h3>
                        <span className={`text-[11px] hidden sm:inline ${
                          theme === 'light' ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                          • {shelf.subtitle}
                        </span>
                      </div>

                      {/* Play All Playlist Button for this shelf */}
                      <button
                        onClick={() => {
                          triggerHapticImpact('medium').catch(() => {});
                          universalSynthService.unlock();
                          if (onStartPlaylist) {
                            onStartPlaylist(shelf.id);
                          } else {
                            woodRainSynth.unlockAudioContext();
                            onToggleAmbientChannel(shelf.tracks[0].id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                          activeTrackInShelf
                            ? 'bg-[#1ed760] text-black hover:bg-[#1ed760]/90 shadow-[#1ed760]/30'
                            : 'bg-white/10 hover:bg-[#1ed760]/20 hover:text-[#1ed760] text-gray-200 border border-white/10 hover:border-[#1ed760]/30'
                        }`}
                        title={`${shelf.title} listesini baştan sona kesintisiz çal`}
                      >
                        {activeTrackInShelf ? (
                          <>
                            <div className="flex items-end gap-0.5 h-3">
                              <div className="w-0.5 bg-black rounded-full animate-eq-1" />
                              <div className="w-0.5 bg-black rounded-full animate-eq-2" />
                              <div className="w-0.5 bg-black rounded-full animate-eq-3" />
                            </div>
                            <span>Oynatılıyor ({shelf.tracks.length})</span>
                          </>
                        ) : (
                          <>
                            <ListMusic className="w-3.5 h-3.5" />
                            <span>Tümünü Çal ({shelf.tracks.length})</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Horizontal Scrollable Album Cards Shelf */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory space-x-3.5 sm:space-x-4 pb-3 pt-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
                      {shelf.tracks.map((track, trackIndex) => {
                        const channelState = ambientChannels.find(
                          (c) => c.id === track.id || (Boolean(track.youtubeId) && Boolean(c.youtubeId) && c.youtubeId === track.youtubeId)
                        );
                        const isPlaying = Boolean(channelState && channelState.active && channelState.volume > 0);
                        const volume = channelState ? channelState.volume : 60;

                        return (
                          <div
                            key={track.id}
                            onClick={() => {
                              woodRainSynth.unlockAudioContext();
                              universalSynthService.unlock();
                              triggerHapticImpact('light').catch(() => {});
                              if (onStartPlaylist) {
                                onStartPlaylist(shelf.id, track.id);
                              } else {
                                onToggleAmbientChannel(track.id);
                              }
                            }}
                            className="group relative shrink-0 w-36 sm:w-40 md:w-44 snap-start flex flex-col cursor-pointer transition-all duration-300"
                          >
                            {/* Square Cover Artwork Container */}
                            <div className={`relative aspect-square w-full rounded-2xl overflow-hidden shadow-md bg-neutral-900 border transition-all duration-300 ${
                              isPlaying
                                ? 'border-[#1ed760] ring-2 ring-[#1ed760] shadow-xl shadow-[#1ed760]/30 scale-[1.02]'
                                : theme === 'light'
                                  ? 'border-slate-200 hover:border-[#1ed760]/50 hover:shadow-lg group-hover:scale-[1.02]'
                                  : 'border-white/10 hover:border-[#1ed760]/50 hover:shadow-lg group-hover:scale-[1.02]'
                            }`}>
                              
                              {/* Background Artwork */}
                              <img
                                src={track.coverImage || `https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg`}
                                alt={track.name}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                  isPlaying ? 'opacity-90' : 'opacity-75 group-hover:opacity-90'
                                }`}
                                loading="lazy"
                                onError={(e) => {
                                  const imgEl = e.currentTarget;
                                  if (track.coverImage && imgEl.src !== track.coverImage) {
                                    imgEl.src = track.coverImage;
                                  } else {
                                    imgEl.src = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80';
                                  }
                                }}
                              />

                              {/* Subtle Aesthetic Vignette Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                              {/* Track Index Badge & Stream Type Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold text-gray-300">
                                  <span>#{trackIndex + 1}</span>
                                </div>
                                {track.audioUrl && (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[9px] font-bold text-emerald-300">
                                    <span>⚡ MP3</span>
                                  </div>
                                )}
                              </div>

                              {/* Playing Animation Equalizer / Status Badge */}
                              {isPlaying && (
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1ed760] text-black text-[10px] font-black shadow-lg">
                                  <div className="flex items-end gap-0.5 h-3">
                                    <div className="w-0.5 bg-black rounded-full animate-eq-1" />
                                    <div className="w-0.5 bg-black rounded-full animate-eq-2" />
                                    <div className="w-0.5 bg-black rounded-full animate-eq-3" />
                                    <div className="w-0.5 bg-black rounded-full animate-eq-4" />
                                  </div>
                                  <span>Çalıyor</span>
                                </div>
                              )}

                              {/* Big Play / Pause Action Button (Always Visible or On Hover) */}
                              <div className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xl ${
                                isPlaying
                                  ? 'bg-[#1ed760] text-black scale-100 opacity-100 shadow-[#1ed760]/40'
                                  : 'bg-black/75 backdrop-blur-md text-white border border-white/20 opacity-90 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-[#1ed760] group-hover:text-black group-hover:border-[#1ed760]'
                              }`}>
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </div>
                            </div>

                            {/* Track Info (Spotify-Style Typography) */}
                            <div className="mt-2 space-y-0.5 px-0.5">
                              <h4 className={`text-xs font-bold truncate leading-tight transition-colors ${
                                isPlaying
                                  ? 'text-[#1ed760]'
                                  : theme === 'light'
                                    ? 'text-slate-900 group-hover:text-[#1ed760]'
                                    : 'text-white group-hover:text-[#1ed760]'
                              }`}>
                                {track.name}
                              </h4>
                              <p className={`text-[11px] truncate ${
                                theme === 'light' ? 'text-slate-500' : 'text-gray-400'
                              }`}>
                                {track.subtitle}
                              </p>

                              {/* Mini volume indicator when playing */}
                              {isPlaying && onVolumeChange && (
                                <div 
                                  className="pt-1 flex items-center gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Volume2 className="w-3 h-3 text-[#1ed760] shrink-0" />
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={volume}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      onVolumeChange(track.id, parseFloat(e.target.value));
                                    }}
                                    className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-[#1ed760] bg-white/20"
                                  />
                                  <span className="text-[9px] font-mono text-[#1ed760] shrink-0">
                                    %{volume}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Live News Feed */}
        {!isLightsOut && (
          <div className="lg:col-span-5 space-y-4">
          
          {/* Header Bar */}
          <div className={`flex items-center justify-between border rounded-2xl p-4 shadow-sm transition-colors ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121814] border-white/10'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-ping" />
              <Newspaper className="w-5 h-5 text-[#1ed760]" />
              <h2 className={`font-display text-base font-bold tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                Haber Akışı
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadLiveFeed}
                disabled={isLoadingLiveFeed}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 border cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-white/5 hover:bg-[#1ed760]/15 text-gray-300 hover:text-[#1ed760] border-white/10'
                }`}
                title="Haberleri Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#1ed760] ${isLoadingLiveFeed ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>

              <span className={`text-[11px] font-mono px-2.5 py-1.5 rounded-xl border ${
                theme === 'light' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white/5 text-gray-400 border-white/5'
              }`}>
                {displayArticles.length} makale
              </span>
            </div>
          </div>

          {/* Vertical News Cards Stream */}
          <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-[#1ed760]/30">
            {displayArticles.map((article) => {
              const isSaved = bookmarkedIds.includes(article.id);
              const readDurationMin = Math.max(1, Math.floor((article.durationSeconds || 180) / 60));

              return (
                <div
                  key={article.id}
                  className={`border rounded-2xl p-3.5 flex gap-3.5 transition-all shadow-sm group ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 hover:border-[#1ed760]/50 hover:bg-slate-50/80'
                      : 'bg-[#121814] border-white/5 hover:bg-[#161f19] hover:border-[#1ed760]/30'
                  }`}
                >
                  {/* Left: News Thumbnail */}
                  <div 
                    onClick={() => onSelectArticle(article)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 cursor-pointer"
                  >
                    <img
                      src={article.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                    
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-emerald-400">
                      {readDurationMin}m
                    </span>
                  </div>

                  {/* Right: Details & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#1ed760] uppercase tracking-wider">
                          {article.category || 'GÜNDEM'}
                        </span>

                        {onToggleBookmark && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPaywall('bookmark_action');
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isSaved ? 'text-[#1ed760]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                            title="Haberleri kaydetmek için VOX iOS uygulamasını indirin"
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectArticle(article)}
                        className={`font-bold text-xs sm:text-sm group-hover:text-[#1ed760] line-clamp-2 leading-snug cursor-pointer transition-colors ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {article.title}
                      </h3>

                      <p className={`text-[11px] line-clamp-1 leading-relaxed ${
                        theme === 'light' ? 'text-slate-600' : 'text-gray-400'
                      }`}>
                        {article.summary}
                      </p>
                    </div>

                    <div className={`flex items-center justify-between gap-2 pt-2 border-t mt-1 ${
                      theme === 'light' ? 'border-slate-100' : 'border-white/5'
                    }`}>
                      <span className={`text-[10px] font-medium truncate max-w-[130px] sm:max-w-[160px] flex items-center gap-1 ${
                        theme === 'light' ? 'text-slate-500' : 'text-gray-400'
                      }`}>
                        {article.sourceType === 'twitter' ? (
                          <>
                            <span className="text-[#1ed760] font-extrabold text-[11px]">𝕏</span>
                            <span className={`font-semibold truncate ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                              {article.author || 'Özet Geç Haber'}
                            </span>
                          </>
                        ) : (
                          <span className="truncate">{article.author || 'Anadolu Ajansı'}</span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onSelectArticle(article)}
                          className={`py-1 px-3 border rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                            theme === 'light'
                              ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300'
                              : 'bg-white/5 hover:bg-[#1ed760]/15 text-gray-300 hover:text-[#1ed760] border-white/10 hover:border-[#1ed760]/30'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#1ed760]" />
                          <span>Metni Oku</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>

      {/* Task Complete Celebration In-App Toast */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] bg-slate-900/95 dark:bg-[#0e1712]/95 border-2 border-[#1ed760] text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1ed760] text-black flex items-center justify-center shrink-0 shadow-md shadow-[#1ed760]/30 font-black">
              <PartyPopper className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#1ed760] uppercase tracking-wide">
                <span>GÖREV TAMAMLANDI</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80 font-normal">Tebrikler!</span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {celebrationToast.taskText}
              </p>
              <p className="text-[11px] text-emerald-300/90 truncate italic">
                "{celebrationToast.quote}"
              </p>
            </div>
            <button
              onClick={() => setCelebrationToast(null)}
              className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pomodoro Session Summary Modal (Fully Closeable & User Controlled) */}
      <AnimatePresence>
        {showSessionSummaryModal && sessionSummaryData && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeSessionSummaryModal();
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-summary-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0d1510] to-black border-2 border-[#1ed760]/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 relative overflow-hidden"
            >
              {/* Ambient Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#1ed760]/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button Top-Right (X) */}
              <button
                type="button"
                onClick={closeSessionSummaryModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer z-10"
                title="Pencereyi Kapat (Esc)"
                aria-label="Kapat"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Modal Header */}
              <div className="text-center space-y-1.5 pt-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1ed760] to-emerald-600 text-black flex items-center justify-center mx-auto shadow-lg shadow-[#1ed760]/30">
                  <Trophy className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 id="session-summary-title" className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Oturum Tamamlandı!
                </h3>
                <p className="text-xs text-emerald-300/90 font-medium">
                  {sessionSummaryData.roundNumber}. Odak Seansını harika bir disiplinle bitirdin.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Çalışma Süresi</span>
                  <span className="text-lg sm:text-xl font-black text-[#1ed760] font-mono">{sessionSummaryData.durationMins} Dk</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tamamlanan Görev</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">{sessionSummaryData.completedTasks.length} Adet</span>
                </div>
              </div>

              {/* Completed Tasks List in this Session */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-[#1ed760]" />
                    <span>Bu Seansta Tamamlananlar:</span>
                  </span>
                  <span className="text-[11px] text-[#1ed760] font-mono font-bold">
                    {sessionSummaryData.completedTasks.length} Görev
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {sessionSummaryData.completedTasks.length > 0 ? (
                    sessionSummaryData.completedTasks.map((taskText, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-xl bg-white/5 border border-[#1ed760]/20 text-gray-200"
                      >
                        <Check className="w-3.5 h-3.5 text-[#1ed760] stroke-[3] shrink-0" />
                        <span className="truncate">{taskText}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400">
                      Bu seansta derin odak ve zihinsel akış sağladın. Harika bir konsantrasyon!
                    </div>
                  )}
                </div>
              </div>

              {/* Motivational Praise Box */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-xs text-emerald-200 font-medium italic">
                  "{sessionSummaryData.motivationalPraise}"
                </p>
              </div>

              {/* Action Buttons: Take Break vs Skip Break vs Dismiss */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Primary: Start Break */}
                  <button
                    type="button"
                    onClick={() => startBreak(true)}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#1ed760] text-black font-black text-xs sm:text-sm hover:brightness-110 transition-all shadow-lg shadow-[#1ed760]/20 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>☕ Molayı Başlat ({breakMinutes} dk)</span>
                  </button>

                  {/* Secondary: Skip Break & Start Next Session Immediately */}
                  <button
                    type="button"
                    onClick={() => skipBreakAndStartWork(true)}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Mola vermeden hemen yeni seansa geç"
                  >
                    <span>🚀 Molayı Atla ({workMinutes} dk)</span>
                  </button>
                </div>

                {/* Subtle Dismiss / Close Link */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={closeSessionSummaryModal}
                    className="text-[11px] text-gray-400 hover:text-gray-200 underline underline-offset-2 transition-colors cursor-pointer py-1"
                  >
                    Şimdilik Kapat & Dinlen
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
