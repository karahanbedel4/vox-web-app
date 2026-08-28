import { CloudRain, Music, Film, Tv, Sparkles, LucideIcon, Radio } from 'lucide-react';
import { AmbientChannel } from '../components/AmbientMixerSheet';

export interface SoundTrack {
  id: string;
  name: string;
  subtitle: string;
  category: 'test' | 'nature' | 'lofi' | 'movies' | 'series';
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

// 🧪 0. IPHONE / SAFARI DİREKT MP3 TEST SESLERİ (EN ÜSTTE)
export const DIRECT_TEST_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'direct-rain-stream',
    name: '🌧️ Sakin Yaz Yağmuru (Direkt MP3)',
    subtitle: '⚡ iPhone Uyumlu • Doğrudan Ses Akışı',
    category: 'test',
    categoryTitle: '🧪 Direkt MP3 Testi (iPhone)',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'direct-forest-stream',
    name: '🌲 Orman ve Kuş Cıvıltıları (Direkt MP3)',
    subtitle: '⚡ iPhone Uyumlu • Doğrudan Ses Akışı',
    category: 'test',
    categoryTitle: '🧪 Direkt MP3 Testi (iPhone)',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1250/1250-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'direct-ocean-stream',
    name: '🌊 Okyanus ve Dalga Sesleri (Direkt MP3)',
    subtitle: '⚡ iPhone Uyumlu • Doğrudan Ses Akışı',
    category: 'test',
    categoryTitle: '🧪 Direkt MP3 Testi (iPhone)',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1249/1249-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'direct-lofi-stream',
    name: '☕ Chill Lo-Fi Odak Beats (Direkt MP3)',
    subtitle: '⚡ iPhone Uyumlu • Doğrudan Ses Akışı',
    category: 'test',
    categoryTitle: '🧪 Direkt MP3 Testi (iPhone)',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-chill-bro-494.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 160,
    featured: true
  },
  {
    id: 'direct-campfire-stream',
    name: '🔥 Gece ve Şömine Çatırtısı (Direkt MP3)',
    subtitle: '⚡ iPhone Uyumlu • Doğrudan Ses Akışı',
    category: 'test',
    categoryTitle: '🧪 Direkt MP3 Testi (iPhone)',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
    type: 'stream',
    coverImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  }
];

// 🌿 1. DOĞA & AMBİYANS (EN ÜSTTE)
export const NATURE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-nature-rain',
    name: 'Doğada Yağmur Sesi',
    subtitle: 'Sakinleştirici Yağmur & Gök Gürültüsü',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'mPZkdNFkNps',
    coverImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600,
    featured: true
  },
  {
    id: 'yt-forest-birds',
    name: 'Sakin Orman & Kuş Sesi',
    subtitle: 'Huzurlu Orman & Kuş Cıvıltıları',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'xNN7iTA57jM',
    coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600,
    featured: true
  },
  {
    id: 'yt-ocean-waves',
    name: 'Okyanus & Dalga Sesi',
    subtitle: 'Derin Sahil Dalgaları',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'bn9F19Hi1Lk',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  },
  {
    id: 'yt-campfire-night',
    name: 'Gece & Kamp Ateşi',
    subtitle: 'Çıtırdayan Sıcak Ateş & Ambiyans',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'L_LUpnjgPso',
    coverImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  },
  {
    id: 'yt-cozy-cafe',
    name: 'Sakin Kafe Ambiyansı',
    subtitle: 'Kahve Dükkanı & Hafif Uğultu',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'gaGrHUekGrc',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  }
];

