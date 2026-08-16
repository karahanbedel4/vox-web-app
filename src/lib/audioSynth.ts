/**
 * WoodRainSynth - Web Audio API Client-Side Ambient Generator
 * Synthesizes wood-impact rain droplets, soft pink rain, night crickets/rumble, and thunder
 * with 0 MB network data transfer.
 */

export class WoodRainSynthEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;

  // Sound channels
  private channelGains: Map<string, GainNode> = new Map();
  private channelAudios: Map<string, HTMLAudioElement> = new Map();

  // Noise nodes for generative channels
  private activeGenerators: { stop: () => void }[] = [];

  constructor() {
    // Lazy initialization on user interaction & visibility handling
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspend();
        } else if (this.isRunning) {
          this.resume();
        }
      });
    }
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

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    this.initCtx();
    if (this.isRunning) return;
    this.isRunning = true;

    // Build synthesized sound generators
    this.startRainSynth();
    this.startWoodRainSynth();
    this.startNightRainSynth();
    this.startThunderSynth();
  }

  public stop() {
    this.activeGenerators.forEach(gen => gen.stop());
    this.activeGenerators = [];
    this.channelAudios.forEach(audio => {
      audio.pause();
    });
    this.isRunning = false;
  }

  public setMasterVolume(volume: number) {
    this.initCtx();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  public setWoodVolume(volume: number) {
    this.setChannelVolume('woodrain', volume);
  }

  public setRainVolume(volume: number) {
    this.setChannelVolume('rain', volume);
  }

  public setChannelVolume(channelId: string, volume: number) {
    this.initCtx();
    let gain = this.channelGains.get(channelId);
    if (!gain && this.ctx && this.masterGain) {
      gain = this.ctx.createGain();
      gain.connect(this.masterGain);
      this.channelGains.set(channelId, gain);
    }
    if (gain && this.ctx) {
      gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }

    // If custom audio channel
    const customAudio = this.channelAudios.get(channelId);
    if (customAudio) {
      customAudio.volume = Math.max(0, Math.min(1, volume));
      if (volume > 0 && customAudio.paused) {
        customAudio.play().catch(() => {});
      } else if (volume === 0 && !customAudio.paused) {
        customAudio.pause();
      }
    }
  }

  // Channel 1: Standard Rain (Pink noise + lowpass)
  private startRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Generate pink-ish noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteSource = this.ctx.createBufferSource();
    whiteSource.buffer = noiseBuffer;
    whiteSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0; // Controlled by UI slider
    this.channelGains.set('rain', channelGain);

    whiteSource.connect(filter);
    filter.connect(channelGain);
    channelGain.connect(this.masterGain);

    whiteSource.start();
    this.activeGenerators.push({
      stop: () => {
        try { whiteSource.stop(); } catch (e) {}
      }
    });
  }

  // Channel 2: WoodRainSynth (Wooden Surface Rain Drops - Resonant Bandpass Droplets)
  private startWoodRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('woodrain', channelGain);
    channelGain.connect(this.masterGain);

    let isTimerActive = true;

    const triggerDroplet = () => {
      if (!this.ctx || !isTimerActive) return;

      // Random wooden resonant frequency (400Hz - 900Hz gives hollow wood timbre)
      const freq = 450 + Math.random() * 450;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.ctx.currentTime + 0.04);

      // Fast attack, resonant wooden decay
      dropGain.gain.setValueAtTime(0, this.ctx.currentTime);
      dropGain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.2, this.ctx.currentTime + 0.003);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04 + Math.random() * 0.05);

      osc.connect(dropGain);
      dropGain.connect(channelGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);

      // Random interval between droplets (20ms - 180ms)
      const nextDelay = 20 + Math.random() * 160;
      setTimeout(triggerDroplet, nextDelay);
    };

    triggerDroplet();

    this.activeGenerators.push({
      stop: () => {
        isTimerActive = false;
      }
    });
  }

  // Channel 3: Night Rain / Crickets (High pitch subtle sibilance)
  private startNightRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const channelGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 4800;

    filter.type = 'bandpass';
    filter.frequency.value = 4800;
    filter.Q.value = 15;

    lfo.frequency.value = 18; // Cricket rhythm
    lfoGain.gain.value = 0.05;

    lfo.connect(lfoGain);
    lfoGain.connect(channelGain.gain);

    channelGain.gain.value = 0.0;
    this.channelGains.set('nightrain', channelGain);

    osc.connect(filter);
    filter.connect(channelGain);
    channelGain.connect(this.masterGain);

    osc.start();
    lfo.start();

    this.activeGenerators.push({
      stop: () => {
        try {
          osc.stop();
          lfo.stop();
        } catch (e) {}
      }
    });
  }

  // Channel 4: Thunder (Low sub rumble)
  private startThunderSynth() {
    if (!this.ctx || !this.masterGain) return;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('thunder', channelGain);
    channelGain.connect(this.masterGain);

    let isTimerActive = true;

    const triggerThunderRumble = () => {
      if (!this.ctx || !isTimerActive) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 2.5);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(channelGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.2);

      // Trigger thunder every 12 to 30 seconds
      const nextThunder = 12000 + Math.random() * 18000;
      setTimeout(triggerThunderRumble, nextThunder);
    };

    triggerThunderRumble();

    this.activeGenerators.push({
      stop: () => {
        isTimerActive = false;
      }
    });
  }

  // Add Custom MP3 / Audio Stream URL Channel
  public addCustomAudioStream(channelId: string, audioUrl: string) {
    if (this.channelAudios.has(channelId)) {
      const old = this.channelAudios.get(channelId);
      old?.pause();
    }
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    this.channelAudios.set(channelId, audio);
  }
}

export const woodRainSynth = new WoodRainSynthEngine();
