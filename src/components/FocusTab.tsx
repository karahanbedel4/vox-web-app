import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
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
  Clock
} from 'lucide-react';
import { Article } from '../types';
import { triggerHapticImpact, triggerHapticNotification } from '../lib/haptics';
import { AmbientChannel } from './AmbientMixerSheet';
import { fetchNewsByCategory } from '../lib/newsService';

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
 * Synthesizes a serene Tibetan Mindfulness Bell / Chime sound using Web Audio API.
 * Fundamental 528Hz (Focus/Healing pitch) with rich harmonic overtones.
 */
function playMindfulnessBell() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs = [528, 1056, 1584];
    const gains = [0.4, 0.15, 0.08];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(gains[idx], now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.0);
    });

    // Echo ring
    setTimeout(() => {
      try {
        const echoNow = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, echoNow);
        gainNode.gain.setValueAtTime(0.0001, echoNow);
        gainNode.gain.linearRampToValueAtTime(0.15, echoNow + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, echoNow + 2.5);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(echoNow);
        osc.stop(echoNow + 2.6);
      } catch {}
    }, 250);

  } catch (err) {
    console.warn('Mindfulness chime audio synthesis notice:', err);
  }
}

/**
 * Sends a browser Web Push Notification if permission is granted.
 */
function sendPomodoroWebNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'pomodoro-notification'
          } as NotificationOptions).catch(() => {
            new Notification(title, { body, icon: '/favicon.ico' });
          });
        });
      } else {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (err) {
      console.warn('Web notification send notice:', err);
    }
  }

  // Also post to backend push API endpoint
  fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body })
  }).catch(() => {});
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
const WORK_OPTIONS = [25, 45, 50, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];

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
  onOpenAmbientMixer
}) => {
  // POMODORO STATE
  // Mode: 'work' (Çalışma) -> Otomatik 'break' (Mola) -> Otomatik 'work'
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  
  // Custom Focus Goal & Tasks
  const [focusGoal, setFocusGoal] = useState<string>('Odaklanma Seansı');
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'İlk görevini yaz...', done: false }
  ]);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const toggleTaskDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    triggerHapticImpact('light').catch(() => {});
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    triggerHapticImpact('light').catch(() => {});
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), done: false }]);
    setNewTaskText('');
    setIsAddingTask(false);
    triggerHapticImpact('light').catch(() => {});
  };

  // NOTIFICATION STATE & COOKIE CONSENT
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const cookieVal = getCookie('vox_push_consent');
    if (cookieVal === 'granted' || cookieVal === 'dismissed' || cookieVal === 'denied') {
      return true;
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      return true;
    }
    return false;
  });

  // LIVE NEWS FEED STATE
  const [liveNews, setLiveNews] = useState<Article[]>([]);
  const [isLoadingLiveFeed, setIsLoadingLiveFeed] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Check initial notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      setNotifPermission(perm);
      if (perm === 'granted') {
        setCookie('vox_push_consent', 'granted', 365);
        setHasConsented(true);
      }
    }
  }, []);

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
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tarayıcınız Web Bildirimlerini desteklemiyor.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);

      if (result === 'granted') {
        setCookie('vox_push_consent', 'granted', 365);
        setHasConsented(true);

        triggerHapticNotification('success').catch(() => {});
        sendPomodoroWebNotification(
          '🔔 VOX Bildirimleri Aktif!',
          'Çalışma ve mola geçişlerinde anlık bildirim alacaksınız.'
        );
      } else if (result === 'denied') {
        setCookie('vox_push_consent', 'denied', 365);
        setHasConsented(true);
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  const dismissNotificationBanner = () => {
    setCookie('vox_push_consent', 'dismissed', 30);
    setHasConsented(true);
  };

  const testBellAndNotification = () => {
    playMindfulnessBell();
    triggerHapticNotification('success').catch(() => {});
    showTemporaryStatus('🔔 Tibet çan sesi çalındı');
  };

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Change Work Duration
  const handleSelectWorkMinutes = (mins: number) => {
    setWorkMinutes(mins);
    if (sessionType === 'work' && !isRunning) {
      setTimeLeft(mins * 60);
    }
    triggerHapticImpact('light').catch(() => {});
  };

  // Change Break Duration
  const handleSelectBreakMinutes = (mins: number) => {
    setBreakMinutes(mins);
    if (sessionType === 'break' && !isRunning) {
      setTimeLeft(mins * 60);
    }
    triggerHapticImpact('light').catch(() => {});
  };

  const toggleTimer = () => {
    const willRun = !isRunning;
    setIsRunning(willRun);
    triggerHapticImpact('medium').catch(() => {});

    if (willRun) {
      // Ask for browser notification permission on first start if not decided
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((result) => {
          setNotifPermission(result);
          if (result === 'granted') {
            setCookie('vox_push_consent', 'granted', 365);
            setHasConsented(true);
          } else if (result === 'denied') {
            setCookie('vox_push_consent', 'denied', 365);
            setHasConsented(true);
          }
        }).catch(() => {});
      }

      const startTitle = sessionType === 'work' ? '🚀 Çalışma Başladı' : '☕ Mola Başladı';
      const currentMins = sessionType === 'work' ? workMinutes : breakMinutes;
      const startBody = sessionType === 'work' 
        ? `${currentMins} dakikalık odaklanma seansı başladı.` 
        : `${currentMins} dakikalık dinlenme başladı.`;
      sendPomodoroWebNotification(startTitle, startBody);
      showTemporaryStatus(sessionType === 'work' ? '🎯 Çalışma Başladı' : '☕ Mola Başladı');
    } else {
      showTemporaryStatus('⏸️ Duraklatıldı');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionType('work');
    setTimeLeft(workMinutes * 60);
    triggerHapticImpact('light').catch(() => {});
    showTemporaryStatus('🔄 Sıfırlandı');
  };

  // AUTOMATIC TRANSITION EFFECT (Çalışma bitince -> Dinlenme, Dinlenme bitince -> Çalışma)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playMindfulnessBell();
            triggerHapticNotification('success').catch(() => {});

            if (sessionType === 'work') {
              // 1. Çalışma bitti -> Doğrudan Molaya Geç
              setCompletedSessions((s) => s + 1);
              sendPomodoroWebNotification(
                'VOX Odaklanma',
                'Tebrikler! Seans bitti, şimdi kısa bir mola vakti ☕'
              );

              setSessionType('break');
              showTemporaryStatus(`☕ Mola başladı (${breakMinutes} dk)`);
              return breakMinutes * 60;

            } else {
              // 2. Mola bitti -> Doğrudan Çalışmaya Geç
              sendPomodoroWebNotification(
                '🔔 Mola Bitti!',
                `${breakMinutes} dk mola tamamlandı. ${workMinutes} dk yeni çalışma seansı başladı.`
              );

              setSessionType('work');
              showTemporaryStatus(`🎯 Yeni çalışma başladı (${workMinutes} dk)`);
              return workMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, sessionType, workMinutes, breakMinutes]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalCurrentDuration = (sessionType === 'work' ? workMinutes : breakMinutes) * 60;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((totalCurrentDuration - timeLeft) / totalCurrentDuration) * 100)));

  // Right side news list
  const displayArticles = (liveNews.length > 0 ? liveNews : articles).slice(0, 12);

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto space-y-6 text-gray-200">
      
      {/* Clean Top Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-black text-white tracking-tight">
            Odaklanma Alanı
          </h1>
          <p className="text-xs text-gray-400">
            Çalışma ve dinlenme döngüsü, görevler ve ambiyans sesleri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161c23] border border-white/10 rounded-xl text-xs font-bold text-white shadow-sm">
            <Flame className="w-3.5 h-3.5 text-[#10b981] fill-current" />
            <span>{completedSessions} Seans</span>
          </div>

          <button
            onClick={testBellAndNotification}
            className="p-2 bg-[#161c23] border border-white/10 hover:bg-[#10b981]/15 text-gray-300 hover:text-[#10b981] rounded-xl transition-all shadow-sm"
            title="Tibet Çan Sesini Test Et"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WEB PUSH NOTIFICATION PROMPT CARD */}
      {!hasConsented && notifPermission !== 'granted' && (
        <div className="bg-[#161c23] border border-[#10b981]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm relative group">
          <button
            onClick={dismissNotificationBanner}
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3 pr-6 sm:pr-0">
            <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0 text-[#10b981]">
              <Bell className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white">Mola bildirimlerini açın</h3>
              <p className="text-[11px] text-gray-400">Çalışma veya mola tamamlandığında anlık bildirim alın.</p>
            </div>
          </div>

          <button
            onClick={requestNotificationPermission}
            className="py-2 px-3.5 bg-[#10b981] text-black font-extrabold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 fill-current" />
            <span>Bildirimleri Aç</span>
          </button>
        </div>
      )}

      {/* 2-COLUMN SPLIT GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Modern Phone Mockup Display & Ambient Sounds */}
        <div className="lg:col-span-7 space-y-6">

          {/* INTEGRATED DÖNGÜ (CYCLE) CONFIGURATION CARD */}
          <div className="bg-surface-container border border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Çalışma Süresi Seçici */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1ed760]" />
                    <span>Çalışma</span>
                  </span>
                  <span className="font-mono font-bold text-[#1ed760]">{workMinutes} dk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {WORK_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSelectWorkMinutes(m)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        workMinutes === m
                          ? 'bg-[#1ed760] text-black border-[#1ed760] shadow-md shadow-[#1ed760]/20'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Ortadaki Akış Oku */}
              <div className="hidden sm:flex items-center justify-center pt-5 text-gray-500">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Dinlenme / Mola Süresi Seçici */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Dinlenme / Mola</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">{breakMinutes} dk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {BREAK_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSelectBreakMinutes(m)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        breakMinutes === m
                          ? 'bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* MODERN PHONE FRAME MOCKUP (Matching Uploaded Screenshot Aesthetic) */}
          <div className="relative mx-auto max-w-[370px] sm:max-w-[400px]">
            
            {/* Ambient Glow Behind Phone */}
            <div className={`absolute -inset-4 rounded-[50px] blur-3xl transition-opacity duration-1000 pointer-events-none opacity-35 ${
              sessionType === 'work' ? 'bg-gradient-to-b from-[#1ed760]/20 via-emerald-950/20 to-black' : 'bg-gradient-to-b from-amber-500/20 via-orange-950/20 to-black'
            }`} />

            {/* Phone Outer Chassis */}
            <div className="relative bg-[#0a0d0b] border-[6px] border-[#1d2620] rounded-[48px] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(30,215,96,0.12)] overflow-hidden">
              
              {/* Phone Top Status Bar */}
              <div className="flex items-center justify-between px-3 pt-1 pb-3 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight text-white">
                    {currentTime}
                  </span>
                </div>
                
                {/* Dynamic Island Pill */}
                <div className="w-20 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-white/10 mr-1" />
                </div>

                {/* Status Bar Right: Signal + Device Battery Level & Charging Status (No WIFI) */}
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

              {/* Phone Inner Screen Content */}
              <div className="space-y-4 pt-1 pb-1">
                
                {/* Dynamic Live Date Badge */}
                <div className="flex items-center justify-between px-1.5 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span className="capitalize">{currentDateStr}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                    <Clock className="w-3 h-3 text-[#1ed760]" />
                    <span>{currentTime}</span>
                  </div>
                </div>

                {/* Clean Goal Title */}
                <div className="px-1">
                  {isEditingGoal ? (
                    <input
                      type="text"
                      value={focusGoal}
                      onChange={(e) => setFocusGoal(e.target.value)}
                      placeholder="Odaklanma hedefi..."
                      className="w-full bg-white/10 border border-[#1ed760]/50 rounded-xl px-3 py-1.5 text-xl font-bold text-white outline-none"
                      autoFocus
                      onBlur={() => setIsEditingGoal(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                    />
                  ) : (
                    <h2 
                      onClick={() => setIsEditingGoal(true)}
                      className="font-serif text-2xl font-bold text-white tracking-tight leading-snug cursor-pointer hover:text-[#1ed760] transition-colors"
                      title="Hedefi düzenlemek için tıklayın"
                    >
                      {focusGoal}
                    </h2>
                  )}
                </div>

                {/* Minimalist Tasks / To-Do Checklist */}
                <div className="bg-[#0e1410] border border-white/5 rounded-2xl p-3 space-y-2.5">
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center justify-between gap-2 text-xs py-1 px-1.5 rounded-lg hover:bg-white/5 group transition-colors"
                      >
                        <button
                          onClick={() => toggleTaskDone(task.id)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            task.done 
                              ? 'bg-[#1ed760] border-[#1ed760] text-black' 
                              : 'border-white/20 hover:border-white/40'
                          }`}>
                            {task.done && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                          </div>
                          <span className={`truncate ${task.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {task.text}
                          </span>
                        </button>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-opacity"
                          title="Sil"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Task Input Row */}
                  {isAddingTask ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="| Görev yazın..."
                        className="flex-1 bg-white/5 border border-[#1ed760]/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-gray-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addTask();
                          if (e.key === 'Escape') setIsAddingTask(false);
                        }}
                      />
                      <button
                        onClick={addTask}
                        className="py-1 px-2.5 bg-[#1ed760] text-black rounded-lg text-xs font-bold hover:brightness-110"
                      >
                        Ekle
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="w-full text-left text-xs text-gray-500 hover:text-gray-300 py-1 px-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-[#1ed760] font-bold">+</span>
                      <span>| Görev veya not ekle...</span>
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
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Sıfırla"
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

                    <button
                      onClick={testBellAndNotification}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#1ed760]/20 border border-white/10 text-gray-400 hover:text-[#1ed760] flex items-center justify-center transition-colors"
                      title="Tibet Çanı Çal"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
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

              </div>

              {/* Bottom Home Bar */}
              <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mt-3" />
            </div>
          </div>

          {/* DOĞA SESLERİ & AMBİYANS */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-[#1ed760]" />
                <h2 className="font-display text-base md:text-lg font-bold text-white">Doğa Sesleri & Ambiyans</h2>
              </div>

              <button
                onClick={onOpenAmbientMixer}
                className="px-3 py-1.5 rounded-xl bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/30 text-xs font-bold hover:bg-[#1ed760]/20 transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Gelişmiş Mikser</span>
              </button>
            </div>

            {/* Sound Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ambientChannels.slice(0, 6).map((channel) => {
                const isPlayingThis = channel.active && channel.volume > 0;
                const IconComponent = getChannelIconComponent(channel.name, channel.id);

                return (
                  <div
                    key={channel.id}
                    onClick={() => onToggleAmbientChannel(channel.id)}
                    className={`bg-surface-container border p-4 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                      isPlayingThis
                        ? 'border-emerald-500 bg-[#1ed760]/10 ring-2 ring-emerald-500 shadow-[0_0_25px_rgba(30,215,96,0.22)] scale-[1.01]'
                        : 'border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors relative overflow-hidden ${
                          isPlayingThis ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' : 'bg-white/5 text-[#1ed760]'
                        }`}>
                          {isPlayingThis ? (
                            <div className="flex items-end gap-0.5 h-4">
                              <div className="w-1 bg-black rounded-full animate-eq-1" />
                              <div className="w-1 bg-black rounded-full animate-eq-2" />
                              <div className="w-1 bg-black rounded-full animate-eq-3" />
                              <div className="w-1 bg-black rounded-full animate-eq-4" />
                            </div>
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white">{channel.name}</h3>
                            {isPlayingThis && (
                              <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                Çalıyor
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {isPlayingThis ? `Ses Seviyesi: %${channel.volume}` : 'Çalmak için dokunun'}
                          </span>
                        </div>
                      </div>

                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isPlayingThis ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}>
                        {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </div>
                    </div>

                    {/* Inline Volume Slider */}
                    {isPlayingThis && onVolumeChange && (
                      <div 
                        className="flex items-center gap-2 pt-2 border-t border-emerald-500/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={channel.volume}
                          onChange={(e) => {
                            e.stopPropagation();
                            onVolumeChange(channel.id, parseFloat(e.target.value));
                          }}
                          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 w-8 text-right shrink-0">
                          %{channel.volume}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Live News Feed */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-surface-container border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-ping" />
              <Newspaper className="w-5 h-5 text-[#1ed760]" />
              <h2 className="font-display text-base font-bold text-white tracking-tight">
                Haber Akışı
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadLiveFeed}
                disabled={isLoadingLiveFeed}
                className="py-1.5 px-3 bg-white/5 hover:bg-[#1ed760]/15 text-gray-300 hover:text-[#1ed760] border border-white/10 hover:border-[#1ed760]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Haberleri Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#1ed760] ${isLoadingLiveFeed ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>

              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
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
                  className="bg-surface-container hover:bg-[#161f19] border border-white/5 hover:border-[#1ed760]/30 rounded-2xl p-3.5 flex gap-3.5 transition-all shadow-sm group"
                >
                  {/* Left: News Thumbnail */}
                  <div 
                    onClick={() => onSelectArticle(article)}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-white/5 cursor-pointer"
                  >
                    <img
                      src={article.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80';
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
                              isSaved ? 'text-[#1ed760]' : 'text-gray-500 hover:text-gray-300'
                            }`}
                            title="Haberleri kaydetmek için VOX iOS uygulamasını indirin"
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectArticle(article)}
                        className="font-bold text-xs sm:text-sm text-white group-hover:text-[#1ed760] line-clamp-2 leading-snug cursor-pointer transition-colors"
                      >
                        {article.title}
                      </h3>

                      <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 mt-1">
                      <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px] sm:max-w-[130px]">
                        {article.author || 'Anadolu Ajansı'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onSelectArticle(article)}
                          className="py-1 px-3 bg-white/5 hover:bg-[#1ed760]/15 text-gray-300 hover:text-[#1ed760] border border-white/10 hover:border-[#1ed760]/30 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
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

      </div>
    </div>
  );
};
