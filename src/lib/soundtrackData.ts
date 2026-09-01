import { CloudRain, Music, Film, Tv, Sparkles, LucideIcon, Radio, Shield, Zap } from 'lucide-react';
import { AmbientChannel } from '../components/AmbientMixerSheet';

export interface SoundTrack {
  id: string;
  name: string;
  subtitle: string;
  category: 'nature' | 'lofi' | 'movies' | 'series' | 'marvel' | 'transformers';
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
  iconName: 'CloudRain' | 'Music' | 'Film' | 'Tv' | 'Sparkles' | 'Radio' | 'Shield' | 'Zap';
  tracks: SoundTrack[];
}

export function getShelfIcon(iconName: string): LucideIcon {
  switch (iconName) {
    case 'Shield':
      return Shield;
    case 'Zap':
      return Zap;
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

// 🦸 1. MARVEL AVENGERS & DEADPOOL & WOLVERINE SOUNDTRACKS
export const MARVEL_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-marvel-deadpool-likeaprayer',
    name: 'Like a Prayer (Deadpool & Wolverine Mix)',
    subtitle: 'Madonna & Rob Simonsen • Battle Royale Choir Soundtrack',
    category: 'marvel',
    categoryTitle: 'Marvel & Deadpool Soundtrack',
    youtubeId: 'NdzOv1t8Ie4',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 200,
    featured: true
  },
  {
    id: 'yt-marvel-avengers-theme',
    name: 'The Avengers - Main Title Theme',
    subtitle: 'Alan Silvestri • Epik Marvel Sinematik Evreni Teması',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'XNCQZ0wxphY',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 125,
    featured: true
  },
  {
    id: 'yt-marvel-endgame-portals',
    name: 'Avengers: Endgame - Portals',
    subtitle: 'Alan Silvestri • "Avengers Assemble" Efsane Sahnesi',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'F_mhWxOjxp4',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 197,
    featured: true
  },
  {
    id: 'yt-marvel-infinity-war',
    name: 'Avengers: Infinity War - Theme & Porch',
    subtitle: 'Alan Silvestri • Thanos & Sonsuzluk Savaşı Teması',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'a10dXUS3ch0',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 160,
    featured: true
  },
  {
    id: 'yt-marvel-thor-ragnarok',
    name: 'Thor: Ragnarok - Immigrant Song',
    subtitle: 'Led Zeppelin • Asgard Gök Gürültüsü & Köprü Savaşı',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'zJ9dFeZ5344',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 145,
    featured: true
  },
  {
    id: 'yt-marvel-ironman3',
    name: 'Iron Man 3 - Can You Dig It',
    subtitle: 'Brian Tyler • Tony Stark & Karizmatik Orkestra',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'OsSHmKU0t7w',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 162
  },
  {
    id: 'yt-marvel-cap-winter',
    name: 'Captain America - Taking a Stand',
    subtitle: 'Henry Jackman • Kış Askeri & Yüksek Tempolu Aksiyon',
    category: 'marvel',
    categoryTitle: 'Marvel & Avengers Soundtrack',
    youtubeId: 'ENzNJiQNSCc',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 130
  }
];

// 🤖 2. TRANSFORMERS EFSANE FİLM MÜZİKLERİ & SOUNDTRACKS
export const TRANSFORMERS_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-transformers-arrival-to-earth',
    name: 'Transformers - Arrival to Earth',
    subtitle: 'Steve Jablonsky • Otobotların Dünyaya İnişi & Efsane Melodi',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: '0_FHPJIhNBw',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 326,
    featured: true
  },
  {
    id: 'yt-transformers-what-ive-done',
    name: 'Linkin Park - What I\'ve Done',
    subtitle: 'Transformers 1 • Optimus Prime Kapanış Konuşması',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: '8sgycukafqQ',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 208,
    featured: true
  },
  {
    id: 'yt-transformers-new-divide',
    name: 'Linkin Park - New Divide',
    subtitle: 'Transformers: Yenilenlerin İntikamı • Resmi Film Müziği',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: 'ysSxxIqKNN0',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 269,
    featured: true
  },
  {
    id: 'yt-transformers-autobots',
    name: 'Transformers - Autobots Theme',
    subtitle: 'Steve Jablonsky • Epik Kahramanlık & Birliktelik Teması',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: 'w581xiVe0Q8',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 153,
    featured: true
  },
  {
    id: 'yt-transformers-no-sacrifice',
    name: 'Transformers - No Sacrifice, No Victory',
    subtitle: 'Steve Jablonsky • AllSpark & Witwicky Fedakarlığı',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: 'cbxNyoYyGLE',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 178,
    featured: true
  },
  {
    id: 'yt-transformers-scorponok',
    name: 'Transformers - Scorponok Battle',
    subtitle: 'Steve Jablonsky • Çöl Savaşı & Yüksek Gerilim Teması',
    category: 'transformers',
    categoryTitle: 'Transformers Film Müzikleri',
    youtubeId: '5wt2WtZUCuo',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 297
  }
];

