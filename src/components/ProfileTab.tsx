import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Headphones, 
  Sliders, 
  Volume2,
  Sparkles,
  Smartphone,
  ChevronRight,
  BarChart2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { UserProfile } from '../types';
import { appStorage } from '../lib/storage';

interface ProfileTabProps {
  user: UserProfile | null;
  onRefreshUser: () => void;
  isAmbientActive: boolean;
  activeAmbientName?: string;
  onToggleAmbient: () => void;
  onStopAmbient?: () => void;
  onOpenAmbientMixer?: () => void;
  onOpenPaywall?: () => void;
  onClearAllCache?: () => Promise<void> | void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onRefreshUser,
  onOpenPaywall,
  onClearAllCache
}) => {
  // Theme state
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    return (appStorage.getItemSync('vox_theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  // Clear Cache state
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
    } else if (themeMode === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    appStorage.setItem('vox_theme', themeMode);
    window.dispatchEvent(new CustomEvent('vox_theme_changed', { detail: themeMode }));
  }, [themeMode]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleClearCache = async () => {
    triggerHaptic();
    setIsClearingCache(true);
    try {
      if (onClearAllCache) {
        await onClearAllCache();
      }
      setCacheClearedMsg('Önbellek ve yerel veriler temizlendi.');
      setTimeout(() => setCacheClearedMsg(null), 3000);
    } catch (err) {
      console.error('Clear cache notice:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Focus Statistics - Mock calculation fallback
  const focusScore = user?.focusScore || 85;
  const weeklyMinutes = user?.weeklyMinutes || 45;
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  const weeklyChartData = [
    { gun: 'Pzt', dakika: 15 },
    { gun: 'Sal', dakika: 25 },
    { gun: 'Çar', dakika: 40 },
    { gun: 'Per', dakika: 20 },
    { gun: 'Cum', dakika: 35 },
    { gun: 'Cmt', dakika: 10 },
    { gun: 'Paz', dakika: 30 }
  ];

  return (
    <div className="pt-20 pb-28 px-4 max-w-md mx-auto space-y-6 text-on-surface">
      {/* Lead Magnet Banner: VOX iOS App */}
      <section 
        onClick={() => { triggerHaptic(); if (onOpenPaywall) onOpenPaywall(); }}
        className="bg-gradient-to-r from-emerald-950/80 via-[#121814] to-emerald-900/40 border-2 border-emerald-500/40 hover:border-emerald-500/80 p-5 rounded-3xl flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-lg">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-emerald-400">
              <Sparkles className="w-7 h-7 fill-emerald-400" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-lg font-black text-white">VOX Premium</h1>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                YAKINDA!
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium">Sınırsız Sesli Deneyim</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">iOS & Android Uygulamasını Keşfedin</p>
          </div>
        </div>

        <button
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-1 shadow-lg shrink-0 group-hover:scale-105 transition-transform"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>İndir</span>
        </button>
      </section>

      {/* Focus Statistics Bento Grid */}
      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-surface-container/80 border border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              HAFTALIK ODAK SÜRESİ
            </span>
            <p className="font-display text-2xl font-bold text-primary">
              {weeklyHours} Saat
            </p>
            <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Misafir Oturumu Aktif</span>
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-white/10" cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="5" />
              <circle className="text-primary" cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="5" strokeDasharray="163" strokeDashoffset={163 - (focusScore * 1.63)} />
            </svg>
            <span className="absolute text-xs font-bold text-primary">{focusScore}%</span>
          </div>
        </div>

        {/* Weekly Mini Chart */}
        <div className="col-span-2 bg-surface-container/80 border border-white/10 p-4 rounded-3xl shadow-lg space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              Haftalık İlerleme Grafiği
            </span>
            <span className="text-[10px] font-mono text-primary font-bold">
              {weeklyMinutes} dk toplam
            </span>
          </div>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="gun" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 60]} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#121814',
                    borderColor: '#22c55e',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="dakika" radius={[6, 6, 0, 0]}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.dakika > 30 ? '#10b981' : entry.dakika > 15 ? '#3b82f6' : '#64748b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Voice & Sound Settings */}
      <section className="bg-surface-container/80 border border-white/10 p-5 rounded-3xl space-y-4 shadow-lg">
        <h2 className="font-display text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          SES VE SESLENDİRME AYARLARI
        </h2>

        <div className="space-y-3">
          {/* HD Audio Lead Magnet */}
          <div 
            onClick={() => { triggerHaptic(); if (onOpenPaywall) onOpenPaywall(); }}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Headphones className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Gemini HD Studio Seslendirme</span>
                  <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-black">iOS</span>
                </p>
                <p className="text-[10px] text-gray-400">Yapay zeka stüdyo sesleri mobilde</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          {/* Web Voice engine */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-bold text-white">Tarayıcı TTS Motoru</p>
                <p className="text-[10px] text-gray-400">Hızlı web anlatım motoru</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              AKTİF
            </span>
          </div>
        </div>
      </section>

      {/* App Cache & Data Management */}
      <section className="bg-surface-container/80 border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
          VERİ VE ÖNBELLEK
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            {isClearingCache ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Trash2 className="w-4 h-4 text-gray-400" />}
            <span>Önbelleği Temizle</span>
          </button>
        </div>

        {cacheClearedMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-2xl text-xs font-bold text-center animate-fade-in">
            {cacheClearedMsg}
          </div>
        )}
      </section>
    </div>
  );
};
