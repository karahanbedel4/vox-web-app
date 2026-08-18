import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes as RouterRoutes, Route as RouterRoute, Navigate as RouterNavigate } from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeContext';
import { PersistentLayout } from './components/PersistentLayout';
import { DashboardView } from './components/DashboardView';
import { FocusTab } from './components/FocusTab';
import { LibraryTab } from './components/LibraryTab';
import { ProfileTab } from './components/ProfileTab';

import { Article, UserProfile } from './types';
import { useSubscription } from './hooks/useSubscription';
import { 
  auth, 
  ensureAuthUser, 
  syncUserProfile, 
  getArticlesPaginated,
  saveArticle, 
  clearCustomArticlesFromFirestore,
  toggleBookmark, 
  getUserBookmarks,
  addFocusMinutes
} from './lib/firebase';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { ttsService } from './lib/ttsService';
import { calculateUserStreak, StreakInfo } from './lib/streakService';
import { subscribeNetworkStatus, cacheTop3Articles, getCachedOfflineArticles } from './lib/offlineService';
import { onAuthStateChanged } from 'firebase/auth';
import { appStorage } from './lib/storage';
import { AmbientChannel } from './components/AmbientMixerSheet';
import { woodRainSynth } from './lib/audioSynth';

const DEFAULT_AMBIENT_CHANNELS: AmbientChannel[] = [
  // 1. DOĞA & AMBİYANS
  {
    id: 'yt-nature-rain',
    name: 'Doğada Yağmur Sesi',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=3mst47Uu3IU',
    youtubeId: '3mst47Uu3IU',
    volume: 65,
    active: false
  },
  {
    id: 'yt-forest-birds',
    name: 'Sakin Orman & Kuş Sesi',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=xNN7iTA57jM',
    youtubeId: 'xNN7iTA57jM',
    volume: 65,
    active: false
  },
  {
    id: 'yt-thunder-rain',
    name: 'Şimşek ve Fırtına Sesi',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=9JEL_n6egA8',
    youtubeId: '9JEL_n6egA8',
    volume: 60,
    active: false
  },
  {
    id: 'yt-ocean-waves',
    name: 'Okyanus & Dalga Sesi',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=bn9F19Hi1Lk',
    youtubeId: 'bn9F19Hi1Lk',
    volume: 60,
    active: false
  },
  {
    id: 'yt-campfire-night',
    name: 'Gece & Kamp Ateşi Sesi',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    youtubeId: 'L_LUpnjgPso',
    volume: 55,
    active: false
  },
  {
    id: 'yt-cozy-cafe',
    name: 'Sakin Kafe Ambiyansı',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=gaGrHUekGrc',
    youtubeId: 'gaGrHUekGrc',
    volume: 55,
    active: false
  },

  // 2. LO-FI ODAKLANMA
  {
    id: 'yt-lofi-rain',
    name: 'Lo-Fi & Yağmur',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=sF80I-TQiW0',
    youtubeId: 'sF80I-TQiW0',
    volume: 60,
    active: false
  },
  {
    id: 'yt-lofi-chill',
    name: 'Lo-Fi Chill',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=fsPRybb-xXg',
    youtubeId: 'fsPRybb-xXg',
    volume: 60,
    active: false
  },
  {
    id: 'yt-deep-work',
    name: 'Derin Çalışma Müziği',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=czMO-L42nnc',
    youtubeId: 'czMO-L42nnc',
    volume: 55,
    active: false
  },

  // 3. EPİK & SİNEMA
  {
    id: 'yt-shire-study',
    name: 'Shire Sakin Çalışma',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=HFlxEM6zZsc',
    youtubeId: 'HFlxEM6zZsc',
    volume: 60,
    active: false
  },
  {
    id: 'yt-lotr-soundtrack',
    name: 'Yüzüklerin Efendisi Müzikleri',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=FrWuCPgsp_c',
    youtubeId: 'FrWuCPgsp_c',
    volume: 60,
    active: false
  },
  {
    id: 'yt-hp-ambient',
    name: 'Harry Potter Ambiyans',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=BQrxsyGTztM',
    youtubeId: 'BQrxsyGTztM',
    volume: 60,
    active: false
  },
  {
    id: 'yt-hp-seasons',
    name: 'Harry Potter Mevsimler',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=FZXWmqVorQc',
    youtubeId: 'FZXWmqVorQc',
    volume: 60,
    active: false
  }
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastDocSnapshot, setLastDocSnapshot] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreArticles, setHasMoreArticles] = useState<boolean>(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [isAmbientMixerOpen, setIsAmbientMixerOpen] = useState<boolean>(false);

  const [ambientChannels, setAmbientChannels] = useState<AmbientChannel[]>(() => {
    try {
      const saved = appStorage.getItemSync('vox_ambient_channels_v6');
      if (saved) {
        const parsed: AmbientChannel[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id.startsWith('yt-')) {
          const existingIds = new Set(parsed.map(c => c.id));
          const newChannels = DEFAULT_AMBIENT_CHANNELS.filter(c => !existingIds.has(c.id));
          return [...parsed.map(c => ({ ...c, type: 'youtube' as const, active: false })), ...newChannels];
        }
      }
    } catch (e) {}
    return DEFAULT_AMBIENT_CHANNELS;
  });

  // Keep ambient channels and active channel persisted in storage & cookies
  useEffect(() => {
    try {
      appStorage.setItemSync('vox_ambient_channels_v6', JSON.stringify(ambientChannels));
      const activeCh = ambientChannels.find(c => c.active && c.volume > 0);
      if (activeCh) {
        appStorage.setItemSync('vox_last_ambient_id', activeCh.id);
      }
    } catch (e) {}
  }, [ambientChannels]);

  const subscription = useSubscription(user);

  // Firebase Auth sync
  useEffect(() => {
    const handleAuthEvent = (e: any) => {
      if (e?.detail) {
        setUser(e.detail);
        if (e.detail.uid) ttsService.setUserId(e.detail.uid);
      }
    };
    window.addEventListener('vox_auth_changed', handleAuthEvent);

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const u = firebaseUser || (await ensureAuthUser());
      if (u) {
        const profile = await syncUserProfile(u);
        setUser(profile);
        ttsService.setUserId(u.uid);
        const bms = await getUserBookmarks(u.uid);
        setBookmarkedIds(bms);
      } else {
        const guestId = appStorage.getItemSync('vox_guest_uid') || `guest_${Date.now()}`;
        appStorage.setItemSync('vox_guest_uid', guestId);
        const guestProfile: UserProfile = {
          uid: guestId,
          displayName: 'Misafir Kullanıcı',
          email: 'misafir@vox.app',
          photoURL: '',
          birthdate: '1998-05-14',
          authProvider: 'guest',
          isPremium: false,
          subscriptionTier: 'free',
          dailyQuotaUsed: 0,
          lastQuotaResetDate: new Date().toISOString().split('T')[0],
          focusScore: 85,
          streakCount: 0,
          weeklyMinutes: 0,
          totalArticlesRead: 0,
          totalListenedMinutes: 0,
          createdAt: new Date().toISOString()
        };
        setUser(guestProfile);
        ttsService.setUserId(guestId);
      }
    });

    return () => {
      window.removeEventListener('vox_auth_changed', handleAuthEvent);
      unsubAuth();
    };
  }, []);

  // Fetch Initial Articles
  useEffect(() => {
    getArticlesPaginated(12, null).then(async res => {
      setArticles(res.articles);
      setLastDocSnapshot(res.lastDoc);
      setHasMoreArticles(res.hasMore);
      if (res.articles && res.articles.length > 0) {
        await cacheTop3Articles(res.articles);
      }
    }).catch(e => {
      console.warn('Initial articles fetch notice:', e);
    });
  }, []);

  const handlePlayArticle = async (article: Article) => {
    ttsService.loadArticle(article);
    ttsService.play();

    if (user) {
      const updatedMetrics = await addFocusMinutes(user.uid, 5);
      if (updatedMetrics) {
        setUser(prev => prev ? {
          ...prev,
          focusScore: updatedMetrics.focusScore,
          weeklyMinutes: updatedMetrics.weeklyMinutes
        } : null);
      }
    }
  };

  const handleToggleBookmark = async (articleId: string) => {
    const userId = user?.uid || 'guest';
    setBookmarkedIds(prev => {
      const isSaved = prev.includes(articleId);
      const next = isSaved ? prev.filter(id => id !== articleId) : [...prev, articleId];
      appStorage.setItem('vox_bookmarks', JSON.stringify(next));
      return next;
    });

    try {
      await toggleBookmark(userId, articleId);
    } catch (err) {
      console.warn('Bookmark sync notice:', err);
    }
  };

  const handleImportSuccess = async (articleData: Article) => {
    const saved = await saveArticle(articleData);
    setArticles(prev => [saved, ...prev]);
    handlePlayArticle(saved);
  };

  const handleRefreshUser = async () => {
    if (auth.currentUser) {
      const p = await syncUserProfile(auth.currentUser);
      setUser(p);
    }
  };

  const handleOpenPaywallModalWithReason = (reason: 'limit_reached' | 'pages_exceeded' | 'not_logged_in' = 'limit_reached') => {
    subscription.setPaywallReason(reason);
    subscription.setIsPaywallOpen(true);
  };

  const handleToggleAmbientChannel = (id: string) => {
    woodRainSynth.unlockAudioContext();
    setAmbientChannels(prev =>
      prev.map(ch => {
        if (ch.id === id) {
          const nextActive = !ch.active;
          const nextVol = nextActive ? (ch.volume === 0 ? 60 : ch.volume) : ch.volume;
          return { ...ch, active: nextActive, volume: nextVol };
        }
        return ch;
      })
    );
  };

  const handleAmbientVolumeChange = (id: string, vol: number) => {
    woodRainSynth.unlockAudioContext();
    setAmbientChannels(prev =>
      prev.map(ch => {
        if (ch.id === id) {
          return { ...ch, volume: vol, active: vol > 0 ? true : ch.active };
        }
        return ch;
      })
    );
  };

  return (
    <ThemeProvider>
      <Router>
        <RouterRoutes>
          <RouterRoute
            element={
              <PersistentLayout
                user={user}
                subscription={subscription}
                readingArticle={readingArticle}
                setReadingArticle={setReadingArticle}
                onPlayArticle={handlePlayArticle}
                onOpenPaywall={handleOpenPaywallModalWithReason}
                ambientChannels={ambientChannels}
                setAmbientChannels={setAmbientChannels}
                isAmbientMixerOpen={isAmbientMixerOpen}
                setIsAmbientMixerOpen={setIsAmbientMixerOpen}
              />
            }
          >
            {/* Default Root Route -> Haber Akışı (Gündem) */}
            <RouterRoute
              path="/"
              element={
                <DashboardView
                  category="Gündem"
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onSelectArticle={(art) => setReadingArticle(art)}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                />
              }
            />

            {/* News Dashboard Routes */}
            <RouterRoute
              path="/gundem"
              element={
                <DashboardView
                  category="Gündem"
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onSelectArticle={(art) => setReadingArticle(art)}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                />
              }
            />

            <RouterRoute
              path="/teknoloji"
              element={
                <DashboardView
                  category="Teknoloji"
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onSelectArticle={(art) => setReadingArticle(art)}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                />
              }
            />

            <RouterRoute
              path="/ekonomi"
              element={
                <DashboardView
                  category="Ekonomi"
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onSelectArticle={(art) => setReadingArticle(art)}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                />
              }
            />

            {/* Focus / Pomodoro Mode Route */}
            <RouterRoute
              path="/odaklan"
              element={
                <FocusTab
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  onPlayArticle={handlePlayArticle}
                  onSelectArticle={(art) => setReadingArticle(art)}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                  ambientChannels={ambientChannels}
                  onToggleAmbientChannel={handleToggleAmbientChannel}
                  onVolumeChange={handleAmbientVolumeChange}
                  onOpenAmbientMixer={() => setIsAmbientMixerOpen(true)}
                />
              }
            />

            {/* Library / PDF Upload Route */}
            <RouterRoute
              path="/kitaplik"
              element={
                <LibraryTab
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  user={user}
                  dailyQuotaUsed={subscription.dailyQuotaUsed}
                  isPremium={subscription.isPremium}
                  onPlayArticle={handlePlayArticle}
                  onToggleBookmark={handleToggleBookmark}
                  onImportSuccess={handleImportSuccess}
                  onOpenPaywallModal={handleOpenPaywallModalWithReason}
                  onIncrementQuota={subscription.incrementQuota}
                />
              }
            />

            {/* User Profile Route */}
            <RouterRoute
              path="/profil"
              element={
                <ProfileTab
                  user={user}
                  onRefreshUser={handleRefreshUser}
                  isAmbientActive={ambientChannels.some(c => c.active)}
                  activeAmbientName={ambientChannels.filter(c => c.active).map(c => c.name).join(', ')}
                  onToggleAmbient={() => setIsAmbientMixerOpen(true)}
                  onStopAmbient={() => setAmbientChannels(prev => prev.map(c => ({ ...c, active: false })))}
                  onOpenAmbientMixer={() => setIsAmbientMixerOpen(true)}
                  onOpenPaywall={() => handleOpenPaywallModalWithReason('limit_reached')}
                  onClearAllCache={() => {}}
                />
              }
            />

            {/* Fallback Catch-all Route */}
            <RouterRoute path="*" element={<RouterNavigate to="/" replace />} />
          </RouterRoute>
        </RouterRoutes>
      </Router>
    </ThemeProvider>
  );
}