// 🌿 3. DOĞA & AMBİYANS (DİREKT MP3 SES AKIŞLARI)
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
    durationSeconds: 600,
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
    durationSeconds: 300,
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
    durationSeconds: 360,
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
    durationSeconds: 240,
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

// ☕ 4. LO-FI & DERİN ODAKLANMA (HQ LO-FI BEATS)
export const LOFI_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-lofi-girl',
    name: 'Lofi Girl - Chill Beats',
    subtitle: 'Lo-Fi Odak • Yumuşak Rhodes & Dinlendirici Beats',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'jfKfPfyJRdk',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 340,
    featured: true
  },
  {
    id: 'yt-lofi-study-session',
    name: '1 A.M Study Session',
    subtitle: 'Binaural Focus • Meditatif Piyano & Chillhop',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'lTRiuFIWV54',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1507842229452-772d1c86e246?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 290,
    featured: true
  },
  {
    id: 'yt-lofi-tokyo-night',
    name: 'Tokyo Night Vibes',
    subtitle: 'Gece Kodlama & Yağmurlu Neon Melodileri',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'TURbeWK2wwg',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 320,
    featured: true
  },
  {
    id: 'yt-lofi-coffee-shop',
    name: 'Cozy Coffee Shop Beats',
    subtitle: 'Sıcak Kahve & Akustik Lo-Fi Harmonileri',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: '-5KAN9_CzSA',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 300,
    featured: true
  },
  {
    id: 'yt-lofi-peaceful-piano',
    name: 'Peaceful Piano Focus',
    subtitle: 'Derin Konsantrasyon • Akıcı Piyano Melodileri',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: '4xDzrJKXOOY',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 310,
    featured: true
  },
  {
    id: 'yt-lofi-synthwave',
    name: 'Synthwave Chill Coding',
    subtitle: 'Midnight Coding • Retrowave & Sakin Elektronik',
    category: 'lofi',
    categoryTitle: 'Lo-Fi Odaklanma',
    youtubeId: 'f02mOEt11OQ',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 280
  }
];

// 🎬 5. EFSANE FİLM & SİNEMA MÜZİKLERİ (YOUTUBE SOUNDTRACKS)
export const MOVIE_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-movie-interstellar',
    name: 'Interstellar - First Step & Cornfield Chase',
    subtitle: 'Hans Zimmer • Kozmik Derinlik & Yüksek Odaklanma',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'UDVtMYqUAyw',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 320,
    featured: true
  },
  {
    id: 'yt-movie-inception',
    name: 'Inception - Time (Hans Zimmer)',
    subtitle: 'Hans Zimmer • Rüya Katmanları & Derin Düşünce',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'RxabLA7UQ9k',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 275,
    featured: true
  },
  {
    id: 'yt-movie-harrypotter',
    name: 'Harry Potter - Hedwig\'s Theme',
    subtitle: 'John Williams • Büyülü Hogwarts Ambiyansı',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'Htaj3o3JD8I',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 310,
    featured: true
  },
  {
    id: 'yt-movie-lotr',
    name: 'Lord of the Rings - Concerning Hobbits',
    subtitle: 'Howard Shore • Shire Huzuru & Akustik Flüt',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '_pGaz_qN0cw',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 290,
    featured: true
  },
  {
    id: 'yt-movie-starwars',
    name: 'Star Wars - The Force Theme / Binary Sunset',
    subtitle: 'John Williams • Epik Uzay Atmosferi & İlham',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: 'hc_L_o9nKpk',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 260
  },
  {
    id: 'yt-movie-pirates',
    name: 'Pirates of the Caribbean - He\'s a Pirate',
    subtitle: 'Klaus Badelt & Hans Zimmer • Yüksek Enerji',
    category: 'movies',
    categoryTitle: 'Film Müzikleri',
    youtubeId: '27mB8verLK8',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 185
  }
];

