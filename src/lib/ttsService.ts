import { Article } from '../types';
import { appStorage } from './storage';
import { recordListeningTime } from './streakService';
import { getApiUrl } from './api';

export interface ChunkMeta {
  index: number;
  text: string;
  wordCount: number;
  startWordIndex: number;
  startTime: number;
  endTime: number;
}

export interface ResumePosition {
  articleId: string;
  articleTitle?: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  languageMode?: 'tr' | 'en';
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentWordIndex: number;
  currentArticle: Article | null;
  chunkMetas: ChunkMeta[];
  currentChunkIndex: number;
  languageMode: 'tr' | 'en';
  isMiniPlayerDismissed?: boolean;
}

type PlaybackListener = (state: PlaybackState) => void;

export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private preloadedAudioMap: Map<string, HTMLAudioElement> = new Map();
  private article: Article | null = null;
  
  private isPlaying: boolean = false;
  private playbackRate: number = 1.25;
  private currentTime: number = 0;
  private duration: number = 0;
  private currentWordIndex: number = 0;
  
  private words: string[] = [];
  private chunkMetas: ChunkMeta[] = [];
  private currentChunkIndex: number = 0;
  private languageMode: 'tr' | 'en' = 'tr';
  private userId: string | null = null;
  private timerId: number | null = null;
  private volume: number = 1.0;
  private isMiniPlayerDismissed: boolean = false;
  private listeners: Set<PlaybackListener> = new Set();

  public setUserId(uid: string | null) {
    this.userId = uid;
  }

  private preloadChunkAudio(chunkIndex: number) {
    if (!this.article || chunkIndex < 0 || chunkIndex >= this.chunkMetas.length) return;
    const chunk = this.chunkMetas[chunkIndex];
    if (!chunk || !chunk.text) return;

    const targetLang = this.detectLanguage(chunk.text || (this.article.title + ' ' + this.article.summary));
    const langParam = targetLang === 'en-US' ? 'en' : 'tr';
    const url = getApiUrl(`/api/tts?text=${encodeURIComponent(chunk.text)}&lang=${langParam}`);

    if (!this.preloadedAudioMap.has(url)) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.preloadedAudioMap.set(url, audio);
    }
  }

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.synth?.getVoices();
        };
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.isPlaying) {
            this.pause();
          } else {
            this.savePlaybackPosition();
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.savePlaybackPosition();
      });
    }
  }

  public savePlaybackPosition() {
    if (this.article && this.currentTime > 3 && this.duration > 0 && (this.duration - this.currentTime) > 5) {
      const data: ResumePosition = {
        articleId: this.article.id,
        articleTitle: this.article.title,
        currentTime: Math.floor(this.currentTime),
        duration: Math.floor(this.duration),
        updatedAt: Date.now(),
        languageMode: this.languageMode
      };
      appStorage.setItem('vox_resume_position', JSON.stringify(data));
    } else if (this.article && (this.duration - this.currentTime) <= 5) {
      this.clearSavedPosition();
    }
  }

  public clearSavedPosition() {
    appStorage.removeItem('vox_resume_position');
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      playbackRate: this.playbackRate,
      currentWordIndex: this.currentWordIndex,
      currentArticle: this.article,
      chunkMetas: this.chunkMetas,
      currentChunkIndex: this.currentChunkIndex,
      languageMode: this.languageMode,
      isMiniPlayerDismissed: this.isMiniPlayerDismissed
    };
  }

  public setLanguageMode(langMode: 'tr' | 'en') {
    if (this.languageMode === langMode && this.article) return;
    this.languageMode = langMode;
    if (this.article) {
      const wasPlaying = this.isPlaying;
      const currentPosRatio = this.duration > 0 ? this.currentTime / this.duration : 0;
      this.loadArticle(this.article, langMode);
      if (currentPosRatio > 0 && this.duration > 0) {
        this.seek(currentPosRatio * this.duration);
      }
      if (wasPlaying) {
        this.play();
      }
    }
  }

  private detectLanguage(text: string): 'tr-TR' | 'en-US' {
    if (this.languageMode === 'en') return 'en-US';
    if (this.languageMode === 'tr') return 'tr-TR';
    if (!text) return 'tr-TR';
    if (/[çğışöüÇĞİŞÖÜ]/.test(text)) return 'tr-TR';

    const trWords = ['ve', 'bir', 'bu', 'da', 'de', 'için', 'ile', 'gibi', 'ama', 'çok', 'ne', 'en', 'o', 'daha', 'bülten', 'haber', 'özet', 'yeni', 'göre', 'sonra', 'olarak', 'olan', 'var', 'yok', 'ki', 'her', 'tüm', 'veya', 'kadar'];
    const enWords = ['the', 'and', 'is', 'in', 'to', 'of', 'that', 'you', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'from', 'or', 'by', 'an', 'not', 'we', 'can', 'has', 'about'];

    const words = text.toLowerCase().split(/\s+/);
    let trCount = 0;
    let enCount = 0;

    for (const w of words) {
      const clean = w.replace(/[^a-zçğışöü]/g, '');
      if (trWords.includes(clean)) trCount++;
      if (enWords.includes(clean)) enCount++;
    }

    if (enCount > trCount && enCount >= 2) return 'en-US';
    return 'tr-TR';
  }

  private getBestVoiceForLang(langCode: 'tr-TR' | 'en-US'): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    const isTr = langCode === 'tr-TR';

    if (isTr) {
      const siriOrNatural = voices.find(v => 
        v.lang.toLowerCase().startsWith('tr') && 
        (v.name.includes('Siri') || v.name.includes('Yelda') || v.name.includes('Cem') || v.name.includes('Enhanced') || v.name.includes('Natural'))
      );
      if (siriOrNatural) return siriOrNatural;

      const googleVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith('tr') && 
        (v.name.includes('Google') || v.name.includes('Türkçe') || v.name.includes('Turkish'))
      );
      if (googleVoice) return googleVoice;

      const anyTrVoice = voices.find(v => v.lang.toLowerCase().startsWith('tr') || v.lang.toLowerCase().includes('tr'));
      if (anyTrVoice) return anyTrVoice;

      return null;
    } else {
      const premiumEn = voices.find(v => 
        v.lang.toLowerCase().startsWith('en') && 
        (v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Enhanced') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google'))
      );
      if (premiumEn) return premiumEn;

      const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;

      return null;
    }
  }

  public loadArticle(article: Article, langMode: 'tr' | 'en' = this.languageMode) {
    this.stop();
    this.article = article;
    this.languageMode = langMode;
    this.isMiniPlayerDismissed = false;
    this.preloadedAudioMap.clear();

    const useEnglish = langMode === 'en' && Boolean(article.englishContent || article.englishTitle);
    const title = useEnglish ? (article.englishTitle || article.title) : article.title;
    const summary = useEnglish ? (article.englishSummary || article.summary) : article.summary;
    const content = useEnglish ? (article.englishContent || article.content) : article.content;

    const rawTextToSpeak = `${title}. ${summary}. ${content}`;
    const cleanTextToSpeak = rawTextToSpeak
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\([^\)]*\)/g, '')
      .replace(/[#*_~`]+/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    this.words = cleanTextToSpeak.split(/\s+/).filter(w => w.length > 0);

    const protectedText = cleanTextToSpeak
      .replace(/\b(Dr|Prof|Doç|Yrd|Av|Uz|St|Mr|Mrs|Ms|Inc|Ltd|vs|vb|bkz|ör|örneğin|sf|cad|sok|apt|Hz)\./gi, "$1__DOT__")
      .replace(/\b(\d+)\.(\d+)\b/g, "$1__DECIMAL__$2");

    const candidateSentences = protectedText
      .replace(/([.?!;:])\s+/g, "$1|")
      .split("|")
      .map(s => s.replace(/__DOT__/g, '.').replace(/__DECIMAL__/g, '.').trim())
      .filter(s => s.length > 0);

    const rawSentences: string[] = [];
    for (let i = 0; i < candidateSentences.length; i++) {
      let current = candidateSentences[i];
      let wordCount = current.split(/\s+/).filter(w => w.length > 0).length;

      while (i < candidateSentences.length - 1 && (current.length < 30 || wordCount < 5)) {
        i++;
        current = current + ' ' + candidateSentences[i];
        wordCount = current.split(/\s+/).filter(w => w.length > 0).length;
      }
      rawSentences.push(current);
    }

    const totalWords = this.words.length || 1;
    this.duration = article.durationSeconds || Math.max(60, Math.round(totalWords * 0.45));
    
    let accWords = 0;
    this.chunkMetas = rawSentences.map((text, idx) => {
      const wCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const startWordIndex = accWords;
      const startTime = (accWords / totalWords) * this.duration;
      const endTime = Math.min(this.duration, ((accWords + wCount) / totalWords) * this.duration);
      accWords += wCount;

      return {
        index: idx,
        text,
        wordCount: wCount,
        startWordIndex,
        startTime,
        endTime
      };
    });

    this.currentTime = 0;
    this.currentWordIndex = 0;
    this.currentChunkIndex = 0;
    this.isPlaying = false;
    this.notify();

    this.preloadChunkAudio(0);
    this.preloadChunkAudio(1);

    if (this.synth) {
      this.synth.getVoices();
    }

    this.setupMediaSession(article);
  }

  public play() {
    if (!this.article) return;
    this.isMiniPlayerDismissed = false;

    if (this.audioElement && this.audioElement.paused && this.audioElement.src) {
      this.audioElement.play().then(() => {
        this.isPlaying = true;
        this.startTimer();
        this.notify();
      }).catch(() => {
        this.playNativeSentenceSpeech();
      });
      return;
    }

    if (this.synth) {
      this.synth.cancel();
      this.playNativeSentenceSpeech();
    } else {
      this.playChunkAudio();
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  private playNativeSentenceSpeech() {
    if (!this.synth || !this.article || this.chunkMetas.length === 0) {
      this.playChunkAudio();
      return;
    }

    this.synth.cancel();

    if (this.currentChunkIndex < 0 || this.currentChunkIndex >= this.chunkMetas.length) {
      this.currentChunkIndex = 0;
    }

    const currentChunk = this.chunkMetas[this.currentChunkIndex];
    const targetLang = this.detectLanguage(currentChunk.text || (this.article.title + ' ' + this.article.summary));
    const bestVoice = this.getBestVoiceForLang(targetLang);

    if (targetLang === 'tr-TR' && !bestVoice) {
      this.playChunkAudio();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentChunk.text);
    utterance.lang = targetLang;

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    const baseRate = 1.08;
    utterance.rate = Math.min(2.0, Math.max(0.5, this.playbackRate * baseRate));
    utterance.pitch = 1.0;

    this.currentTime = Math.max(this.currentTime, currentChunk.startTime);
    this.currentWordIndex = currentChunk.startWordIndex;

    let timerStarted = false;
    const triggerSpeechStart = () => {
      if (timerStarted) return;
      timerStarted = true;
      this.isPlaying = true;
      this.startTimer();
      this.notify();
    };

    utterance.onstart = () => {
      triggerSpeechStart();
    };

    utterance.onboundary = (e) => {
      triggerSpeechStart();
      if (e.name === 'word') {
        const textPassed = currentChunk.text.substring(0, e.charIndex);
        const wordsPassed = textPassed.split(/\s+/).filter(w => w.length > 0).length;
        this.currentWordIndex = Math.min(this.words.length - 1, currentChunk.startWordIndex + wordsPassed);
        this.notify();
      }
    };

    utterance.onend = () => {
      if (!this.isPlaying) return;
      this.currentChunkIndex++;
      if (this.currentChunkIndex < this.chunkMetas.length) {
        this.playNativeSentenceSpeech();
      } else {
        this.isPlaying = false;
        this.currentTime = this.duration;
        this.clearTimer();
        this.notify();
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('Native WebSpeech sentence error:', e);
      if (this.isPlaying) {
        this.playChunkAudio();
      }
    };

    this.currentUtterance = utterance;
    this.isPlaying = true;
    this.notify();

    try {
      this.synth.speak(utterance);
      setTimeout(() => triggerSpeechStart(), 250);
    } catch (err) {
      console.error('SpeechSynthesis speak failed:', err);
      this.playChunkAudio();
    }
  }

  private playChunkAudio() {
    if (!this.article || this.chunkMetas.length === 0) return;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    if (this.currentChunkIndex >= this.chunkMetas.length) {
      this.currentChunkIndex = 0;
    }

    const currentChunk = this.chunkMetas[this.currentChunkIndex];
    const targetLang = this.detectLanguage(currentChunk.text || (this.article.title + ' ' + this.article.summary));
    const langParam = targetLang === 'en-US' ? 'en' : 'tr';
    const audioUrl = getApiUrl(`/api/tts?text=${encodeURIComponent(currentChunk.text)}&lang=${langParam}`);

    let audio = this.preloadedAudioMap.get(audioUrl);
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.preload = 'auto';
    }
    audio.playbackRate = this.playbackRate;

    let timerStarted = false;
    const triggerAudioStart = () => {
      if (timerStarted) return;
      timerStarted = true;
      this.isPlaying = true;
      this.startTimer();
      this.notify();
      this.preloadChunkAudio(this.currentChunkIndex + 1);
    };

    audio.onplaying = triggerAudioStart;
    audio.onplay = triggerAudioStart;

    audio.onended = () => {
      this.currentChunkIndex++;
      if (this.currentChunkIndex < this.chunkMetas.length) {
        this.playChunkAudio();
      } else {
        this.isPlaying = false;
        this.currentTime = this.duration;
        this.clearTimer();
        this.notify();
      }
    };

    audio.onerror = (err) => {
      console.warn('Audio chunk stream unavailable or blocked, falling back to Web Speech API:', err);
      if (this.synth && this.isPlaying) {
        this.playNativeSentenceSpeech();
      } else {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.chunkMetas.length && this.isPlaying) {
          this.playChunkAudio();
        } else {
          this.isPlaying = false;
          this.clearTimer();
          this.notify();
        }
      }
    };

    this.audioElement = audio;
    audio.play().then(() => {
      triggerAudioStart();
    }).catch((e) => {
      console.warn('Audio play prevented:', e);
      triggerAudioStart();
    });
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.clearTimer();
    this.savePlaybackPosition();
    this.notify();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.clearTimer();
    this.savePlaybackPosition();
    this.currentTime = 0;
    this.currentWordIndex = 0;
    this.currentChunkIndex = 0;
    this.notify();
  }

  public closePlayer() {
    this.pause();
    this.isMiniPlayerDismissed = true;
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public seek(seconds: number) {
    if (!this.article) return;
    const targetTime = Math.max(0, Math.min(this.duration, seconds));
    this.currentTime = targetTime;
    this.savePlaybackPosition();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }

    if (this.chunkMetas.length > 0) {
      let targetIndex = 0;
      for (let i = 0; i < this.chunkMetas.length; i++) {
        if (targetTime >= this.chunkMetas[i].startTime) {
          targetIndex = i;
        }
      }
      this.currentChunkIndex = targetIndex;
      this.currentWordIndex = this.chunkMetas[targetIndex].startWordIndex;
    }

    if (this.isPlaying) {
      if (this.synth) {
        this.playNativeSentenceSpeech();
      } else {
        this.playChunkAudio();
      }
    } else {
      this.notify();
    }
  }

  public setRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    if (this.isPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  private startTimer() {
    this.clearTimer();
    this.timerId = window.setInterval(() => {
      if (!this.isPlaying) return;

      const currentChunk = this.chunkMetas[this.currentChunkIndex];
      const maxAllowedTime = currentChunk ? currentChunk.endTime - 0.1 : this.duration;

      this.currentTime = Math.min(maxAllowedTime, this.currentTime + 1 * this.playbackRate);

      if (this.words.length > 0) {
        const progress = Math.min(1, this.currentTime / Math.max(1, this.duration));
        this.currentWordIndex = Math.floor(progress * (this.words.length - 1));
      }

      try {
        recordListeningTime(this.userId || '', 1).catch(() => {});
      } catch (e) {
        console.error('Error saving listening stats:', e);
      }

      if (Math.floor(this.currentTime) % 3 === 0) {
        this.savePlaybackPosition();
      }

      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.pause();
      } else {
        this.notify();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private setupMediaSession(article: Article) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      const useEnglish = this.languageMode === 'en' && Boolean(article.englishContent || article.englishTitle);
      const displayTitle = useEnglish ? (article.englishTitle || article.title) : article.title;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: displayTitle,
        artist: article.author || 'VOX AI Studio Podcast',
        album: 'VOX Sesli Haber Bültenleri',
        artwork: [
          { src: article.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('seekbackward', () => this.seek(this.currentTime - 10));
        navigator.mediaSession.setActionHandler('seekforward', () => this.seek(this.currentTime + 10));
        navigator.mediaSession.setActionHandler('previoustrack', () => this.seek(this.currentTime - 15));
        navigator.mediaSession.setActionHandler('nexttrack', () => this.seek(this.currentTime + 15));
      } catch {
        // Safe catch
      }
    }
  }
}

export const ttsService = new TTSService();
