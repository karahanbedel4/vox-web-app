import { CloudRain, Music, Film, Tv, Sparkles, LucideIcon, Radio } from 'lucide-react';
import { AmbientChannel } from '../components/AmbientMixerSheet';

export interface SoundTrack {
  id: string;
  name: string;
  subtitle: string;
  category: 'nature' | 'lofi' | 'movies' | 'series';
  categoryTitle: string;
  youtubeId?: string;
  audioUrl?: string; // Direct HTML5 MP3 stream for iOS WebKit & Safari compatibility
  type?: 'stream' | 'youtube' | 'synth';
  coverImage?: string;
  durationSeconds?: number;
  featured?: boolean;
}

export interface SoundShelf {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'CloudRain' | 'Music' | 'Film' | 'Tv' | 'Sparkles' | 'Radio';
  tracks: SoundTrack[];
}

export function getShelfIcon(iconName: string): LucideIcon {
  switch (iconName) {
    case 'CloudRain':
      return CloudRain;
    case 'Music':
      return Music;
    case 'Film':
      return Film;
    case 'Tv':
      return Tv;
    case 'Radio':
      return Radio;
    default:
      return Sparkles;
  }
}

// 🌿 1. DOĞA & AMBİYANS (EN ÜSTTE - DİREKT MP3 SES AKIŞLARI)
export const NATURE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'stream-nature-rain',
    name: 'Sakin Yaz Yağmuru',
    subtitle: 'Doğal Yağmur Damlaları & Gök Gürültüsü',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-forest-birds',
    name: 'Huzurlu Orman & Kuşlar',
    subtitle: 'Kuş Cıvıltıları & Çam Ağacı Esintisi',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1250/1250-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-ocean-waves',
    name: 'Okyanus & Derin Dalgalar',
    subtitle: 'Kıyıya Vuran Sakin Dalga Sesleri',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1249/1249-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-campfire-night',
    name: 'Gece & Sıcak Şömine Ateşi',
    subtitle: 'Çıtırdayan Odunlar & Gece Ambiyansı',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-cozy-cafe',
    name: 'Sakin Kahve Dükkanı',
    subtitle: 'Arka Plan Kafe Fısıltıları & Sıcak Kahve Havası',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/386/386-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180
  },
  {
    id: 'stream-thunderstorm',
    name: 'Gece Fırtınası & Gök Gürültüsü',
    subtitle: 'Şiddetli Yağmur & Uzak Şimşekler',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180
  }
];

// ☕ 2. LO-FI & DERİN ODAKLANMA (İKİNCİ SIRADA - DİREKT MP3 SES AKIŞLARI)
export const LOFI_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'stream-lofi-chill',
    name: 'Chill Coffee Study Beats',
    subtitle: 'Lo-Fi Odak • Yumuşak Piyano Ritimleri',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-chill-bro-494.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 160,
    featured: true
  },
  {
    id: 'stream-deep-work',
    name: 'Derin Konsantrasyon & Flow',
    subtitle: 'Binaural Ambient • Zihin Açıcı Ritimler',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-silent-descent-614.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1507842229452-772d1c86e246?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-lofi-rain',
    name: 'Gece Yağmuru & Lo-Fi Gitar',
    subtitle: 'Sakin Akorlar & Yumuşak Baslar',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 175,
    featured: true
  },
  {
    id: 'stream-lofi-midnight',
    name: 'Midnight Coding Session',
    subtitle: 'Huzurlu Gece Ritimleri & Synth Dalgası',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-delight-flute-434.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 155
  }
];

