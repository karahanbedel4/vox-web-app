/**
 * Universal Dual-Engine Ambient Sound Generator
 * Direct Web Audio API synthesizer for nature & focus soundscapes
 * Completely immune to iOS WebKit iframe blocking and silent mode restrictions.
 */

class UniversalSynthAudioService {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private activeGenerators: Map<string, { stop: () => void; setVolume: (v: number) => void }> = new Map();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {
        console.warn('AudioContext init error:', e);
      }
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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

  /**
   * Play generated noise/ambient stream based on track or category
   */
  public playSynthSound(trackId: string, volumePercent: number) {
    this.unlock();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Stop if existing generator for this id
    this.stopSynthSound(trackId);

    const normId = trackId.toLowerCase();
    const masterGain = ctx.createGain();
    const targetGain = Math.max(0, Math.min(1, volumePercent / 100)) * 0.45;
    masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Create 4-second pink/brown noise buffer for natural sound synthesis
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const leftData = noiseBuffer.getChannelData(0);
    const rightData = noiseBuffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      // Brown/Pink noise filter
      lastOutL = (lastOutL + (0.02 * whiteL)) / 1.02;
      lastOutR = (lastOutR + (0.02 * whiteR)) / 1.02;

      leftData[i] = lastOutL * 3.5;
      rightData[i] = lastOutR * 3.5;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter setup depending on nature type
    const filter = ctx.createBiquadFilter();

    if (normId.includes('rain') || normId.includes('yagmur')) {
      // Rain: Lowpass around 1200Hz with subtle resonant peak
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);
    } else if (normId.includes('forest') || normId.includes('bird') || normId.includes('orman')) {
      // Forest/Breeze: Bandpass around 800Hz
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);
    } else if (normId.includes('wave') || normId.includes('ocean') || normId.includes('dalga')) {
      // Ocean Waves: Modulating lowpass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      
      // LFO for wave surging
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec wave period
      lfoGain.gain.setValueAtTime(450, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
    } else if (normId.includes('campfire') || normId.includes('fire') || normId.includes('ates')) {
      // Campfire: Warm lowpass
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);
    } else {
      // Default Warm Lo-Fi Pink Bed
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
    }

    noiseSource.connect(filter);
    filter.connect(masterGain);
    noiseSource.start();

    this.activeGenerators.set(trackId, {
      stop: () => {
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          masterGain.disconnect();
        } catch (e) {}
      },
      setVolume: (v: number) => {
        const nextVol = Math.max(0, Math.min(1, v / 100)) * 0.45;
        masterGain.gain.setTargetAtTime(nextVol, ctx.currentTime, 0.05);
      }
    });
  }

  public setSynthVolume(trackId: string, volumePercent: number) {
    const gen = this.activeGenerators.get(trackId);
    if (gen) {
      gen.setVolume(volumePercent);
    }
  }

  public stopSynthSound(trackId: string) {
    const gen = this.activeGenerators.get(trackId);
    if (gen) {
      gen.stop();
      this.activeGenerators.delete(trackId);
    }
  }

  public stopAll() {
    this.activeGenerators.forEach((gen) => {
      try { gen.stop(); } catch (e) {}
    });
    this.activeGenerators.clear();
  }
}

export const universalSynthService = new UniversalSynthAudioService();
