import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { appStorage } from './storage';
import { triggerHapticImpact, triggerHapticNotification } from './haptics';

export interface FocusTask {
  id: string;
  text: string;
  done: boolean;
}

export const MOTIVATIONAL_FOCUS_QUOTES = [
  { text: "Zihnin olağanüstü berrak, odağın kusursuz. Şimdi derin akıştasın.", category: "Zihin Gücü" },
  { text: "Disiplin ve sabrın seni her saniye bir adım öne taşıyor. Harika gidiyorsun!", category: "Övgü & Başarı" },
  { text: "En büyük başarılar, tam da şu an sürdürdüğün bu küçük odak anlarında inşa edilir.", category: "Üretkenlik" },
  { text: "Düşüncelerini sadeleştir, dikkatini hedefine kilitle. Potansiyelin sınırsız!", category: "İlham" },
  { text: "Harika bir ivme yakaladın. Bu anı en yüksek verimle taçlandır.", category: "Akış Hali" },
  { text: "Zor olanı başarmak ve derinleşmek senin doğanda var. Asla durma!", category: "Motivasyon" },
  { text: "Hiçbir bildirim senin bu kıymetli derin çalışma anından daha değerli değil.", category: "Tam Odak" },
  { text: "Bugünkü emeğin ve sarsılmaz konsantrasyonun yarınki özgürlüğün olacak.", category: "Gelecek" },
  { text: "Kelimeler, hedefler ve kararlılık... Zirveye giden yol senin adımlarınla açılıyor.", category: "Özgüven" },
  { text: "Odaklanma bir süper güçtür ve sen şu an bu gücü en üst düzeyde kullanıyorsun.", category: "Süper Güç" },
  { text: "Küçük adımların kararlı birleşimi büyük devrimler yaratır. Harikasın!", category: "Gelişim" },
  { text: "Şimdi sadece sen ve başarmak istediğin iş var. Zirve senin.", category: "Netlik" },
];

/**
 * Synthesizes an uplifting harmonic chime when a task is completed.
 */
export function playTaskCompleteChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6 major triad
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gainNode.gain.setValueAtTime(0.0001, now + i * 0.07);
      gainNode.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.45);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.5);
    });
  } catch (e) {}
}

/**
 * Synthesizes a serene Mindfulness Bell / Chime sound using Web Audio API.
 */
export function playMindfulnessBell() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Harmonic bell frequencies (528Hz healing/focus pitch + harmonics)
    const freqs = [528, 1056, 1584, 2112];
    const gains = [0.45, 0.2, 0.1, 0.05];

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(gains[index], now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  } catch (e) {
    console.warn('Audio synthesis notice:', e);
  }
}

/**
 * Browser Web Notification Dispatcher with ServiceWorker fallback
 */
export function sendPomodoroWebNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icon.png',
            badge: '/icon.png',
            tag: 'vox-pomodoro-sync',
            renotify: true,
            silent: false
          } as NotificationOptions).catch(() => {
            new Notification(title, { body, icon: '/icon.png', tag: 'vox-pomodoro' });
          });
        }).catch(() => {
          new Notification(title, { body, icon: '/icon.png', tag: 'vox-pomodoro' });
        });
      } else {
        new Notification(title, { body, icon: '/icon.png', tag: 'vox-pomodoro' });
      }
    } catch (e) {
      console.warn('Notification notice:', e);
    }
  }
}

export function formatFocusTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface SessionSummaryData {
  completedTasks: string[];
  durationMins: number;
  roundNumber: number;
  motivationalPraise: string;
}

export interface CelebrationToastData {
  id: number;
  taskText: string;
  quote: string;
}

interface FocusContextType {
  // Timer State
  workMinutes: number;
  breakMinutes: number;
  sessionType: 'work' | 'break';
  timeLeft: number;
  isRunning: boolean;
  targetRounds: number;
  completedSessions: number;
  focusGoal: string;
  totalDurationSeconds: number;
  progressPercent: number;

  // Actions
  setWorkMinutes: (mins: number) => void;
  setBreakMinutes: (mins: number) => void;
  setTargetRounds: (rounds: number) => void;
  resetCompletedSessions: () => void;
  setFocusGoal: (goal: string) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  setSessionType: (type: 'work' | 'break') => void;