// ☕ 2. LO-FI & DERİN ODAKLANMA (İKİNCİ SIRADA)
export const LOFI_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-lofi-girl',
    name: 'Lofi Beats to Focus',
    subtitle: 'Lofi Girl • Chillhop Beats',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'jfKfPfyJRdk',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600,
    featured: true
  },
  {
    id: 'yt-deep-work',
    name: 'Derin Çalışma Müziği',
    subtitle: 'Binaural Focus & Zihin Açıcı Tonlar',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'WPni755-Krg',
    coverImage: 'https://images.unsplash.com/photo-1507842229452-772d1c86e246?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600,
    featured: true
  },
  {
    id: 'yt-lofi-rain',
    name: 'Lo-Fi & Yağmur',
    subtitle: 'Gece Yağmuru & Sakin Akorlar',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'sF80I-TQiW0',
    coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  },
  {
    id: 'yt-lofi-chill',
    name: 'Lo-Fi Chill Gece',
    subtitle: 'Huzurlu Ritimler & Gece Çalışması',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: '5qap5aO4i9A',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  }
];

// 🍿 3. EFSANE FİLM & SİNEMA MÜZİKLERİ (ÜÇÜNCÜ SIRADA)
export const MOVIE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-interstellar-theme',
    name: 'Cornfield Chase',
    subtitle: 'Interstellar • Hans Zimmer',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'UDVtMYqUAyw',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 240,
    featured: true
  },
  {
    id: 'yt-inception-time',
    name: 'Time',
    subtitle: 'Inception • Hans Zimmer',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'RxabLA7UQ9k',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 275,
    featured: true
  },
  {
    id: 'yt-starwars-imperial',
    name: 'The Imperial March',
    subtitle: 'Star Wars • John Williams',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '-bzWSJG93P8',
    coverImage: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'yt-lotr-soundtrack',
    name: 'The Fellowship Suite',
    subtitle: 'Yüzüklerin Efendisi • Howard Shore',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'FrWuCPgsp_c',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 340
  },
  {
    id: 'yt-hp-ambient',
    name: 'Hogwarts Kütüphane',
    subtitle: 'Harry Potter • Büyülü Çalışma',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'BQrxsyGTztM',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 3600
  },
  {
    id: 'yt-pirates-caribbean',
    name: "He's a Pirate",
    subtitle: 'Karayip Korsanları • Klaus Badelt',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '27mB8verLK8',
    coverImage: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 190
  }
];

// 🎬 4. EFSANE DİZİ MÜZİKLERİ (DÖRDÜNCÜ SIRADA)
export const SERIES_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-friends-theme',
    name: "I'll Be There For You",
    subtitle: 'Friends • The Rembrandts',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'q-9kPks0IfE',
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 195,
    featured: true
  },
  {
    id: 'yt-got-main',
    name: 'Game of Thrones Main Theme',
    subtitle: 'Game of Thrones • Ramin Djawadi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'TZE9gVF1QbA',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'yt-peaky-blinders',
    name: 'Red Right Hand',
    subtitle: 'Peaky Blinders • Nick Cave',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'Kgd205y3-gU',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 370
  },
  {
    id: 'yt-stranger-things',
    name: 'Stranger Things Main Theme',
    subtitle: 'Stranger Things • Synthwave Focus',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: '-RcPZdihrp4',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 180
  }
];

// COMBINED ALL SHELVES (Direct MP3 Test, Doğa ve Lo-Fi en üstte)
export const ALL_SOUND_SHELVES: SoundShelf[] = [
  {
    id: 'test',
    title: '🧪 Direkt Ses Testi (iPhone & Safari Uyumlu MP3)',
    subtitle: 'YouTube kısıtlamalarına takılmayan, iPhone ve Safari için doğrudan ses dosyaları',
    iconName: 'Sparkles',
    tracks: DIRECT_TEST_SOUNDTRACKS
  },
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
    subtitle: 'Interstellar, Inception, Star Wars, Yüzüklerin Efendisi...',
    iconName: 'Film',
    tracks: MOVIE_SOUNDTRACKS
  },
  {
    id: 'series',
    title: 'Efsane Dizi Müzikleri',
    subtitle: 'Friends, Game of Thrones, Peaky Blinders & daha fazlası',
    iconName: 'Tv',
    tracks: SERIES_SOUNDTRACKS
  }
];

// Flat list of all tracks
export const ALL_TRACKS: SoundTrack[] = [
  ...DIRECT_TEST_SOUNDTRACKS,
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


