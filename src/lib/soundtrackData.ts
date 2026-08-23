import { CloudRain, Music, Film, Tv, Sparkles, LucideIcon } from 'lucide-react';
import { AmbientChannel } from '../components/AmbientMixerSheet';

export interface SoundTrack {
  id: string;
  name: string;
  subtitle: string;
  category: 'series' | 'movies' | 'nature' | 'lofi';
  categoryTitle: string;
  youtubeId: string;
  durationSeconds?: number;
  featured?: boolean;
}

export interface SoundShelf {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'Tv' | 'Film' | 'CloudRain' | 'Music' | 'Sparkles';
  tracks: SoundTrack[];
}

export function getShelfIcon(iconName: string): LucideIcon {
  switch (iconName) {
    case 'Tv':
      return Tv;
    case 'Film':
      return Film;
    case 'CloudRain':
      return CloudRain;
    case 'Music':
      return Music;
    default:
      return Sparkles;
  }
}

// 🎬 EFSANE DİZİ MÜZİKLERİ
export const SERIES_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-friends-theme',
    name: "I'll Be There For You",
    subtitle: 'Friends • The Rembrandts',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'q-9kPks0IfE',
    durationSeconds: 195,
    featured: true
  },
  {
    id: 'yt-himym-theme',
    name: 'Hey Beautiful',
    subtitle: 'How I Met Your Mother • The Solids',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: '7pOr30zM5b8',
    durationSeconds: 160,
    featured: true
  },
  {
    id: 'yt-himym-lavie',
    name: 'La Vie En Rose (Ukulele)',
    subtitle: 'How I Met Your Mother • Cristin Milioti',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'vB6S7iFq2qU',
    durationSeconds: 140
  },
  {
    id: 'yt-got-main',
    name: 'Game of Thrones Main Theme',
    subtitle: 'Game of Thrones • Ramin Djawadi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'TZE9gVF1QbA',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'yt-got-light',
    name: 'Light of the Seven',
    subtitle: 'Game of Thrones • Ramin Djawadi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'k1frgt0D0lQ',
    durationSeconds: 590
  },
  {
    id: 'yt-peaky-blinders',
    name: 'Red Right Hand',
    subtitle: 'Peaky Blinders • Nick Cave & The Bad Seeds',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'Kgd205y3-gU',
    durationSeconds: 370
  },
  {
    id: 'yt-stranger-things',
    name: 'Stranger Things Main Theme',
    subtitle: 'Stranger Things • Synthwave Focus',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: '-RcPZdihrp4',
    durationSeconds: 180
  },
  {
    id: 'yt-breaking-bad',
    name: 'Breaking Bad Main Theme',
    subtitle: 'Breaking Bad • Dave Porter',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'bmtbg5b7wg8',
    durationSeconds: 150
  },
  {
    id: 'yt-sherlock-theme',
    name: 'Sherlock Opening Theme',
    subtitle: 'Sherlock • David Arnold',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'xX2JbZ2a3_0',
    durationSeconds: 170
  }
];

// 🍿 EFSANE FİLM MÜZİKLERİ
export const MOVIE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-starwars-imperial',
    name: 'The Imperial March',
    subtitle: 'Star Wars • John Williams',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '-bzWSJG93P8',
    durationSeconds: 180,
    featured: true
  },
  {
    id: 'yt-starwars-binary',
    name: 'Binary Sunset & Main Theme',
    subtitle: 'Star Wars • John Williams',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'WB-b_2_fJ-s',
    durationSeconds: 210
  },
  {
    id: 'yt-hp-hedwig',
    name: "Hedwig's Theme",
    subtitle: 'Harry Potter • John Williams',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'Htaj3o3JD8E',
    durationSeconds: 310,
    featured: true
  },
  {
    id: 'yt-hp-ambient',
    name: 'Hogwarts Kütüphane & Ambiyans',
    subtitle: 'Harry Potter • Büyülü Çalışma',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'BQrxsyGTztM',
    durationSeconds: 3600
  },
  {
    id: 'yt-lotr-shire',
    name: 'Concerning Hobbits (The Shire)',
    subtitle: 'Yüzüklerin Efendisi • Howard Shore',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '_pGaz_qN0cw',
    durationSeconds: 210,
    featured: true
  },
  {
    id: 'yt-lotr-soundtrack',
    name: 'The Fellowship Suite',
    subtitle: 'Yüzüklerin Efendisi • Howard Shore',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'FrWuCPgsp_c',
    durationSeconds: 340
  },
  {
    id: 'yt-interstellar-theme',
    name: 'Cornfield Chase & Main Theme',
    subtitle: 'Interstellar • Hans Zimmer',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'UDVtMYqUAyw',
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
    durationSeconds: 275
  },
  {
    id: 'yt-pirates-caribbean',
    name: "He's a Pirate",
    subtitle: 'Karayip Korsanları • Klaus Badelt',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '27mB8verLK8',
    durationSeconds: 190
  },
  {
    id: 'yt-godfather-theme',
    name: 'Speak Softly Love (Love Theme)',
    subtitle: 'Baba (The Godfather) • Nino Rota',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'hw4hYVnZkL8',
    durationSeconds: 160
  },
  {
    id: 'yt-gladiator-freedom',
    name: 'Now We Are Free',
    subtitle: 'Gladiator • Hans Zimmer & Lisa Gerrard',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'NBE-uBgtINg',
    durationSeconds: 260
  },
  {
    id: 'yt-pulp-fiction',
    name: 'Misirlou',
    subtitle: 'Pulp Fiction • Dick Dale',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '-y3h9p_c5-M',
    durationSeconds: 140
  }
];

