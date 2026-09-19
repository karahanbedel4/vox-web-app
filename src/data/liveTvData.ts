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

export const TARGET_KEYWORDS_CANLI_TV: string[] = [
  'kanallar canlı tv',
  'canl tv izle',
  'tv kanallar listesi',
  'canl tv izle trt 1',
  'canl tv kanal d',
  'canl tv',
  'televizyon kanallar indir ucretsiz',
  'tv kanallar listesi indir',
  'mobil tv',
  'canli tv izle',
  'canli tv',
  'canli tv izle trt',
  'tv8 canli izle',
  'canli tv izle trt1',
  'canli tv8',
  'canli tv now',
  'canli tv ictimai',
  'canli tv az',
  'canli tv star',
  'trt1 canl tv izle',
  'canlı tv',
  'canlı tay tv',
  'canlı show tv izle',
  'canlı show tv',
  'canlı star tv izle',
  'canlı tjk tv',
  'canlı halk tv',
  'canlı star tv',
  'canlı yayın show tv'
];

export interface TvDirectoryChannel {
  id: string;
  name: string;
  category: string;
  description: string;
  highlight: string;
  streamUrl?: string;
  keywords: string[];
  badge?: string;
}

export const TV_DIRECTORY_CHANNELS: TvDirectoryChannel[] = [
  {
    id: 'trt-1',
    name: 'TRT 1',
    category: 'Ulusal',
    description: 'TRT 1 canlı yayın: Gönül Dağı, Teşkilat, milli maçlar ve Türkiye’nin kamu yayıncısı TRT 1 HD canlı izleme sayfası.',
    highlight: 'Diziler, Milli Maçlar & Haber',
    keywords: ['canl tv izle trt 1', 'canli tv izle trt', 'canli tv izle trt1', 'trt1 canl tv izle'],
    badge: 'Kamu Yayıncısı'
  },
  {
    id: 'tv8',
    name: 'TV8',
    category: 'Eğlence',
    description: 'TV8 canlı izle: MasterChef Türkiye, Survivor, O Ses Türkiye ve TV8 canlı yayın akışını kesintisiz ve donmadan takip edin.',
    highlight: 'Survivor & MasterChef',
    keywords: ['tv8 canli izle', 'canli tv8'],
    badge: 'Popüler Eğlence'
  },
  {
    id: 'show-tv',
    name: 'Show TV',
    category: 'Ulusal',
    description: 'Canlı Show TV izle: Kızılcık Şerbeti, Bahar, Deha dizileri, Güldür Güldür Show ve Show Ana Haber bülteni canlı yayında.',
    highlight: 'Kızılcık Şerbeti, Bahar, Deha',
    keywords: ['canlı show tv izle', 'canlı show tv', 'canlı yayın show tv'],
    badge: 'Ulusal Kanal'
  },
  {
    id: 'star-tv',
    name: 'Star TV',
    category: 'Ulusal',
    description: 'Canlı Star TV izle: Yalı Çapkını, Sahipsizler dizileri ve Star TV HD canlı yayın akışını yüksek kalitede izleyin.',
    highlight: 'Yalı Çapkını & Star Haber',
    keywords: ['canli tv star', 'canlı star tv izle', 'canlı star tv'],
    badge: 'Ulusal Kanal'
  },
  {
    id: 'kanal-d',
    name: 'Kanal D',
    category: 'Ulusal',
    description: 'Canlı TV Kanal D izle: İnci Taneleri, Arka Sokaklar, Kanal D Ana Haber ve sevilen dizilerin canlı yayın akışı.',
    highlight: 'İnci Taneleri & Arka Sokaklar',
    keywords: ['canl tv kanal d', 'kanal d canlı izle'],
    badge: 'Ulusal Kanal'
  },
  {
    id: 'now-tv',
    name: 'NOW TV',
    category: 'Ulusal',
    description: 'Canlı TV NOW izle (eski FOX TV): Kızıl Goncalar, Hudutsuz Sevda, Selçuk Tepeli ile NOW Ana Haber canlı yayın akışı.',
    highlight: 'Kızıl Goncalar & NOW Haber',
    keywords: ['canli tv now', 'now tv canlı izle'],
    badge: 'Ulusal Kanal'
  },
  {
    id: 'halk-tv',
    name: 'Halk TV',
    category: 'Gündem',
    description: 'Canlı Halk TV izle: Türkiye gündemi, canlı siyaset tartışmaları, son dakika haberleri ve tarafsız yorumlar.',
    highlight: '7/24 Kesintisiz Canlı Yayın',
    streamUrl: 'https://www.youtube.com/watch?v=jHMsvYrf-UA',
    keywords: ['canlı halk tv', 'halk tv canlı izle'],
    badge: 'Aktif Canlı Yayın'
  },
  {
    id: 'tjk-tay-tv',
    name: 'TJK TV & Tay TV',
    category: 'Spor / Yarış',
    description: 'Canlı TJK TV ve Tay TV izle: İstanbul Veliefendi, Ankara, İzmir hipodromu canlı at yarışları ve yarış analizleri.',
    highlight: 'Canlı At Yarışı & Hipodrom',
    keywords: ['canlı tjk tv', 'canlı tay tv', 'tjk tv canlı izle'],
    badge: 'At Yarışı'
  },
  {
    id: 'ictimai-aztv',
    name: 'İctimai TV & AzTV',
    category: 'Azerbaycan',
    description: 'Canlı TV İctimai ve AzTV: Azerbaycan İctimai Televiziyası (İTV) ve AzTV canlı yayın akışı, haberler ve kültür yayınları.',
    highlight: 'Azerbaycan Canlı Yayınları',
    keywords: ['canli tv ictimai', 'canli tv az', 'ictimai tv canli'],
    badge: 'Azerbaycan'
  },
  {
    id: 'ht-spor',
    name: 'HT Spor',
    category: 'Spor',
    description: 'HT Spor canlı izle: Süper Lig, transfer gelişmeleri, maç önü analizleri ve spor bültenleri kesintisiz canlı yayında.',
    highlight: '7/24 Canlı HD Yayın',
    streamUrl: 'https://www.youtube.com/watch?v=gcWaPe_LBMc',
    keywords: ['ht spor canli', 'canlı spor tv izle'],
    badge: 'Aktif Canlı Yayın'
  },
  {
    id: 'a-spor',
    name: 'A Spor',
    category: 'Spor',
    description: 'A Spor canlı izle: Kesintisiz canlı yayın akışı, maç özetleri, transfer haberleri ve tartışma programları.',
    highlight: '7/24 Canlı HD Yayın',
    streamUrl: 'https://www.youtube.com/watch?v=-zSaswVrQ_M',
    keywords: ['a spor canli', 'aspor izle'],
    badge: 'Aktif Canlı Yayın'
  },
  {
    id: 'bein-sports-haber',
    name: 'beIN SPORTS HABER',
    category: 'Spor',
    description: 'beIN SPORTS HABER canlı izle: Şifresiz HD canlı yayın, Trendyol Süper Lig, Avrupa ligleri ve spor analizleri.',
    highlight: 'Şifresiz HD Spor Yayını',
    streamUrl: 'https://www.youtube.com/watch?v=i7UpPgxfZZ8',
    keywords: ['bein sports haber canli izle', 'canlı maç bültenleri'],
    badge: 'Aktif Canlı Yayın'
  }
];

