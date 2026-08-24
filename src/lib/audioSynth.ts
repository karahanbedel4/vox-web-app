/**
 * Ambient Audio Helper - Clean Web Audio API bridge with zero synthetic ringing
 * Optimized for iOS Safari, WebKit, and Android mobile browsers
 */

export class WoodRainSynthEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private isUnlocked: boolean = false;
  private channelAudios: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.unlockAudioContext();
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: false });
      window.addEventListener('touchend', unlockAudio, { passive: true, once: false });
      window.addEventListener('click', unlockAudio, { passive: true, once: false });
      window.addEventListener('keydown', unlockAudio, { passive: true, once: false });
    }
  }

  public unlockAudioContext() {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.initCtx();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // iOS Safari Silent Buffer Activation to bless audio session
        if (!this.isUnlocked) {
          try {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            this.isUnlocked = true;
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  public suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {}
    }
    return this.ctx;
  }

  public start() {
    this.unlockAudioContext();
    this.isRunning = true;
  }

  public stop() {
    this.channelAudios.forEach(audio => {
      try { audio.pause(); } catch (e) {}
    });
    this.isRunning = false;
  }

  public setMasterVolume(_volume: number) {
    // No-op
  }

  public setWoodVolume(_volume: number) {
    // No-op
  }

  public setRainVolume(_volume: number) {
    // No-op
  }

  public setChannelVolume(channelId: string, volume: number) {
    const customAudio = this.channelAudios.get(channelId);
    if (customAudio) {
      customAudio.volume = Math.max(0, Math.min(1, volume / 100));
      if (volume > 0 && customAudio.paused) {
        this.unlockAudioContext();
        customAudio.play().catch(() => {});
      } else if (volume === 0 && !customAudio.paused) {
        customAudio.pause();
      }
    }
  }

  public addCustomAudioStream(channelId: string, audioUrl: string) {
    if (this.channelAudios.has(channelId)) {
      const old = this.channelAudios.get(channelId);
      old?.pause();
    }
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    this.channelAudios.set(channelId, audio);
  }
}

export const woodRainSynth = new WoodRainSynthEngine();


