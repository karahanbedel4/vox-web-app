import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes as RouterRoutes, Route as RouterRoute, Navigate as RouterNavigate } from 'react-router-dom';
import { ThemeProvider } from './lib/ThemeContext';
import { FocusProvider } from './lib/FocusContext';
import { PersistentLayout } from './components/PersistentLayout';
import { DashboardView } from './components/DashboardView';
import { NewsArticlePage } from './components/NewsArticlePage';
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
import { AmbientChannel, PlaylistInfo } from './components/AmbientMixerSheet';
import { woodRainSynth } from './lib/audioSynth';
import { universalSynthService } from './lib/universalSynthService';
import { ALL_DEFAULT_AMBIENT_CHANNELS, ALL_TRACKS, ALL_SOUND_SHELVES, SoundTrack } from './lib/soundtrackData';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastDocSnapshot, setLastDocSnapshot] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreArticles, setHasMoreArticles] = useState<boolean>(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [isAmbientMixerOpen, setIsAmbientMixerOpen] = useState<boolean>(false);

  // Active playlist shelf ID & sequential playback queue
  const [activePlaylistShelfId, setActivePlaylistShelfId] = useState<string>('series');
  const [isContinuousPlaylistMode, setIsContinuousPlaylistMode] = useState<boolean>(true);

  // Initialize and merge ambient channels (supporting direct stream MP3 across all categories)
  const [ambientChannels, setAmbientChannels] = useState<AmbientChannel[]>(() => {
    try {
      const saved = appStorage.getItemSync('vox_ambient_channels_v10');
      if (saved) {
        const parsed: AmbientChannel[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with default channel URLs to always keep audio stream URLs fresh
          const defaultMap = new Map(ALL_DEFAULT_AMBIENT_CHANNELS.map(c => [c.id, c]));
          return ALL_DEFAULT_AMBIENT_CHANNELS.map(defCh => {
            const userCh = parsed.find(p => p.id === defCh.id);
            if (userCh) {
              return {
                ...defCh,
                active: userCh.active,
                volume: userCh.volume
              };
            }
            return defCh;
          });
        }
      }
    } catch (e) {}
    return ALL_DEFAULT_AMBIENT_CHANNELS;
  });

  // Keep ambient channels persisted
  useEffect(() => {
    try {
      appStorage.setItemSync('vox_ambient_channels_v10', JSON.stringify(ambientChannels));
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
          email: '',
          photoURL: '',
          authProvider: 'guest',
          dailyQuotaUsed: 0,
          isPremium: false,
          streakCount: 0,
          weeklyMinutes: 0,
          totalArticlesRead: 0,
          totalListenedMinutes: 0,
          focusScore: 50,
          createdAt: new Date().toISOString()
        };
        setUser(guestProfile);
      }
    });

    return () => {
      window.removeEventListener('vox_auth_changed', handleAuthEvent);
      unsubAuth();
    };
  }, []);

  // Offline status & top articles cache
  useEffect(() => {
    const unsubNet = subscribeNetworkStatus((online) => {
      if (!online) {
        getCachedOfflineArticles().then(cached => {
          if (cached.length > 0) {
            setArticles(cached);
          }
        });
      }
    });

    return () => unsubNet();
  }, []);

  // Initial Articles Fetch
  useEffect(() => {
    getArticlesPaginated(15, null).then(async (res) => {
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

  // Play a single ambient sound channel
  const handleToggleAmbientChannel = (id: string) => {
    woodRainSynth.unlockAudioContext();
    universalSynthService.unlock();
    const track = ALL_TRACKS.find(t => t.id === id);
    const channelType: 'stream' | 'youtube' | 'synth' = track?.type || (track?.audioUrl ? 'stream' : 'youtube');
    const trackUrl = track?.audioUrl || (track?.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : undefined);

    setAmbientChannels(prev => {
      const exists = prev.some(c => c.id === id);
      const baseList = exists ? prev : (track ? [...prev, {
        id: track.id,
        name: track.name,
        type: channelType,
        url: trackUrl,
        youtubeId: track.youtubeId,
        volume: 65,
        active: true
      }] : prev);

      return baseList.map(ch => {
        if (ch.id === id) {
          const nextActive = !ch.active;
          const nextVol = nextActive ? (ch.volume === 0 ? 60 : ch.volume) : ch.volume;
          return { 
            ...ch, 
            type: channelType, 
            url: trackUrl || ch.url, 
            active: nextActive, 
            volume: nextVol 
          };
        }
        return ch;
      });
    });
  };

  // Volume change
  const handleAmbientVolumeChange = (id: string, vol: number) => {
    woodRainSynth.unlockAudioContext();
    universalSynthService.unlock();
    setAmbientChannels(prev =>
      prev.map(ch => {
        if (ch.id === id) {
          return { ...ch, volume: vol, active: vol > 0 ? true : ch.active };
        }
        return ch;
      })
    );
  };

  // Helper to accurately match a channel to a track
  const isTrackMatch = (ch: AmbientChannel, trackOrId: SoundTrack | string): boolean => {
    if (typeof trackOrId === 'string') {
      return ch.id === trackOrId;
    }
    if (ch.id === trackOrId.id) return true;
    if (Boolean(trackOrId.youtubeId) && Boolean(ch.youtubeId) && ch.youtubeId === trackOrId.youtubeId) return true;
    return false;
  };

  // Currently active primary channel
  const activeAmbientChannel = ambientChannels.find(c => c.active && c.volume > 0) || null;

  // Active playlist queue resolution
  const currentShelf = ALL_SOUND_SHELVES.find(s => s.id === activePlaylistShelfId) || ALL_SOUND_SHELVES[0];
  const activePlaylistTracks = currentShelf.tracks;

  // Current track index in active playlist
  const currentTrackIndex = useMemo(() => {
    if (!activeAmbientChannel) return 0;
    const idx = activePlaylistTracks.findIndex(t => isTrackMatch(activeAmbientChannel, t));
    return idx >= 0 ? idx : 0;
  }, [activeAmbientChannel, activePlaylistTracks]);

  // Playlist Info metadata for Mini Player & Mixer Sheet
  const playlistInfo: PlaylistInfo | null = useMemo(() => {
    if (!activeAmbientChannel) return null;
    const currentTrack = ALL_TRACKS.find(t => isTrackMatch(activeAmbientChannel, t));
    return {
      title: currentTrack?.categoryTitle || currentShelf.title,
      subtitle: currentTrack?.subtitle || activeAmbientChannel.name,
      currentIndex: currentTrackIndex,
      totalTracks: activePlaylistTracks.length,
      isContinuous: isContinuousPlaylistMode
    };
  }, [activeAmbientChannel, currentShelf, currentTrackIndex, activePlaylistTracks.length, isContinuousPlaylistMode]);

  // Play a specific track in playlist mode (only this track is active)
  const playTrackInPlaylist = useCallback((track: SoundTrack) => {
    woodRainSynth.unlockAudioContext();
    universalSynthService.unlock();
    const channelType: 'stream' | 'youtube' | 'synth' = track.type || (track.audioUrl ? 'stream' : 'youtube');
    const trackUrl = track.audioUrl || (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : undefined);

    setAmbientChannels(prev => {
      // Ensure target channel exists
      const exists = prev.some(c => c.id === track.id || (Boolean(track.youtubeId) && Boolean(c.youtubeId) && c.youtubeId === track.youtubeId));
      const baseList = exists ? prev : [...prev, {
        id: track.id,
        name: track.name,
        type: channelType,
        url: trackUrl,
        youtubeId: track.youtubeId,
        volume: 65,
        active: true
      }];

      return baseList.map(ch => {
        const isThisTrack = ch.id === track.id || (Boolean(track.youtubeId) && Boolean(ch.youtubeId) && ch.youtubeId === track.youtubeId);
        if (isThisTrack) {
          return { 
            ...ch, 
            type: channelType,
            url: trackUrl,
            youtubeId: track.youtubeId,
            active: true, 
            volume: ch.volume > 0 ? ch.volume : 65 
          };
        }
        return { ...ch, active: false };
      });
    });
  }, []);

  // Start continuous playlist from a shelf
  const handleStartPlaylist = useCallback((shelfId: string, startTrackId?: string) => {
    setActivePlaylistShelfId(shelfId);
    setIsContinuousPlaylistMode(true);

    const shelf = ALL_SOUND_SHELVES.find(s => s.id === shelfId) || ALL_SOUND_SHELVES[0];
    const targetTrack = startTrackId 
      ? (shelf.tracks.find(t => t.id === startTrackId || (Boolean(t.youtubeId) && t.youtubeId === startTrackId)) || shelf.tracks[0])
      : shelf.tracks[0];

    if (targetTrack) {
      playTrackInPlaylist(targetTrack);
    }
  }, [playTrackInPlaylist]);

  // Sequential Playback: Next Track ("biri bitince diğeri başlasın")
  const handleNextAmbientTrack = useCallback(() => {
    if (activePlaylistTracks.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % activePlaylistTracks.length;
    const nextTrack = activePlaylistTracks[nextIndex];
    if (nextTrack) {
      playTrackInPlaylist(nextTrack);
    }
  }, [activePlaylistTracks, currentTrackIndex, playTrackInPlaylist]);

  // Sequential Playback: Previous Track
  const handlePrevAmbientTrack = useCallback(() => {
    if (activePlaylistTracks.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + activePlaylistTracks.length) % activePlaylistTracks.length;
    const prevTrack = activePlaylistTracks[prevIndex];
    if (prevTrack) {
      playTrackInPlaylist(prevTrack);
    }
  }, [activePlaylistTracks, currentTrackIndex, playTrackInPlaylist]);

  // When a track finishes on YouTube: auto-advance to next track!
  const handleAmbientTrackEnded = useCallback(() => {
    if (isContinuousPlaylistMode) {
      handleNextAmbientTrack();
    }
  }, [isContinuousPlaylistMode, handleNextAmbientTrack]);

  return (
    <ThemeProvider>
      <FocusProvider>
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
                onNextAmbientTrack={handleNextAmbientTrack}
                onPrevAmbientTrack={handlePrevAmbientTrack}
                onAmbientTrackEnded={handleAmbientTrackEnded}
                playlistInfo={playlistInfo}
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

            {/* Bundle-style Dedicated SEO News Detail Page Route */}
            <RouterRoute
              path="/haber/:slug"
              element={
                <NewsArticlePage
                  articles={articles}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={(art) => handleToggleBookmark(art.id)}
                  onPlayArticle={handlePlayArticle}
                  onOpenPaywall={handleOpenPaywallModalWithReason}
                />
              }
            />
            <RouterRoute
              path="/haber"
              element={<RouterNavigate to="/" replace />}
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
                  onStartPlaylist={handleStartPlaylist}
                  onNextTrack={handleNextAmbientTrack}
                  onPrevTrack={handlePrevAmbientTrack}
                  activePlaylistShelfId={activePlaylistShelfId}
                  isContinuousPlaylistMode={isContinuousPlaylistMode}
                  onToggleContinuousPlaylistMode={() => setIsContinuousPlaylistMode(prev => !prev)}
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
      </FocusProvider>
    </ThemeProvider>
  );
}