export const LIVE_TV_SEO_FAQS = [
  {
    question: "Tüm kanalları canlı nereden izleyebilirim?",
    answer: "Tüm televizyon kanallarını tek ekranda ve kesintisiz canlı izlemek için VOX Canlı TV sayfası (https://voxozet.com/canli-tv) en kapsamlı ve ücretsiz platformdur. TRT 1, TRT Haber, A Haber, Habertürk, NTV, CNN Türk, Sözcü TV, Halk TV, TV100, NOW TV, Kanal D, ATV, Star TV, Show TV ve TV8 dahil olmak üzere Türkiye'nin tüm ulusal kanallarını resmi yayın kalitesinde reklamsız, donmadan ve mozaik çoklu ekran seçeneğiyle izleyebilirsiniz."
  },
  {
    question: "Canlı TV izle: TRT 1, TV8, Show TV, Star TV, Kanal D ve NOW TV nasıl canlı izlenir?",
    answer: "TRT 1, TV8, Show TV, Star TV, Kanal D ve NOW TV kanallarını VOX Canlı TV sayfası üzerinden kesintisiz, donmadan ve reklamsız izleyebilirsiniz. Platformumuz, resmi yayın akışlarını ve haber bültenlerini tek ekranda toplayarak tarayıcınızdan veya mobil cihazınızdan anında izleme olanağı sunar."
  },
  {
    question: "TV kanalları listesi ve televizyon kanalları ücretsiz nasıl indirilir (Mobil TV)?",
    answer: "VOX Mobil TV uygulamasını telefonunuza veya tabletinize indirmek için uygulama mağazası ücreti ödemeniz gerekmez. Tarayıcınızın 'Ana Ekrana Ekle' seçeneğini kullanarak Progressive Web App (PWA) olarak ücretsiz indirebilir, TV kanalları listesine ve canlı yayın akışlarına tek tıkla ana ekranınızdan erişebilirsiniz."
  },
  {
    question: "Canlı TJK TV ve Tay TV at yarışı yayınları nereden izlenir?",
    answer: "TJK TV ve Tay TV at yarışı canlı yayınları, Türkiye Jokey Kulübü resmi yayınları çerçevesinde İstanbul, Ankara, İzmir, Bursa, Adana ve Şanlıurfa hipodrom koşularını anlık olarak aktarmaktadır. Sayfamızdaki Spor kategorisinden hipodrom yayın detaylarına ulaşabilirsiniz."
  },
  {
    question: "Canlı TV İctimai ve AzTV (Azerbaycan kanalları) yayını var mı?",
    answer: "Evet. Kardeş ülke Azerbaycan'ın önde gelen televizyon kanalları İctimai TV (İTV) ve AzTV'nin güncel yayın bültenleri, Karabağ ve bölge haberleri VOX TV kanalları listesinde yer almaktadır."
  },
  {
    question: "Canlı Halk TV, Sözcü TV ve haber kanalları kesintisiz nasıl izlenir?",
    answer: "Halk TV, Sözcü TV, CNN TÜRK, NTV, Habertürk, TRT Haber, TV100 ve Haber Global kanallarının resmi YouTube canlı yayınları VOX Canlı TV'de 7/24 kesintisiz HD kalitesinde sunulmaktadır. Mozaik ekran modunda aynı anda birden fazla kanalı izleyebilir veya tek kanala odaklanabilirsiniz."
  },
  {
    question: "Canlı TV izlerken donma veya yayın kopması yaşanır mı?",
    answer: "VOX Canlı TV, doğrudan resmi CDN ve YouTube canlı akış altyapılarını entegre ettiği için internet bağlantınıza göre çözünürlüğü otomatik olarak ayarlar (1080p Full HD, 720p, 480p). Bu sayede mobil internette veya düşük hızlarda bile takılmadan akıcı canlı yayın sağlar."
  }
];

