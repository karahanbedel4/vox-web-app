export interface LiveTvChannel {
  id: string;
  name: string;
  shortName: string;
  youtubeId: string;
  youtubeUrl: string;
  category: 'Gündem' | 'Ekonomi' | 'Dünya';
  brandColor: string;
  badgeColor: string;
  description: string;
  resolution: string;
}

export const LIVE_TV_CHANNELS: LiveTvChannel[] = [
  {
    id: 'cnn-turk',
    name: 'CNN TÜRK',
    shortName: 'CNN',
    youtubeId: '6N8_r2uwLEc',
    youtubeUrl: 'https://www.youtube.com/watch?v=6N8_r2uwLEc',
    category: 'Gündem',
    brandColor: '#CC0000',
    badgeColor: 'bg-red-600',
    description: 'Son dakika haberleri, Türkiye ve dünyadan canlı yayınlar.',
    resolution: '1080p HD'
  },
  {
    id: 'sozcu-tv',
    name: 'Sözcü TV',
    shortName: 'SZC',
    youtubeId: 'ztmY_cCtUl0',
    youtubeUrl: 'https://www.youtube.com/watch?v=ztmY_cCtUl0',
    category: 'Gündem',
    brandColor: '#E30613',
    badgeColor: 'bg-red-700',
    description: 'Sözcü TV kesintisiz canlı yayın akışı ve gündem haberleri.',
    resolution: '1080p HD'
  },
  {
    id: 'halk-tv',
    name: 'HalkTV',
    shortName: 'HALK',
    youtubeId: 'jHMsvYrf-UA',
    youtubeUrl: 'https://www.youtube.com/watch?v=jHMsvYrf-UA',
    category: 'Gündem',
    brandColor: '#0047BA',
    badgeColor: 'bg-blue-600',
    description: 'Halk TV canlı yayın bültenleri, analizler ve sıcak gelişmeler.',
    resolution: '1080p HD'
  },
  {
    id: 'haberturk',
    name: 'Habertürk',
    shortName: 'HT',
    youtubeId: 'RNVNlJSUFoE',
    youtubeUrl: 'https://www.youtube.com/watch?v=RNVNlJSUFoE',
    category: 'Gündem',
    brandColor: '#B30000',
    badgeColor: 'bg-rose-700',
    description: 'Doğru ve tarafsız son dakika haber bültenleri canlı yayında.',
    resolution: '1080p HD'
  },
  {
    id: 'ntv',
    name: 'NTV',
    shortName: 'NTV',
    youtubeId: 'pqq5c6k70kk',
    youtubeUrl: 'https://www.youtube.com/watch?v=pqq5c6k70kk',
    category: 'Gündem',
    brandColor: '#00843D',
    badgeColor: 'bg-emerald-600',
    description: 'Haberin kaynağı NTV 7/24 kesintisiz canlı yayın.',
    resolution: '1080p HD'
  },
  {
    id: 'bloomberg-ht',
    name: 'Bloomberg HT',
    shortName: 'BHT',
    youtubeId: 'j7B_zsL11Pw',
    youtubeUrl: 'https://www.youtube.com/watch?v=j7B_zsL11Pw',
    category: 'Ekonomi',
    brandColor: '#F47920',
    badgeColor: 'bg-amber-600',
    description: 'Piyasalar, borsa, döviz kurları ve ekonomi haberleri canlı.',
    resolution: '1080p HD'
  },
  {
    id: 'trt-haber',
    name: 'TRT Haber',
    shortName: 'TRT',
    youtubeId: 'myv0L5yK_rY',
    youtubeUrl: 'https://www.youtube.com/watch?v=myv0L5yK_rY',
    category: 'Gündem',
    brandColor: '#E30A17',
    badgeColor: 'bg-red-600',
    description: 'Türkiye ve dünyadaki gelişmeler TRT Haber canlı yayınında.',
    resolution: '1080p HD'
  },
  {
    id: 'tv100',
    name: 'TV100',
    shortName: 'TV100',
    youtubeId: '4WSvLRk83-c',
    youtubeUrl: 'https://www.youtube.com/watch?v=4WSvLRk83-c',
    category: 'Gündem',
    brandColor: '#0052A3',
    badgeColor: 'bg-sky-700',
    description: 'TV100 son dakika haberleri, tartışma programları ve canlı yayın.',
    resolution: '1080p HD'
  },
  {
    id: 'haber-global',
    name: 'Haber Global',
    shortName: 'HG',
    youtubeId: 'EqoCJ8BPxtE',
    youtubeUrl: 'https://www.youtube.com/watch?v=EqoCJ8BPxtE',
    category: 'Gündem',
    brandColor: '#1A2B4C',
    badgeColor: 'bg-indigo-700',
    description: 'Dünya ve bölge gündemi sıcak gelişmelerle Haber Global canlı.',
    resolution: '1080p HD'
  }
];