  // Tasks
  tasks: FocusTask[];
  filteredTasks: FocusTask[];
  taskFilter: 'all' | 'pending' | 'completed';
  setTaskFilter: (filter: 'all' | 'pending' | 'completed') => void;
  addTask: (text: string) => void;
  toggleTaskDone: (id: string) => void;
  removeTask: (id: string) => void;
  saveEditingTask: (id: string, text: string) => void;
  clearCompletedTasks: () => void;

  // Quotes
  quoteIndex: number;
  handleNextQuote: () => void;

  // Modals & Toasts
  showSessionSummaryModal: boolean;
  setShowSessionSummaryModal: (show: boolean) => void;
  sessionSummaryData: SessionSummaryData | null;
  celebrationToast: CelebrationToastData | null;
  setCelebrationToast: (toast: CelebrationToastData | null) => void;
  statusMessage: string | null;
  showTemporaryStatus: (msg: string) => void;

  // Top banner manual minimize
  isTopBannerDismissed: boolean;
  setIsTopBannerDismissed: (dismissed: boolean) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Timer settings
  const [workMinutes, setWorkMinutesState] = useState<number>(() => {
    try {
      const saved = appStorage.getItemSync('vox_focus_work_mins');
      return saved ? parseInt(saved, 10) || 25 : 25;
    } catch (e) {
      return 25;
    }
  });

  const [breakMinutes, setBreakMinutesState] = useState<number>(() => {
    try {
      const saved = appStorage.getItemSync('vox_focus_break_mins');
      return saved ? parseInt(saved, 10) || 5 : 5;
    } catch (e) {
      return 5;
    }
  });

  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState<number>(workMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [targetRounds, setTargetRoundsState] = useState<number>(() => {
    try {
      const saved = appStorage.getItemSync('vox_focus_target_rounds');
      return saved ? Math.max(1, parseInt(saved, 10) || 4) : 4;
    } catch (e) {
      return 4;
    }
  });
  const [isTopBannerDismissed, setIsTopBannerDismissed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const setTargetRounds = (rounds: number) => {
    const val = Math.max(1, Math.min(12, rounds || 4));
    setTargetRoundsState(val);
    try {
      appStorage.setItemSync('vox_focus_target_rounds', val.toString());
    } catch (e) {}
  };

  const resetCompletedSessions = () => {
    setCompletedSessions(0);
  };

  // Goal
  const [focusGoal, setFocusGoalState] = useState<string>(() => {
    try {
      return appStorage.getItemSync('vox_focus_goal') || 'Odaklanma Seansı';
    } catch (e) {
      return 'Odaklanma Seansı';
    }
  });

  const setFocusGoal = (goal: string) => {
    setFocusGoalState(goal);
    try {
      appStorage.setItemSync('vox_focus_goal', goal);
    } catch (e) {}
  };

  const setWorkMinutes = (mins: number) => {
    setWorkMinutesState(mins);
    try {
      appStorage.setItemSync('vox_focus_work_mins', mins.toString());
    } catch (e) {}
    if (sessionType === 'work' && !isRunning) {
      setTimeLeft(mins * 60);
      endTimeRef.current = null;
    }
  };

  const setBreakMinutes = (mins: number) => {
    setBreakMinutesState(mins);
    try {
      appStorage.setItemSync('vox_focus_break_mins', mins.toString());
    } catch (e) {}
    if (sessionType === 'break' && !isRunning) {
      setTimeLeft(mins * 60);
      endTimeRef.current = null;
    }
  };

  // Tasks
  const [tasks, setTasks] = useState<FocusTask[]>(() => {
    try {
      const saved = appStorage.getItemSync('vox_focus_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      appStorage.setItemSync('vox_focus_tasks', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sessionCompletedTaskIds, setSessionCompletedTaskIds] = useState<string[]>([]);
  const [celebrationToast, setCelebrationToast] = useState<CelebrationToastData | null>(null);

  // Modals
  const [showSessionSummaryModal, setShowSessionSummaryModal] = useState<boolean>(false);
  const [sessionSummaryData, setSessionSummaryData] = useState<SessionSummaryData | null>(null);

  // Motivational Focus & Praise Quotes
  const [quoteIndex, setQuoteIndex] = useState<number>(() => Math.floor(Math.random() * MOTIVATIONAL_FOCUS_QUOTES.length));

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_FOCUS_QUOTES.length);
    }, 12000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleNextQuote = () => {
    triggerHapticImpact('light').catch(() => {});
    setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_FOCUS_QUOTES.length);
  };

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'pending') return tasks.filter(t => !t.done);
    if (taskFilter === 'completed') return tasks.filter(t => t.done);
    return tasks;
  }, [tasks, taskFilter]);

