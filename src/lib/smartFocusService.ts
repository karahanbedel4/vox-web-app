import { appStorage } from './storage';
import { AmbientChannel } from '../components/AmbientMixerSheet';
import { triggerHapticImpact } from './haptics';
import { woodRainSynth } from './audioSynth';
import { universalSynthService } from './universalSynthService';

export interface SmartFocusPreset {
  id: string;
  name: string;
  subtitle: string;
  categoryTitle: string;
  icon: string;
  type: 'stream' | 'youtube' | 'synth';
  url?: string;
  youtubeId?: string;
  description: string;
}

export const SMART_FOCUS_PRESETS: SmartFocusPreset[] = [
  {
    id: 'stream-nature-rain',
    name: 'Sakin Yaz Yağmuru',
    subtitle: 'Doğal Yağmur & Gök Gürültüsü',
    categoryTitle: 'Doğa & Ambiyans',
    icon: '🌧️',
    type: 'stream',
    url: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    description: 'Zihni yatıştıran ve okuma odaklanmasını artıran doğal yağmur damlaları.'
  },
  {
    id: 'stream-forest-birds',
    name: 'Huzurlu Orman & Kuşlar',
    subtitle: 'Kuş Cıvıltıları & Çam Esintisi',
    categoryTitle: 'Doğa & Ambiyans',
    icon: '🌲',
    type: 'stream',
    url: 'https://assets.mixkit.co/active_storage/sfx/1250/1250-preview.mp3',
    description: 'Doğanın kalbinde, hafif çam rüzgarı ve sakin kuş sesleri.'
  },
  {
    id: 'stream-campfire-night',
    name: 'Gece & Sıcak Şömine Ateşi',
    subtitle: 'Çıtırdayan Odunlar & Gece Ambiyansı',
    categoryTitle: 'Doğa & Ambiyans',
    icon: '🔥',
    type: 'stream',
    url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
    description: 'Sıcak bir odada kitap ve haber okuma hissi veren çıtırdayan odun sesleri.'
  },
  {
    id: 'stream-ocean-waves',
    name: 'Okyanus & Derin Dalgalar',
    subtitle: 'Kıyıya Vuran Sakin Dalgalar',
    categoryTitle: 'Doğa & Ambiyans',
    icon: '🌊',
    type: 'stream',
    url: 'https://assets.mixkit.co/active_storage/sfx/1249/1249-preview.mp3',
    description: 'Ritmik ve derin nefes almaya teşvik eden yumuşak okyanus dalgaları.'
  },
  {
    id: 'stream-cozy-cafe',
    name: 'Sakin Kahve Dükkanı',
    subtitle: 'Kafe Fısıltıları & Sıcak Kahve Havası',
    categoryTitle: 'Doğa & Ambiyans',
    icon: '☕',
    type: 'stream',
    url: 'https://assets.mixkit.co/active_storage/sfx/2514/2514-preview.mp3',
    description: 'Arka planda kahve kokusu hissettiren rahatlatıcı kafe ortamı.'
  },
  {
    id: 'lofi-study-synth',
    name: 'Lo-Fi Derin Odak Beat',
    subtitle: 'Sözsüz Konsantrasyon Ritimleri',
    categoryTitle: 'Lo-Fi Müzik',
    icon: '🎧',
    type: 'synth',
    description: 'Dikkati dağıtmayan, zihni akış durumuna geçiren sözsüz ritimler.'
  },
  {
    id: 'interstellar',
    name: 'Hans Zimmer - Interstellar',
    subtitle: 'Cornfield Chase / Sinematik Odak',
    categoryTitle: 'Film Müzikleri',
    icon: '🎹',
    type: 'youtube',
    youtubeId: 'UDVtMYqUAyw',
    description: 'Efsanevi bilimkurgu eseriyle derin düşünme ve üst düzey odak.'
  }
];

export const SMART_FOCUS_STORAGE_KEYS = {
  ENABLED: 'vox_smart_focus_enabled',
  SOUNDSCAPE_ID: 'vox_smart_focus_soundscape_id',
  VOLUME: 'vox_smart_focus_volume',
  NOTIFICATIONS: 'vox_smart_focus_notifications'
} as const;

export interface SmartFocusSettings {
  enabled: boolean;
  soundscapeId: string;
  volume: number;
  showToast: boolean;
}

/**
 * Get current Smart Focus configuration from storage
 */