// 🌿 DOĞA & AMBİYANS
export const NATURE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-nature-rain',
    name: 'Doğada Yağmur Sesi',
    subtitle: 'Doğa & Yağmur',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: '3mst47Uu3IU',
    durationSeconds: 3600
  },
  {
    id: 'yt-forest-birds',
    name: 'Sakin Orman & Kuş Sesi',
    subtitle: 'Orman & Kuşlar',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'xNN7iTA57jM',
    durationSeconds: 3600
  },
  {
    id: 'yt-thunder-rain',
    name: 'Şimşek ve Fırtına Sesi',
    subtitle: 'Gece Fırtınası',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: '9JEL_n6egA8',
    durationSeconds: 3600
  },
  {
    id: 'yt-ocean-waves',
    name: 'Okyanus & Dalga Sesi',
    subtitle: 'Sahil Dalgaları',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'bn9F19Hi1Lk',
    durationSeconds: 3600
  },
  {
    id: 'yt-campfire-night',
    name: 'Gece & Kamp Ateşi Sesi',
    subtitle: 'Çıtırdayan Ateş',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'L_LUpnjgPso',
    durationSeconds: 3600
  },
  {
    id: 'yt-cozy-cafe',
    name: 'Sakin Kafe Ambiyansı',
    subtitle: 'Kahve Dükkanı',
    category: 'nature',
    categoryTitle: 'Doğa & Ambiyans',
    youtubeId: 'gaGrHUekGrc',
    durationSeconds: 3600
  }
];

// ☕ LO-FI & CHILL
export const LOFI_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-lofi-rain',
    name: 'Lo-Fi & Yağmur',
    subtitle: 'Chillhop Yağmur',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'sF80I-TQiW0',
    durationSeconds: 3600
  },
  {
    id: 'yt-lofi-chill',
    name: 'Lo-Fi Chill',
    subtitle: 'Huzurlu Beats',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'fsPRybb-xXg',
    durationSeconds: 3600
  },
  {
    id: 'yt-deep-work',
    name: 'Derin Çalışma Müziği',
    subtitle: 'Binaural Focus',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'czMO-L42nnc',
    durationSeconds: 3600
  }
];

// COMBINED ALL SHELVES FOR EASY RENDERING
export const ALL_SOUND_SHELVES: SoundShelf[] = [
  {
    id: 'series',
    title: 'Efsane Dizi Müzikleri',
    subtitle: 'Friends, HIMYM, Game of Thrones, Peaky Blinders & daha fazlası',
    iconName: 'Tv',
    tracks: SERIES_SOUNDTRACKS
  },
  {
    id: 'movies',
    title: 'Efsane Film & Sinema Müzikleri',
    subtitle: 'Star Wars, Harry Potter, Yüzüklerin Efendisi, Interstellar, Inception...',
    iconName: 'Film',
    tracks: MOVIE_SOUNDTRACKS
  },
  {
    id: 'nature',
    title: 'Doğa & Atmosfer',
    subtitle: 'Sakinleştirici doğa sesleri, yağmur ve şimşek tonları',
    iconName: 'CloudRain',
    tracks: NATURE_SOUNDTRACKS
  },
  {
    id: 'lofi',
    title: 'Lo-Fi & Derin Odaklanma',
    subtitle: 'Ritmik chillhop ve konsantrasyon artıran arka plan beats',
    iconName: 'Music',
    tracks: LOFI_SOUNDTRACKS
  }
];

// Flat list of all tracks
export const ALL_TRACKS: SoundTrack[] = [
  ...SERIES_SOUNDTRACKS,
  ...MOVIE_SOUNDTRACKS,
  ...NATURE_SOUNDTRACKS,
  ...LOFI_SOUNDTRACKS
];

// Helper to convert SoundTrack to AmbientChannel
export function convertTrackToAmbientChannel(track: SoundTrack, volume: number = 60, active: boolean = false): AmbientChannel {
  return {
    id: track.id,
    name: track.name,
    type: 'youtube',
    url: `https://www.youtube.com/watch?v=${track.youtubeId}`,
    youtubeId: track.youtubeId,
    volume,
    active
  };
}

// Convert all tracks to default AmbientChannels
export const ALL_DEFAULT_AMBIENT_CHANNELS: AmbientChannel[] = ALL_TRACKS.map(t => convertTrackToAmbientChannel(t, 60, false));