// 🍿 3. EFSANE FİLM & SİNEMA MÜZİKLERİ (ÜÇÜNCÜ SIRADA)
export const MOVIE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'stream-interstellar-space',
    name: 'Uzayın Derinlikleri (Interstellar İlhamı)',
    subtitle: 'Hans Zimmer Tarzı • Kozmik Derinlik & Organ',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 195,
    featured: true
  },
  {
    id: 'stream-inception-time',
    name: 'Zamanın Akışı (Inception İlhamı)',
    subtitle: 'Hans Zimmer Tarzı • Yükselen Yaylılar & Piyano',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-epical-drums-05-681.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-hp-magic',
    name: 'Büyülü Kütüphane (Harry Potter İlhamı)',
    subtitle: 'Hogwarts Havası • Çanlar, Yaylılar & Gizem',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-forest-999.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 185,
    featured: true
  },
  {
    id: 'stream-lotr-epic',
    name: 'Orta Dünya Yürüyüşü (LOTR İlhamı)',
    subtitle: 'Howard Shore Tarzı • Epik Flüt & Doğa Destanı',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 170
  },
  {
    id: 'stream-starwars-galaxy',
    name: 'Galaktik Macera (Star Wars İlhamı)',
    subtitle: 'John Williams Tarzı • Güç Uyanıyor Teması',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-valiant-warrior-625.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180
  },
  {
    id: 'stream-pirates-adventure',
    name: 'Karayip Fırtınası (Pirates İlhamı)',
    subtitle: 'Klaus Badelt Tarzı • Ritmik Orkestra',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-glory-days-684.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 165
  }
];

// 🎬 4. EFSANE DİZİ MÜZİKLERİ (DÖRDÜNCÜ SIRADA)
export const SERIES_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'stream-got-throne',
    name: 'Demir Taht İçin (Game of Thrones İlhamı)',
    subtitle: 'Ramin Djawadi Tarzı • Çello & Epik Ritimler',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 190,
    featured: true
  },
  {
    id: 'stream-stranger-synth',
    name: '80ler Gizemi (Stranger Things İlhamı)',
    subtitle: 'Retro Synthwave • Analog Klavye & Gerilim',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-retro-arcade-machine-272.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'stream-peaky-dark',
    name: 'Birmingham Sokakları (Peaky Blinders)',
    subtitle: 'Karanlık Blues & Karizmatik Akorlar',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 175
  },
  {
    id: 'stream-friends-cozy',
    name: 'Central Perk Sıcaklığı (Friends İlhamı)',
    subtitle: 'Akustik Gitar & Nostaljik Dostluk Ritmi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sun-and-sky-577.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 160
  }
];

// COMBINED ALL SHELVES (Doğa, Lo-Fi, Film ve Dizi)
export const ALL_SOUND_SHELVES: SoundShelf[] = [
  {
    id: 'nature',
    title: 'Doğa & Atmosfer',
    subtitle: 'Sakinleştirici doğa sesleri, yağmur ve orman tonları',
    iconName: 'CloudRain',
    tracks: NATURE_SOUNDTRACKS
  },
  {
    id: 'lofi',
    title: 'Lo-Fi & Derin Odaklanma',
    subtitle: 'Ritmik chillhop ve konsantrasyon artıran arka plan beats',
    iconName: 'Music',
    tracks: LOFI_SOUNDTRACKS
  },
  {
    id: 'movies',
    title: 'Efsane Film & Sinema Müzikleri',
    subtitle: 'Interstellar, Inception, Harry Potter, Yüzüklerin Efendisi...',
    iconName: 'Film',
    tracks: MOVIE_SOUNDTRACKS
  },
  {
    id: 'series',
    title: 'Efsane Dizi Müzikleri',
    subtitle: 'Game of Thrones, Stranger Things, Peaky Blinders & Friends',
    iconName: 'Tv',
    tracks: SERIES_SOUNDTRACKS
  }
];

// Flat list of all tracks
export const ALL_TRACKS: SoundTrack[] = [
  ...NATURE_SOUNDTRACKS,
  ...LOFI_SOUNDTRACKS,
  ...MOVIE_SOUNDTRACKS,
  ...SERIES_SOUNDTRACKS
];

// Helper to convert SoundTrack to AmbientChannel
export function convertTrackToAmbientChannel(track: SoundTrack, volume: number = 60, active: boolean = false): AmbientChannel {
  const channelType: 'stream' | 'youtube' | 'synth' = track.type || (track.audioUrl ? 'stream' : 'youtube');
  return {
    id: track.id,
    name: track.name,
    type: channelType,
    url: track.audioUrl || (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : undefined),
    youtubeId: track.youtubeId,
    volume,
    active
  };
}

// Convert all tracks to default AmbientChannels
export const ALL_DEFAULT_AMBIENT_CHANNELS: AmbientChannel[] = ALL_TRACKS.map(t => convertTrackToAmbientChannel(t, 60, false));