export function getSmartFocusSettings(): SmartFocusSettings {
  try {
    const rawEnabled = appStorage.getItemSync(SMART_FOCUS_STORAGE_KEYS.ENABLED);
    // Default to enabled (true) so the user experiences the smart ambient auto-start right away,
    // but can easily toggle it off in the settings
    const enabled = rawEnabled !== null ? rawEnabled === 'true' : true;
    
    const soundscapeId = appStorage.getItemSync(SMART_FOCUS_STORAGE_KEYS.SOUNDSCAPE_ID) || 'stream-nature-rain';
    
    const rawVolume = appStorage.getItemSync(SMART_FOCUS_STORAGE_KEYS.VOLUME);
    const volume = rawVolume ? Math.min(100, Math.max(10, parseInt(rawVolume, 10) || 50)) : 50;

    const rawToast = appStorage.getItemSync(SMART_FOCUS_STORAGE_KEYS.NOTIFICATIONS);
    const showToast = rawToast !== null ? rawToast === 'true' : true;

    return { enabled, soundscapeId, volume, showToast };
  } catch (e) {
    return {
      enabled: true,
      soundscapeId: 'stream-nature-rain',
      volume: 50,
      showToast: true
    };
  }
}

/**
 * Save Smart Focus configuration and dispatch change event
 */
export function saveSmartFocusSettings(settings: Partial<SmartFocusSettings>) {
  try {
    if (settings.enabled !== undefined) {
      appStorage.setItemSync(SMART_FOCUS_STORAGE_KEYS.ENABLED, String(settings.enabled));
    }
    if (settings.soundscapeId !== undefined) {
      appStorage.setItemSync(SMART_FOCUS_STORAGE_KEYS.SOUNDSCAPE_ID, settings.soundscapeId);
    }
    if (settings.volume !== undefined) {
      appStorage.setItemSync(SMART_FOCUS_STORAGE_KEYS.VOLUME, String(settings.volume));
    }
    if (settings.showToast !== undefined) {
      appStorage.setItemSync(SMART_FOCUS_STORAGE_KEYS.NOTIFICATIONS, String(settings.showToast));
    }

    window.dispatchEvent(new CustomEvent('vox_smart_focus_settings_changed', {
      detail: getSmartFocusSettings()
    }));
  } catch (e) {
    console.warn('Smart focus settings save notice:', e);
  }
}

/**
 * Helper to get preset object by ID
 */
export function getSmartFocusPreset(id: string): SmartFocusPreset {
  return SMART_FOCUS_PRESETS.find(p => p.id === id) || SMART_FOCUS_PRESETS[0];
}

/**
 * Converts a SmartFocusPreset to an AmbientChannel object
 */
export function presetToAmbientChannel(preset: SmartFocusPreset, volume: number = 50): AmbientChannel {
  return {
    id: preset.id,
    name: preset.name,
    type: preset.type,
    url: preset.url || (preset.youtubeId ? `https://www.youtube.com/watch?v=${preset.youtubeId}` : undefined),
    youtubeId: preset.youtubeId,
    volume,
    active: true,
    category: preset.type === 'synth' ? 'lofi' : (preset.type === 'youtube' ? 'movies' : 'nature')
  };
}

// Track last activated article to prevent duplicate consecutive triggers
let lastInitiatedArticleId: string | null = null;
let lastInitiatedTime: number = 0;

/**
 * Dispatches an event to trigger the Smart Focus ambient soundscape
 * when an article is opened to read or listen.
 */
export function triggerSmartFocusAutoStart(
  action: 'read' | 'listen',
  article: { id?: string; title?: string } | null | undefined
): boolean {
  if (!article || !article.id) return false;

  const settings = getSmartFocusSettings();
  if (!settings.enabled) {
    return false;
  }

  // Prevent spamming triggers for the exact same article within 10 seconds
  const now = Date.now();
  if (lastInitiatedArticleId === article.id && (now - lastInitiatedTime) < 10000) {
    return false;
  }

  lastInitiatedArticleId = article.id;
  lastInitiatedTime = now;

  // Unlock audio contexts immediately on user gesture
  try {
    woodRainSynth.unlockAudioContext();
    universalSynthService.unlock();
  } catch (e) {}

  const preset = getSmartFocusPreset(settings.soundscapeId);

  // Dispatch custom event caught by PersistentLayout / App
  window.dispatchEvent(new CustomEvent('vox_smart_focus_trigger', {
    detail: {
      action,
      articleId: article.id,
      articleTitle: article.title || 'Haber',
      preset,
      volume: settings.volume,
      showToast: settings.showToast
    }
  }));

  return true;
}
