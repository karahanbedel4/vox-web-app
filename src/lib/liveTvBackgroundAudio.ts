/**
 * VOX Canlı TV - Arka Plan Ses ve Medya Oturumu Yöneticisi (MediaSession & Background Audio Keep-Alive)
 * 
 * iOS Safari ve Android Chrome tarayıcılarında kullanıcı tarayıcıyı alta aldığında, ekranı kilitlediğinde
 * veya başka bir uygulamaya geçtiğinde canlı TV sesinin arka planda kesintisiz devam edebilmesini sağlar.
 * Ayrıca kilit ekranı ve bildirim çubuğunda kanal adını ve duraklat/oynat kontrollerini gösterir.
 */

export interface ActiveLiveTvSession {
  channelId: string;
  channelName: string;
  category: string;
  brandColor?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

class LiveTvBackgroundAudioManager {
  private keepAliveAudio: HTMLAudioElement | null = null;
  private currentSession: ActiveLiveTvSession | null = null;
  private isAudioRunning: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initKeepAliveAudio();
      this.bindVisibilityListener();
    }
  }

  /**
   * Sessiz ama geçerli bir WAV ses döngüsü (1 saniyelik PCM sessizlik).
   * Mobil tarayıcılar (iOS Safari & Android Chrome) arka plan ses iş parçacığını
   * canlı tutabilmek için geçerli bir HTML5 Audio kaynağına ihtiyaç duyar.
   */
  private initKeepAliveAudio() {
    try {
      // 1-second silent WAV encoded as base64
      const silentWavBase64 = 
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.keepAliveAudio = new Audio(silentWavBase64);
      this.keepAliveAudio.loop = true;
      this.keepAliveAudio.volume = 0.05; // low volume so it doesn't clip with TV sound
      this.keepAliveAudio.setAttribute('playsinline', 'true');
      this.keepAliveAudio.setAttribute('webkit-playsinline', 'true');
    } catch (e) {
      console.warn('[LiveTvBackgroundAudio] Failed to initialize keep-alive audio:', e);
    }
  }

  /**
   * Tarayıcı görünürlük (visibility) olaylarını dinler
   */
  private bindVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Kullanıcı tarayıcıya geri döndüğünde
        if (this.currentSession && this.isAudioRunning) {
          // İlgili oturumun sesinin devam ettiğini teyit et ve iframe'i uyar
          if (this.currentSession.onPlay) {
            try {
              this.currentSession.onPlay();
            } catch (err) {
              console.warn('[LiveTvBackgroundAudio] onPlay hook error on visibility resume:', err);
            }
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // Kullanıcı tarayıcıyı alta aldığında (arka plan)
        if (this.currentSession && this.isAudioRunning) {
          // Sesin arka planda devam etmesi için keepAliveAudio'yu canlı tut
          if (this.keepAliveAudio && this.keepAliveAudio.paused) {
            this.keepAliveAudio.play().catch(() => {});
          }
        }
      }
    });
  }

  /**
   * Bir kanalın sesi açıldığında arka plan oturumunu ve MediaSession'ı başlatır
   */
  public startSession(session: ActiveLiveTvSession) {
    this.currentSession = session;
    this.isAudioRunning = true;

    // 1. Keep-alive sesini başlat
    if (this.keepAliveAudio) {
      this.keepAliveAudio.play().catch(() => {
        // Kullanıcı etkileşimi olmadan tarayıcı otomatik oynatmayı engelleyebilir
      });
    }

    // 2. MediaSession API (Kilit Ekranı ve Bildirim Çubuğu Kontrolleri)
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const metadataInit: MediaMetadataInit = {
          title: `${session.channelName} (Canlı Yayın)`,
          artist: 'VOX Canlı TV',
          album: `${session.category} • Kesintisiz Canlı Yayın`,
          artwork: [
            {
              src: 'https://voxozet.com/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://voxozet.com/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        };

        navigator.mediaSession.metadata = new MediaMetadata(metadataInit);
        navigator.mediaSession.playbackState = 'playing';

        // Kontroller: Duraklat
        navigator.mediaSession.setActionHandler('pause', () => {
          if (this.currentSession?.onPause) {
            this.currentSession.onPause();
          }
          this.pauseKeepAlive();
        });

        // Kontroller: Oynat
        navigator.mediaSession.setActionHandler('play', () => {
          if (this.currentSession?.onPlay) {
            this.currentSession.onPlay();
          }
          this.resumeKeepAlive();
        });

        // Kontroller: Durdur
        navigator.mediaSession.setActionHandler('stop', () => {
          if (this.currentSession?.onPause) {
            this.currentSession.onPause();
          }
          this.stopSession();
        });
      } catch (e) {
        console.warn('[LiveTvBackgroundAudio] MediaSession setup error:', e);
      }
    }
  }

  /**
   * Ses kapatıldığında oturumu sonlandırır
   */
  public stopSession() {
    this.isAudioRunning = false;
    this.currentSession = null;

    if (this.keepAliveAudio) {
      try {
        this.keepAliveAudio.pause();
        this.keepAliveAudio.currentTime = 0;
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
      } catch (e) {}
    }
  }

  public pauseKeepAlive() {
    if (this.keepAliveAudio) {
      try {
        this.keepAliveAudio.pause();
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  public resumeKeepAlive() {
    if (this.keepAliveAudio) {
      this.keepAliveAudio.play().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  public getCurrentSession(): ActiveLiveTvSession | null {
    return this.currentSession;
  }
}

export const liveTvBackgroundAudio = new LiveTvBackgroundAudioManager();
