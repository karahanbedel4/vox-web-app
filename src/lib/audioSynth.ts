/**
 * WoodRainSynth - Web Audio API Client-Side Ambient Generator & Sound Engine
 * Synthesizes zero-latency nature sounds & ambient soundscapes directly in the browser:
 * - Rain (Doğada Yağmur)
 * - Forest & Birds (Sakin Orman & Kuş Sesleri)
 * - Ocean Waves (Okyanus & Dalga Sesleri)
 * - Wood Rain (Ahşap Üstü Yağmur Damlaları)
 * - Thunder & Storm (Şimşek ve Fırtına)
 * - Night Crickets (Gece & Ağustos Böceği)
 * - Cozy Cafe (Sakin Kafe Ambiyansı)
 * - Deep Focus Noise (Derin Odaklanma Brown/White Noise)
 *
 * 100% Client-Side Web Audio API, Zero Network Data, Works completely offline and on all mobile browsers.
 */

export class WoodRainSynthEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;

  // Sound channel gain nodes
  private channelGains: Map<string, GainNode> = new Map();
  private channelAudios: Map<string, HTMLAudioElement> = new Map();

  // Active generative nodes cleanup
  private activeGenerators: { stop: () => void }[] = [];

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Handle mobile visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspend();
        } else if (this.isRunning) {
          this.resume();
        }
      });

      // Mobile Touch/Click AudioContext Unlock
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('touchend', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
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

  public initCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public start() {
    this.initCtx();
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize all synthesized generators
    this.startRainSynth();
    this.startForestBirdsSynth();
    this.startOceanWavesSynth();
    this.startWoodRainSynth();
    this.startThunderSynth();
    this.startNightRainSynth();
    this.startCafeSynth();
    this.startBrownNoiseSynth();
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
    if (!this.isRunning && volume > 0) {
      this.start();
    }

    const normId = this.normalizeChannelId(channelId);
    let gain = this.channelGains.get(normId);

    if (!gain && this.ctx && this.masterGain) {
      gain = this.ctx.createGain();
      gain.connect(this.masterGain);
      this.channelGains.set(normId, gain);
    }

    if (gain && this.ctx) {
      gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }

    // If custom audio stream element
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

  private normalizeChannelId(id: string): string {
    const clean = id.toLowerCase().replace(/^(yt-|synth-)/, '');
    if (clean.includes('rain') || clean.includes('yagmur')) {
      if (clean.includes('wood') || clean.includes('ahsap')) return 'woodrain';
      if (clean.includes('thunder') || clean.includes('simsek')) return 'thunder';
      return 'rain';
    }
    if (clean.includes('forest') || clean.includes('orman') || clean.includes('bird')) return 'forest';
    if (clean.includes('wave') || clean.includes('ocean') || clean.includes('dalga') || clean.includes('deniz')) return 'waves';
    if (clean.includes('thunder') || clean.includes('storm') || clean.includes('firtina')) return 'thunder';
    if (clean.includes('night') || clean.includes('gece') || clean.includes('bocek')) return 'night';
    if (clean.includes('cafe') || clean.includes('kafe')) return 'cafe';
    if (clean.includes('white') || clean.includes('brown') || clean.includes('noise') || clean.includes('focus') || clean.includes('odak')) return 'whitenoise';
    return clean;
  }

  // 1. Channel: Standard Rain (Pink noise + lowpass filter + subtle droplet impacts)
  private startRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
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
    filter.frequency.value = 1150;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
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

  // 2. Channel: Forest Birds & Gentle Breeze
  private startForestBirdsSynth() {
    if (!this.ctx || !this.masterGain) return;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('forest', channelGain);
    channelGain.connect(this.masterGain);

    // Forest wind breeze
    const bufferSize = 2 * this.ctx.sampleRate;
    const breezeBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = breezeBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const breezeSource = this.ctx.createBufferSource();
    breezeSource.buffer = breezeBuffer;
    breezeSource.loop = true;

    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.value = 450;
    breezeFilter.Q.value = 2.0;

    breezeSource.connect(breezeFilter);
    breezeFilter.connect(channelGain);
    breezeSource.start();

    let isBirdTimerActive = true;

    // Generative Bird Chirps (Stochastic organic harmonic chirps)
    const triggerBirdChirp = () => {
      if (!this.ctx || !isBirdTimerActive) return;

      const baseFreq = 2600 + Math.random() * 1200;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, this.ctx.currentTime + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(channelGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      // Next chirp interval: 1.5s - 5s
      const nextDelay = 1500 + Math.random() * 3500;
      setTimeout(triggerBirdChirp, nextDelay);
    };

    triggerBirdChirp();

    this.activeGenerators.push({
      stop: () => {
        isBirdTimerActive = false;
        try { breezeSource.stop(); } catch (e) {}
      }
    });
  }

  // 3. Channel: Ocean Waves (Swell in & out)
  private startOceanWavesSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const waveBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = waveBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const waveSource = this.ctx.createBufferSource();
    waveSource.buffer = waveBuffer;
    waveSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    // LFO for periodic wave swell (every 6 seconds)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // Wave cycle
    lfoGain.gain.value = 400;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('waves', channelGain);

    waveSource.connect(filter);
    filter.connect(channelGain);
    channelGain.connect(this.masterGain);

    waveSource.start();
    lfo.start();

    this.activeGenerators.push({
      stop: () => {
        try {
          waveSource.stop();
          lfo.stop();
        } catch (e) {}
      }
    });
  }

  // 4. Channel: WoodRainSynth (Hollow resonant droplets on cedar wood)
  private startWoodRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('woodrain', channelGain);
    channelGain.connect(this.masterGain);

    let isTimerActive = true;

    const triggerDroplet = () => {
      if (!this.ctx || !isTimerActive) return;

      const freq = 450 + Math.random() * 450;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, this.ctx.currentTime + 0.04);

      dropGain.gain.setValueAtTime(0, this.ctx.currentTime);
      dropGain.gain.linearRampToValueAtTime(0.16 + Math.random() * 0.2, this.ctx.currentTime + 0.003);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04 + Math.random() * 0.05);

      osc.connect(dropGain);
      dropGain.connect(channelGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);

      const nextDelay = 25 + Math.random() * 150;
      setTimeout(triggerDroplet, nextDelay);
    };

    triggerDroplet();

    this.activeGenerators.push({
      stop: () => {
        isTimerActive = false;
      }
    });
  }

  // 5. Channel: Thunder & Storm Rumble
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
      osc.frequency.setValueAtTime(45, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(18, this.ctx.currentTime + 3.0);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, this.ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0005, this.ctx.currentTime + 3.5);

      osc.connect(gain);
      gain.connect(channelGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.6);

      const nextThunder = 10000 + Math.random() * 16000;
      setTimeout(triggerThunderRumble, nextThunder);
    };

    triggerThunderRumble();

    this.activeGenerators.push({
      stop: () => {
        isTimerActive = false;
      }
    });
  }

  // 6. Channel: Night Crickets & Serene Sibilance
  private startNightRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const channelGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 4600;

    filter.type = 'bandpass';
    filter.frequency.value = 4600;
    filter.Q.value = 14;

    lfo.frequency.value = 16;
    lfoGain.gain.value = 0.06;

    lfo.connect(lfoGain);
    lfoGain.connect(channelGain.gain);

    channelGain.gain.value = 0.0;
    this.channelGains.set('night', channelGain);

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

  // 7. Channel: Cozy Cafe Background Murmur
  private startCafeSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const cafeBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = cafeBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const cafeSource = this.ctx.createBufferSource();
    cafeSource.buffer = cafeBuffer;
    cafeSource.loop = true;

    const cafeFilter = this.ctx.createBiquadFilter();
    cafeFilter.type = 'bandpass';
    cafeFilter.frequency.value = 650;
    cafeFilter.Q.value = 1.2;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('cafe', channelGain);

    cafeSource.connect(cafeFilter);
    cafeFilter.connect(channelGain);
    channelGain.connect(this.masterGain);

    cafeSource.start();
    this.activeGenerators.push({
      stop: () => {
        try { cafeSource.stop(); } catch (e) {}
      }
    });
  }

  // 8. Channel: Deep Focus Brownian Noise
  private startBrownNoiseSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const brownBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = brownBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const brownSource = this.ctx.createBufferSource();
    brownSource.buffer = brownBuffer;
    brownSource.loop = true;

    const channelGain = this.ctx.createGain();
    channelGain.gain.value = 0.0;
    this.channelGains.set('whitenoise', channelGain);

    brownSource.connect(channelGain);
    channelGain.connect(this.masterGain);

    brownSource.start();
    this.activeGenerators.push({
      stop: () => {
        try { brownSource.stop(); } catch (e) {}
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