  const addTask = (text: string) => {
    if (!text.trim()) return;
    const newTask: FocusTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      done: false
    };
    setTasks(prev => [newTask, ...prev]);
    triggerHapticImpact('light').catch(() => {});
    showTemporaryStatus('✨ Görev eklendi');
  };

  const toggleTaskDone = (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    const willBeDone = targetTask ? !targetTask.done : false;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

    if (willBeDone && targetTask) {
      playTaskCompleteChime();
      triggerHapticNotification('success').catch(() => {});
      setSessionCompletedTaskIds(prev => [...prev, id]);

      sendPomodoroWebNotification(
        '🎉 Görev Başarıyla Tamamlandı!',
        `Harikasın! "${targetTask.text}" görevini bitirdin. Zihnin çok keskin, odaklanmaya devam et!`
      );

      const randomQuote = MOTIVATIONAL_FOCUS_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_FOCUS_QUOTES.length)].text;
      setCelebrationToast({
        id: Date.now(),
        taskText: targetTask.text,
        quote: randomQuote
      });
      setTimeout(() => {
        setCelebrationToast(null);
      }, 4500);
    } else {
      triggerHapticImpact('light').catch(() => {});
      setSessionCompletedTaskIds(prev => prev.filter(tid => tid !== id));
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSessionCompletedTaskIds(prev => prev.filter(tid => tid !== id));
    triggerHapticImpact('light').catch(() => {});
  };

  const saveEditingTask = (id: string, text: string) => {
    if (!text.trim()) {
      removeTask(id);
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: text.trim() } : t));
    triggerHapticImpact('light').catch(() => {});
  };

  const clearCompletedTasks = () => {
    const completedCount = tasks.filter(t => t.done).length;
    if (completedCount === 0) return;
    setTasks(prev => prev.filter(t => !t.done));
    triggerHapticImpact('medium').catch(() => {});
    showTemporaryStatus(`🧹 ${completedCount} tamamlanmış görev temizlendi`);
  };

  // Timer Ticking & Background Precision
  const toggleTimer = () => {
    const willRun = !isRunning;
    setIsRunning(willRun);
    setIsTopBannerDismissed(false);
    triggerHapticImpact('medium').catch(() => {});

    if (willRun) {
      endTimeRef.current = Date.now() + timeLeft * 1000;

      // Ask for browser notification permission on start
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      const startTitle = 'VOX Odaklanma';
      const currentMins = sessionType === 'work' ? workMinutes : breakMinutes;
      const startBody = sessionType === 'work'
        ? `🎯 ${currentMins} dakikalık odaklanma seansı başladı.`
        : `☕ ${currentMins} dakikalık dinlenme başladı.`;
      sendPomodoroWebNotification(startTitle, startBody);
      showTemporaryStatus(sessionType === 'work' ? '🎯 Çalışma Başladı' : '☕ Mola Başladı');
    } else {
      endTimeRef.current = null;
      showTemporaryStatus('⏸️ Duraklatıldı');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionType('work');
    setTimeLeft(workMinutes * 60);
    triggerHapticImpact('light').catch(() => {});
    showTemporaryStatus('🔄 Sıfırlandı');
  };

  const skipSession = () => {
    if (sessionType === 'work') {
      setSessionType('break');
      const nextSecs = breakMinutes * 60;
      setTimeLeft(nextSecs);
      endTimeRef.current = isRunning ? Date.now() + nextSecs * 1000 : null;
      showTemporaryStatus(`☕ Molaya Geçildi (${breakMinutes} dk)`);
    } else {
      setSessionType('work');
      const nextSecs = workMinutes * 60;
      setTimeLeft(nextSecs);
      endTimeRef.current = isRunning ? Date.now() + nextSecs * 1000 : null;
      showTemporaryStatus(`🎯 Çalışmaya Geçildi (${workMinutes} dk)`);
    }
    triggerHapticImpact('medium').catch(() => {});
  };

  // Persistent Interval Loop (Runs globally across all pages!)
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const tick = () => {
      if (!endTimeRef.current) return;
      const remainingMs = endTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSecs <= 0) {
        playMindfulnessBell();
        triggerHapticNotification('success').catch(() => {});

        if (sessionType === 'work') {
          const currentRound = completedSessions + 1;
          setCompletedSessions(currentRound);

          const completedInThisSession = tasks
            .filter(t => sessionCompletedTaskIds.includes(t.id))
            .map(t => t.text);

          const randomPraise = MOTIVATIONAL_FOCUS_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_FOCUS_QUOTES.length)].text;

          setSessionSummaryData({
            completedTasks: completedInThisSession,
            durationMins: workMinutes,
            roundNumber: currentRound,
            motivationalPraise: randomPraise
          });
          setShowSessionSummaryModal(true);
          setSessionCompletedTaskIds([]);

          const summaryText = completedInThisSession.length > 0
            ? `Bu seansta ${completedInThisSession.length} görev tamamladın! 🎉`
            : `Harika bir derin odak seansı tamamladın! 🎯`;

          sendPomodoroWebNotification(
            '🏆 Pomodoro Seansı Tamamlandı!',
            `Tebrikler! ${workMinutes} dakikalık odaklanma bitti. ${summaryText} Şimdi ${breakMinutes} dakikalık mola vakti ☕`
          );

          setSessionType('break');
          showTemporaryStatus(`☕ Mola başladı (${breakMinutes} dk)`);
          const nextSecs = breakMinutes * 60;
          endTimeRef.current = Date.now() + nextSecs * 1000;
          setTimeLeft(nextSecs);
        } else {
          sendPomodoroWebNotification(
            '🔔 Mola Bitti!',
            `${breakMinutes} dakikalık mola bitti! Yeni ${workMinutes} dakikalık odaklanma seansı başladı 🎯`
          );

          setSessionType('work');
          showTemporaryStatus(`🎯 Yeni çalışma başladı (${workMinutes} dk)`);
          const nextSecs = workMinutes * 60;
          endTimeRef.current = Date.now() + nextSecs * 1000;
          setTimeLeft(nextSecs);
        }
      } else {
        setTimeLeft(remainingSecs);
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, sessionType, workMinutes, breakMinutes, timeLeft, completedSessions, tasks, sessionCompletedTaskIds]);

  const totalDurationSeconds = (sessionType === 'work' ? workMinutes : breakMinutes) * 60;
  const progressPercent = totalDurationSeconds > 0
    ? Math.min(100, Math.max(0, ((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100))
    : 0;

  return (
    <FocusContext.Provider
      value={{
        workMinutes,
        breakMinutes,
        sessionType,
        timeLeft,
        isRunning,
        targetRounds,
        completedSessions,
        focusGoal,
        totalDurationSeconds,
        progressPercent,
        setWorkMinutes,
        setBreakMinutes,
        setTargetRounds,
        resetCompletedSessions,
        setFocusGoal,
        toggleTimer,
        resetTimer,
        skipSession,
        setSessionType,
        tasks,
        filteredTasks,
        taskFilter,
        setTaskFilter,
        addTask,
        toggleTaskDone,
        removeTask,
        saveEditingTask,
        clearCompletedTasks,
        quoteIndex,
        handleNextQuote,
        showSessionSummaryModal,
        setShowSessionSummaryModal,
        sessionSummaryData,
        celebrationToast,
        setCelebrationToast,
        statusMessage,
        showTemporaryStatus,
        isTopBannerDismissed,
        setIsTopBannerDismissed
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
