export interface LiveTvChannel {
  id: string;
  name: string;
  shortName: string;
  youtubeId: string;
  youtubeUrl: string;
  category: 'Gündem' | 'Ekonomi' | 'Dünya' | 'Spor';
  brandColor: string;
  badgeColor: string;
  description: string;
  resolution: string;
  isDynamicLive?: boolean;
}

export interface LiveTvCategoryInfo {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1Title: string;
  keywords: string[];
}

export const LIVE_TV_CATEGORIES: LiveTvCategoryInfo[] = [
  {
    id: 'Tümü',
    name: 'Tümü',
    slug: '',
    seoTitle: 'Canlı TV - Kesintisiz Haber ve Spor Kanalları İzle | VOX',
    seoDescription: 'CNN TÜRK, Sözcü TV, NTV, Habertürk, HT Spor, A Spor, beIN Sports Haber, HalkTV ve Bloomberg HT canlı yayınlarını tek ekranda donmadan ve reklamsız izleyin.',
    h1Title: 'Canlı TV - Kesintisiz Haber ve Spor Yayınları',
    keywords: ['canlı tv izle', 'canlı haber izle', 'canlı spor kanalları', 'kesintisiz canlı tv']
  },
  {
    id: 'Spor',
    name: 'Spor',
    slug: 'spor',
    seoTitle: 'Canlı Spor TV - HT Spor, A Spor, beIN Sports Haber Canlı İzle | VOX',
    seoDescription: 'HT Spor, A Spor ve beIN SPORTS HABER şifresiz HD canlı yayınlarını tek ekranda donmadan izleyin. Süper Lig maç özetleri, transfer haberleri ve canlı spor bültenleri.',
    h1Title: 'Canlı Spor Kanalları - Kesintisiz HD Spor Yayınları',
    keywords: ['canlı spor izle', 'ht spor canlı', 'aspor canlı izle', 'bein sports haber izle', 'canlı maç bültenleri']
  },
  {
    id: 'Gündem',
    name: 'Gündem',
    slug: 'gundem',
    seoTitle: 'Canlı Haber Kanalları - CNN TÜRK, Sözcü TV, NTV, Habertürk İzle | VOX',
    seoDescription: 'Türkiye’nin lider haber kanalları CNN TÜRK, Sözcü TV, HalkTV, Habertürk, NTV, TRT Haber ve TV100 canlı yayınlarını tek ekranda eş zamanlı takip edin.',
    h1Title: 'Canlı Gündem ve Haber Kanalları',
    keywords: ['canlı haber izle', 'cnn türk canlı', 'sözcü tv canlı', 'ntv canlı', 'habertürk canlı']
  },
  {
    id: 'Ekonomi',
    name: 'Ekonomi',
    slug: 'ekonomi',
    seoTitle: 'Canlı Ekonomi TV - Bloomberg HT Canlı Yayınları ve Borsa İzle | VOX',
    seoDescription: 'Bloomberg HT canlı yayını ile Borsa İstanbul, altın, dolar, euro ve küresel finans piyasalarını kesintisiz ve canlı olarak tek ekranda izleyin.',
    h1Title: 'Canlı Ekonomi ve Finans Yayınları',
    keywords: ['bloomberg ht canlı', 'canlı borsa izle', 'ekonomi kanalları canlı', 'piyasa haberleri canlı']
  }
];

export const LIVE_TV_CHANNELS: LiveTvChannel[] = [
  // --- SPOR KANALLARI ---
  {
    id: 'ht-spor',
    name: 'HT Spor',
    shortName: 'HT SPOR',
    youtubeId: 'gcWaPe_LBMc',
    youtubeUrl: 'https://www.youtube.com/watch?v=gcWaPe_LBMc',
    category: 'Spor',
    brandColor: '#CC0000',
    badgeColor: 'bg-red-600',
    description: 'HT Spor kesintisiz canlı yayın, Süper Lig, transfer gelişmeleri ve spor bültenleri.',
    resolution: '1080p HD'
  },
  {
    id: 'a-spor',
    name: 'A Spor',
    shortName: 'A SPOR',
    youtubeId: '-zSaswVrQ_M',
    youtubeUrl: 'https://www.youtube.com/watch?v=-zSaswVrQ_M',
    category: 'Spor',
    brandColor: '#009639',
    badgeColor: 'bg-emerald-600',
    description: 'A Spor kesintisiz canlı yayın akışı, maç özetleri, tartışma programları ve son dakika spor haberleri.',
    resolution: '1080p HD'
  },
  {
    id: 'bein-sports-haber',
    name: 'beIN SPORTS HABER',
    shortName: 'beIN',
    youtubeId: 'i7UpPgxfZZ8',
    youtubeUrl: 'https://www.youtube.com/watch?v=i7UpPgxfZZ8',
    category: 'Spor',
    brandColor: '#5D2D91',
    badgeColor: 'bg-purple-700',
    description: 'beIN SPORTS HABER şifresiz HD canlı yayını, Trendyol Süper Lig, Avrupa ligleri ve spor analizleri.',
    resolution: '1080p HD'
  },

  // --- HABER & GÜNDEM KANALLARI ---
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