export const LIVE_TV_CATEGORIES: LiveTvCategoryInfo[] = [
  {
    id: 'Tümü',
    name: 'Tümü',
    slug: '',
    seoTitle: 'Canlı TV İzle - TV Kanalları Listesi & Mobil TV | VOX',
    seoDescription: 'Canlı tv izle: TRT 1, TV8, Show TV, Star TV, Kanal D, NOW TV, Halk TV, TJK TV ve İctimai TV kanallarını kesintisiz ve ücretsiz izleyin. Güncel tv kanalları listesi ve mobil tv yayını.',
    h1Title: 'Canlı TV İzle - Kesintisiz TV Kanalları Listesi & Mobil TV',
    keywords: TARGET_KEYWORDS_CANLI_TV
  },
  {
    id: 'Spor',
    name: 'Spor',
    slug: 'spor',
    seoTitle: 'Canlı Spor TV İzle - TJK TV, Tay TV, A Spor, HT Spor, beIN Canlı | VOX',
    seoDescription: 'Canlı spor tv izle: Canlı TJK TV, Tay TV at yarışı, HT Spor, A Spor ve beIN SPORTS HABER şifresiz HD canlı yayınlarını tek ekranda donmadan ücretsiz izleyin.',
    h1Title: 'Canlı Spor TV - TJK TV, Tay TV, A Spor, HT Spor Yayınları',
    keywords: [
      'canlı spor izle',
      'canlı tjk tv',
      'canlı tay tv',
      'ht spor canlı',
      'aspor canlı izle',
      'bein sports haber izle',
      'canlı maç bültenleri',
      'şifresiz spor kanalları',
      'canlı tv spor'
    ]
  },
  {
    id: 'Gündem',
    name: 'Gündem',
    slug: 'gundem',
    seoTitle: 'Canlı Haber TV İzle - TRT 1, Halk TV, Sözcü, CNN Türk, NTV Canlı | VOX',
    seoDescription: 'Canlı haber tv izle: Canlı Halk TV, TRT 1, CNN TÜRK, Sözcü TV, NTV, Habertürk ve TV100 canlı yayınlarını tek ekranda kesintisiz ve donmadan takip edin.',
    h1Title: 'Canlı Haber Kanalları - TRT, Halk TV, Sözcü, CNN Türk',
    keywords: [
      'canlı haber izle',
      'canlı halk tv',
      'trt1 canl tv izle',
      'canli tv izle trt',
      'canli tv izle trt1',
      'cnn türk canlı',
      'sözcü tv canlı',
      'ntv canlı',
      'habertürk canlı'
    ]
  },
  {
    id: 'Ekonomi',
    name: 'Ekonomi',
    slug: 'ekonomi',
    seoTitle: 'Canlı Ekonomi TV - Bloomberg HT Canlı Yayınları ve Borsa İzle | VOX',
    seoDescription: 'Bloomberg HT canlı yayını ile Borsa İstanbul, altın, dolar, euro ve küresel finans piyasalarını kesintisiz ve canlı olarak tek ekranda izleyin.',
    h1Title: 'Canlı Ekonomi ve Finans Yayınları',
    keywords: [
      'bloomberg ht canlı',
      'canlı borsa izle',
      'ekonomi kanalları canlı',
      'piyasa haberleri canlı',
      'canlı finans tv'
    ]
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