// 📺 6. EFSANE DİZİ MÜZİKLERİ (YOUTUBE SOUNDTRACKS)
export const SERIES_SOUNDTRACKS: SoundTrack[] = [
  {
    id: 'yt-series-got',
    name: 'Game of Thrones - Main Title',
    subtitle: 'Ramin Djawadi • Viyolonsel & Epik Westeros Teması',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 's7L2PVdrb_8',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 110,
    featured: true
  },
  {
    id: 'yt-series-stranger',
    name: 'Stranger Things - Main Theme',
    subtitle: 'Survive • 80\'ler Retro Analog Synth & Gizem',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: '-RcPZdihrp4',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 95,
    featured: true
  },
  {
    id: 'yt-series-peaky',
    name: 'Peaky Blinders - Red Right Hand',
    subtitle: 'Nick Cave • Karizmatik Bas & Birmingham Atmosferi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'RrxePKps87k',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 360,
    featured: true
  },
  {
    id: 'yt-series-friends',
    name: 'Friends - Central Perk Chill',
    subtitle: 'Akustik Gitar & Nostaljik Dostluk Ritmi',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'q-9kPks0IfE',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 220,
    featured: true
  },
  {
    id: 'yt-series-breaking',
    name: 'Breaking Bad - Main Title Theme',
    subtitle: 'Dave Porter • Çöl Rüzgarı & Dobro Gitar',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: 'bMTJdYv_w6k',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 80
  },
  {
    id: 'yt-series-sherlock',
    name: 'Sherlock - Opening Theme & Discombobulate',
    subtitle: 'David Arnold & Michael Price • Baker Street Zekası',
    category: 'series',
    categoryTitle: 'Dizi Müzikleri',
    youtubeId: '7Z33x4yWnYo',
    type: 'youtube',
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 150
  }
];

// COMBINED ALL SHELVES (Marvel, Transformers, Film, Dizi, Doğa ve Lo-Fi)
export const ALL_SOUND_SHELVES: SoundShelf[] = [
  {
    id: 'marvel',
    title: 'Marvel Avengers & Deadpool Koleksiyonu',
    subtitle: 'Like a Prayer, The Avengers, Portals, Infinity War, Thor Ragnarok & Iron Man',
    iconName: 'Shield',
    tracks: MARVEL_SOUNDTRACKS
  },
  {
    id: 'transformers',
    title: 'Transformers Efsane Film Müzikleri',
    subtitle: 'Arrival to Earth, Linkin Park What I\'ve Done, New Divide & Autobots',
    iconName: 'Zap',
    tracks: TRANSFORMERS_SOUNDTRACKS
  },
  {
    id: 'movies',
    title: 'Efsane Film & Sinema Müzikleri',
    subtitle: 'Interstellar, Inception, Harry Potter, Yüzüklerin Efendisi & Star Wars',
    iconName: 'Film',
    tracks: MOVIE_SOUNDTRACKS
  },
  {
    id: 'series',
    title: 'Efsane Dizi Müzikleri',
    subtitle: 'Game of Thrones, Stranger Things, Peaky Blinders & Friends',
    iconName: 'Tv',
    tracks: SERIES_SOUNDTRACKS
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
  }
];

// Flat list of all tracks
export const ALL_TRACKS: SoundTrack[] = [
  ...MARVEL_SOUNDTRACKS,
  ...TRANSFORMERS_SOUNDTRACKS,
  ...MOVIE_SOUNDTRACKS,
  ...SERIES_SOUNDTRACKS,
  ...NATURE_SOUNDTRACKS,
  ...LOFI_SOUNDTRACKS
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



