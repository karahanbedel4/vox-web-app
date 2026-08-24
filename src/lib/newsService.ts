import { Article } from '../types';
import { appStorage } from './storage';
import { INITIAL_ARTICLES } from '../data/defaultArticles';
import { quotaMonitor } from './quotaMonitor';

export const DEFAULT_VOX_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80';

/**
 * Universal Text Sanitizer: Cleans all HTML entities, tags, URL codes, and artifacts
 */
export function sanitizeNewsText(str: string): string {
  if (!str) return '';
  let text = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  
  // Recursively unescape HTML entities FIRST so all &lt; become <
  for (let k = 0; k < 3; k++) {
    text = text
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // Remove scripts & style tags
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // Strip all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Strip link fragments and attributes
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  text = text.replace(/\b(a\s+href|href|target=|[a-z0-9_-]+\.html)\b[^\s]*/gi, '');
  text = text.replace(/target=["'][^"']*["']/gi, '');
  text = text.replace(/href=["'][^"']*["']/gi, '');

  return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
}

const TOPIC_PHOTOS: Record<string, string[]> = {
  police: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508847154043-be5407f15ad2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1453873531674-2151397a6c5f?w=800&auto=format&fit=crop&q=80'
  ],
  labor: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=80'
  ],
  economy: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80'
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
  ],
  sports: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80'
  ],
  world: [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'
  ],
  health: [
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80'
  ],
  earthquake: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80'
  ],
  auto: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'
  ],
  general: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=800&auto=format&fit=crop&q=80'
  ]
};

/**
 * Enforce HTTPS to prevent Mixed Content blocking on Vercel and secure browsers
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }
  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  return trimmed;
}

export function getTopicContextualImage(title: string = '', category: string = '', index: number = 0): string {
  const t = (title || '').toLowerCase();
  
  if (t.includes('operasyon') || t.includes('gözaltı') || t.includes('polis') || t.includes('mahkeme') || t.includes('suç') || t.includes('örgü') || t.includes('süleymancı') || t.includes('gözaltına')) {
    return TOPIC_PHOTOS.police[index % TOPIC_PHOTOS.police.length];
  }
  if (t.includes('grev') || t.includes('işçi') || t.includes('holding') || t.includes('patron') || t.includes('sendika') || t.includes('fabrika') || t.includes('emekli') || t.includes('maaş')) {
    return TOPIC_PHOTOS.labor[index % TOPIC_PHOTOS.labor.length];
  }
  if (t.includes('ekonomi') || t.includes('dolar') || t.includes('euro') || t.includes('altın') || t.includes('borsa') || t.includes('faiz') || t.includes('enflasyon') || t.includes('zam') || t.includes('banka') || t.includes('tl') || category === 'Ekonomi') {
    return TOPIC_PHOTOS.economy[index % TOPIC_PHOTOS.economy.length];
  }
  if (t.includes('teknoloji') || t.includes('yapay zeka') || t.includes('ai') || t.includes('telefon') || t.includes('apple') || t.includes('samsung') || t.includes('google') || t.includes('yazılım') || t.includes('siber') || category === 'Teknoloji') {
    return TOPIC_PHOTOS.tech[index % TOPIC_PHOTOS.tech.length];
  }
  if (t.includes('spor') || t.includes('futbol') || t.includes('transfer') || t.includes('fenerbahçe') || t.includes('galatasaray') || t.includes('beşiktaş') || t.includes('trabzonspor') || t.includes('maç') || t.includes('gol') || category === 'Spor') {
    return TOPIC_PHOTOS.sports[index % TOPIC_PHOTOS.sports.length];
  }
  if (t.includes('dünya') || t.includes('savaş') || t.includes('abd') || t.includes('rusya') || t.includes('ukrayna') || t.includes('israil') || t.includes('gazze') || t.includes('seçim') || t.includes('lider') || category === 'Dünya') {
    return TOPIC_PHOTOS.world[index % TOPIC_PHOTOS.world.length];
  }
  if (t.includes('sağlık') || t.includes('virüs') || t.includes('doktor') || t.includes('hastane') || t.includes('ilaç') || t.includes('aşı') || category === 'Sağlık') {
    return TOPIC_PHOTOS.health[index % TOPIC_PHOTOS.health.length];
  }
  if (t.includes('deprem') || t.includes('afet') || t.includes('yangın') || t.includes('sel')) {
    return TOPIC_PHOTOS.earthquake[index % TOPIC_PHOTOS.earthquake.length];
  }
  if (t.includes('otomobil') || t.includes('araba') || t.includes('togg') || t.includes('tesla')) {
    return TOPIC_PHOTOS.auto[index % TOPIC_PHOTOS.auto.length];
  }

  return TOPIC_PHOTOS.general[index % TOPIC_PHOTOS.general.length] || DEFAULT_VOX_FALLBACK_IMAGE;
}

const TOPIC_MAP: Record<string, string> = {
  'Teknoloji': 'TECHNOLOGY',
  'Ekonomi': 'BUSINESS',
  'Spor': 'SPORTS',
  'Dünya': 'WORLD',
  'Sağlık': 'HEALTH',
  'Gündem': 'NATION'
};

const CATEGORY_DIRECT_RSS: Record<string, string[]> = {
  'Gündem': [
    'https://www.ensonhaber.com/rss/manset.xml',
    'https://www.ensonhaber.com/rss/gundem.xml',
    'https://www.trthaber.com/sondakika_articles.rss',
    'https://www.trthaber.com/gundem_articles.rss',
    'https://www.haberturk.com/rss/manset.xml',
    'https://www.ntv.com.tr/gundem.rss',
    'https://www.sozcu.com.tr/rss/gundem.xml',
    'https://feeds.bbci.co.uk/turkce/rss.xml'
  ],
  'Teknoloji': [
    'https://www.webtekno.com/rss.xml',
    'https://www.donanimhaber.com/rss/tum/',
    'https://www.ensonhaber.com/rss/teknoloji.xml',
    'https://www.haberturk.com/rss/kategori/teknoloji.xml',
    'https://www.ntv.com.tr/teknoloji.rss'
  ],
  'Ekonomi': [
    'https://www.bloomberght.com/rss',
    'https://www.ensonhaber.com/rss/ekonomi.xml',
    'https://www.haberturk.com/rss/kategori/ekonomi.xml',
    'https://www.ntv.com.tr/ekonomi.rss',
    'https://www.sozcu.com.tr/rss/ekonomi.xml'
  ],
  'Spor': [
    'https://www.ensonhaber.com/rss/kralspor.xml',
    'https://www.trthaber.com/spor_articles.rss',
    'https://www.haberturk.com/rss/kategori/spor.xml',
    'https://www.ntvspor.net/rss/haber',
    'https://www.fanatik.com.tr/rss/futbol',
    'https://www.sozcu.com.tr/rss/spor.xml'
  ],
  'Dünya': [
    'https://feeds.bbci.co.uk/turkce/rss.xml',
    'https://rss.dw.com/rdf/rss-tur-all',
    'https://www.trthaber.com/dunya_articles.rss',
    'https://www.ensonhaber.com/rss/dunya.xml',
    'https://www.ntv.com.tr/dunya.rss'
  ],
  'Sağlık': [
    'https://www.ensonhaber.com/rss/saglik.xml',
    'https://www.ntv.com.tr/saglik.rss',
    'https://www.haberturk.com/rss/kategori/saglik.xml'
  ],
  'Tümü': [
    'https://www.ensonhaber.com/rss/manset.xml',
    'https://www.trthaber.com/sondakika_articles.rss',
    'https://www.webtekno.com/rss.xml',
    'https://www.bloomberght.com/rss',
    'https://www.ensonhaber.com/rss/kralspor.xml',
    'https://www.ntv.com.tr/teknoloji.rss'
  ]
};

/**
 * Decode common HTML entities into clean text
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert HTML to clean plain text with spaces between tags so words don't stick
 */
function htmlToPlainText(htmlStr: string): string {
  if (!htmlStr) return '';
  let formatted = htmlStr
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, ' • ')
    .replace(/<\/ol>/gi, '\n\n')
    .replace(/<\/ul>/gi, '\n\n')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ');

  // Strip all remaining HTML tags
  formatted = formatted.replace(/<[^>]*>?/gm, '');

  // Decode HTML entities
  formatted = decodeHtmlEntities(formatted);

  // Clean up whitespace
  return formatted
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Cleanly parse RSS / Google News item into structured Article
 */
function parseGoogleNewsItem(item: any, defaultCategory: string = 'Gündem', index: number = 0): Article {
  const rawTitle = item.title || 'Haber Başlığı';
  
  // Extract clean title and author from "Title - Source" pattern
  let cleanTitle = rawTitle;
  let extractedAuthor = item.author || item.source || 'VOX Haber';

  if (rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    if (parts.length > 1) {
      extractedAuthor = parts.pop()?.trim() || extractedAuthor;
      cleanTitle = parts.join(' - ').trim();
    }
  }

  const rawHtml = item.description || item.content || item['content:encoded'] || item.summary || '';

  // 1. AGGRESSIVE IMAGE EXTRACTION
  let extractedImage = '';

  // Check direct thumbnail/image properties
  if (item.thumbnail && typeof item.thumbnail === 'string') {
    extractedImage = sanitizeImageUrl(item.thumbnail);
  } else if (item.image && typeof item.image === 'string') {
    extractedImage = sanitizeImageUrl(item.image);
  } else if (item.imageUrl && typeof item.imageUrl === 'string') {
    extractedImage = sanitizeImageUrl(item.imageUrl);
  }
  
  // Check enclosure
  if (!extractedImage && item.enclosure) {
    if (typeof item.enclosure === 'string') {
      extractedImage = sanitizeImageUrl(item.enclosure);
    } else if (item.enclosure.url && typeof item.enclosure.url === 'string') {
      extractedImage = sanitizeImageUrl(item.enclosure.url);
    } else if (item.enclosure.link && typeof item.enclosure.link === 'string') {
      extractedImage = sanitizeImageUrl(item.enclosure.link);
    }
  }

  // Check media:content and mediaContent
  if (!extractedImage && (item['media:content'] || item.mediaContent || item.media)) {
    const mc = item['media:content'] || item.mediaContent || item.media;
    if (typeof mc === 'string') {
      extractedImage = sanitizeImageUrl(mc);
    } else if (mc?.url && typeof mc.url === 'string') {
      extractedImage = sanitizeImageUrl(mc.url);
    } else if (Array.isArray(mc) && mc[0]?.url) {
      extractedImage = sanitizeImageUrl(mc[0].url);
    } else if (mc?.['$']?.url) {
      extractedImage = sanitizeImageUrl(mc['$'].url);
    }
  }

  // Check media:thumbnail and mediaThumbnail
  if (!extractedImage && (item['media:thumbnail'] || item.mediaThumbnail)) {
    const mt = item['media:thumbnail'] || item.mediaThumbnail;
    if (typeof mt === 'string') {
      extractedImage = sanitizeImageUrl(mt);
    } else if (mt?.url && typeof mt.url === 'string') {
      extractedImage = sanitizeImageUrl(mt.url);
    } else if (Array.isArray(mt) && mt[0]?.url) {
      extractedImage = sanitizeImageUrl(mt[0].url);
    } else if (mt?.['$']?.url) {
      extractedImage = sanitizeImageUrl(mt['$'].url);
    }
  }

  // Check content, content:encoded, and description HTML bodies with regex
  const htmlCandidates = [
    item['content:encoded'],
    item.content,
    item.description,
    item.summary
  ].filter(Boolean);

  if (!extractedImage && htmlCandidates.length > 0) {
    for (const htmlBlock of htmlCandidates) {
      if (typeof htmlBlock !== 'string') continue;
      
      // Standard <img src="...">
      const imgMatches = htmlBlock.match(/<img[^>]+src=["']([^"']+)["']/gi);
      if (imgMatches) {
        for (const tag of imgMatches) {
          const srcMatch = tag.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const url = sanitizeImageUrl(srcMatch[1]);
            if (url.startsWith('https') && !url.includes('cleardot') && !url.includes('1x1') && !url.includes('pixel') && !url.includes('favicon') && !url.includes('rss2json')) {
              extractedImage = url;
              break;
            }
          }
        }
      }
      if (extractedImage) break;

      // Encoded &lt;img src=&quot;...&quot;
      const encodedImgMatches = htmlBlock.match(/&lt;img[^&]+src=(?:&quot;|"|')([^&"']+)(?:&quot;|"|')/gi);
      if (encodedImgMatches) {
        for (const tag of encodedImgMatches) {
          const srcMatch = tag.match(/src=(?:&quot;|"|')([^&"']+)(?:&quot;|"|')/i);
          if (srcMatch && srcMatch[1]) {
            const url = sanitizeImageUrl(srcMatch[1]);
            if (url.startsWith('https') && !url.includes('cleardot') && !url.includes('1x1') && !url.includes('pixel') && !url.includes('favicon')) {
              extractedImage = url;
              break;
            }
          }
        }
      }
      if (extractedImage) break;
    }
  }

  // Ensure any found image is HTTPS upgraded
  if (extractedImage) {
    extractedImage = sanitizeImageUrl(extractedImage);
  }

  // If still no direct photo or invalid, assign smart contextual photography based on title keywords & category!
  if (!extractedImage || typeof extractedImage !== 'string' || !extractedImage.startsWith('http')) {
    extractedImage = getTopicContextualImage(cleanTitle, item.category || defaultCategory, index);
  }

  // 2. EXTRACT BULLET POINTS (keyPoints)
  const keyPoints: string[] = [];
  if (rawHtml.includes('<li') || rawHtml.includes('<ol')) {
    const liMatches = rawHtml.match(/<li[^>]*>(.*?)<\/li>/gis);
    if (liMatches && liMatches.length > 0) {
      liMatches.forEach((liTag: string) => {
        let cleanLi = liTag.replace(/<[^>]*>?/gm, '');
        cleanLi = decodeHtmlEntities(cleanLi);
        cleanLi = cleanLi.replace(/&nbsp;.*$/, '').replace(/ - [^-]+$/, '').trim();
        if (cleanLi && cleanLi.length > 5 && !keyPoints.includes(cleanLi)) {
          keyPoints.push(cleanLi);
        }
      });
    }
  }

  // 3. CLEAN PLAIN TEXT
  let cleanPlainText = sanitizeNewsText(htmlToPlainText(rawHtml));

  // 4. GENERATE CLEAN SINGLE-PARAGRAPH 1-2 SENTENCE AI SUMMARY
  let aiSummary = '';
  let textForSummary = cleanPlainText;
  if (textForSummary.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
    textForSummary = textForSummary.substring(cleanTitle.length).trim();
  }

  const sentences = textForSummary.match(/[^.!?]+[.!?]+/g) || [];
  const validSentences: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sanitizeNewsText(sentence.trim());
    if (trimmed.length > 15 && !trimmed.toLowerCase().includes('google haberler')) {
      validSentences.push(trimmed);
      if (validSentences.length >= 2) break;
    }
  }

  if (validSentences.length > 0) {
    aiSummary = validSentences.join(' ');
  } else {
    aiSummary = `${cleanTitle}. ${extractedAuthor} tarafından aktarılan en son gelişmeler ve detaylar.`;
  }

  if (aiSummary.length > 200) {
    aiSummary = aiSummary.substring(0, 195).trim() + '...';
  }

  aiSummary = sanitizeNewsText(aiSummary);

  // 5. ENSURE RICH MULTI-PARAGRAPH EDITORIAL CONTENT (AdSense / Reader Compliance)
  let fullContent = cleanPlainText;
  if (!fullContent || fullContent.length < 160) {
    const p1 = `${cleanTitle}. ${extractedAuthor} tarafından aktarılan son bilgilere göre sahadaki gelişmeler yakından takip ediliyor.`;
    const p2 = aiSummary && aiSummary !== cleanTitle ? aiSummary : `Konuyla ilgili resmi birimler ve yetkili makamlar tarafından yapılan ilk değerlendirmelere göre süreç titizlikle yürütülüyor.`;
    const p3 = `Gelişmeler kamuoyu ve ilgili sektör temsilcileri tarafından dikkatle izlenirken, sürecin etkileri ${extractedAuthor} ve VOX Odak Haber bültenleri üzerinden anlık olarak aktarılmaya devam edecek.`;
    fullContent = `${p1}\n\n${p2}\n\n${p3}`;
  }

  const finalKeyPoints = (keyPoints.length >= 3) ? keyPoints : [
    cleanTitle,
    `${extractedAuthor} kaynağından aktarılan son veriler değerlendirildi`,
    'Resmi açıklamalar ve sahadaki gelişmeler doğrultusunda süreç takip ediliyor'
  ];

  return {
    id: item.id || `news-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    title: sanitizeNewsText(cleanTitle),
    summary: aiSummary,
    content: fullContent,
    rawHtml: rawHtml,
    category: item.category || defaultCategory,
    author: sanitizeNewsText(extractedAuthor),
    imageUrl: extractedImage,
    durationSeconds: item.durationSeconds || 180,
    sourceType: 'rss',
    sourceUrl: item.url || item.link,
    createdAt: item.createdAt || item.pubDate || new Date().toISOString(),
    keyPoints: finalKeyPoints.map(k => sanitizeNewsText(k))
  };
}

/**
 * Target Twitter Accounts for Zero-Cost Real-Time RSS Stream
 */
export interface TargetTwitterAccount {
  handle: string;
  username: string;
  category: string;
  name: string;
}

export const TARGET_TWITTER_ACCOUNTS: TargetTwitterAccount[] = [
  {
    handle: '@ozetgechaber',
    username: 'ozetgechaber',
    category: 'Teknoloji',
    name: 'Özet Geç Haber'
  },
  {
    handle: '@ConflictTR',
    username: 'ConflictTR',
    category: 'Gündem',
    name: 'Conflict TR'
  },
  {
    handle: '@vaziyetcomtr',
    username: 'vaziyetcomtr',
    category: 'Ekonomi',
    name: 'Vaziyet'
  }
];

// Anti-Ban Cache Configuration (5 minutes = 300 seconds = 300,000 ms)
const TWITTER_CACHE_KEY = 'vox_twitter_feed_cache_v2';
const TWITTER_CACHE_TTL_MS = 5 * 60 * 1000;

let inMemoryTwitterCache: { timestamp: number; articles: Article[] } | null = null;

/**
 * Clean tweet text by removing raw t.co links, HTML tags, trailing hashtags, and messy symbols
 */
export function cleanTweetText(rawText: string): { cleanTitle: string; cleanSummary: string; cleanContent: string } {
  if (!rawText) {
    return { cleanTitle: '', cleanSummary: '', cleanContent: '' };
  }

  let text = rawText
    // Remove HTML tags
    .replace(/<[^>]+>/gi, ' ')
    // Remove t.co and generic URLs
    .replace(/https?:\/\/t\.co\/[a-zA-Z0-9_-]+/gi, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/pic\.twitter\.com\/[a-zA-Z0-9_-]+/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences for title and body
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let cleanTitle = sentences[0] || text;
  
  // Clean prefix like "SON DAKİKA:", "ÖZET:", "GELİŞME:"
  cleanTitle = cleanTitle.replace(/^\[.*?\]\s*/, '').trim();
  if (cleanTitle.length > 110) {
    cleanTitle = cleanTitle.substring(0, 107) + '...';
  }

  const cleanSummary = text;
  const cleanContent = `${text}\n\nBu anlık bilgilendirme ve sıcak gelişme, VOX Akıllı Akış motoru ile Twitter (𝕏) üzerinden canlı olarak aktarılmıştır.`;

  return { cleanTitle, cleanSummary, cleanContent };
}

/**
 * Parse Twitter RSS XML using the browser's built-in DOMParser
 */
function parseTwitterXmlWithDOM(xmlString: string, account: TargetTwitterAccount): Article[] {
  if (!xmlString || typeof xmlString !== 'string') return [];
  const articles: Article[] = [];

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return [];
    }

    const items = xmlDoc.querySelectorAll('item');
    items.forEach((item, index) => {
      const titleElem = item.querySelector('title');
      const descElem = item.querySelector('description');
      const pubDateElem = item.querySelector('pubDate') || item.querySelector('dc\\:date');
      const linkElem = item.querySelector('link') || item.querySelector('guid');

      const rawTitle = titleElem?.textContent || '';
      const rawDesc = descElem?.textContent || '';
      const rawPubDate = pubDateElem?.textContent || '';
      const link = linkElem?.textContent?.trim() || `https://x.com/${account.username}`;

      // Extract image:
      // 1. media:content or media:thumbnail
      let mediaUrl = '';
      const mediaContent = item.getElementsByTagName('media:content')[0] || item.getElementsByTagName('media:thumbnail')[0];
      if (mediaContent) {
        mediaUrl = mediaContent.getAttribute('url') || '';
      }
      // 2. enclosure
      if (!mediaUrl) {
        const enclosure = item.querySelector('enclosure');
        if (enclosure && (enclosure.getAttribute('type')?.includes('image') || enclosure.getAttribute('url')?.match(/\.(jpeg|jpg|png|webp|gif)/i))) {
          mediaUrl = enclosure.getAttribute('url') || '';
        }
      }
      // 3. <img> tag in raw description
      if (!mediaUrl && rawDesc.includes('<img')) {
        const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          mediaUrl = imgMatch[1];
        }
      }

      // Combine text to get complete narrative
      const combinedRaw = rawDesc && rawDesc.length > rawTitle.length ? rawDesc : (rawTitle || rawDesc);
      const { cleanTitle, cleanSummary, cleanContent } = cleanTweetText(combinedRaw);

      if (cleanSummary && cleanSummary.length > 5) {
        let pubDateISO = new Date().toISOString();
        if (rawPubDate) {
          try {
            const parsedD = new Date(rawPubDate);
            if (!isNaN(parsedD.getTime())) {
              pubDateISO = parsedD.toISOString();
            }
          } catch (e) {}
        }

        const id = `tweet_${account.username}_${index}_${pubDateISO.replace(/[^0-9]/g, '')}`;

        articles.push({
          id,
          title: cleanTitle,
          summary: cleanSummary,
          content: cleanContent,
          category: account.category,
          author: account.name || account.handle,
          sourceType: 'twitter' as const,
          sourceUrl: link.startsWith('http') ? link : `https://x.com/${account.username}`,
          imageUrl: mediaUrl ? sanitizeImageUrl(mediaUrl) : (getTopicContextualImage(cleanTitle, account.category, index) || DEFAULT_VOX_FALLBACK_IMAGE),
          durationSeconds: Math.max(60, Math.min(180, Math.round(cleanSummary.length * 0.4))),
          createdAt: pubDateISO,
          keyPoints: [
            cleanTitle,
            `Kaynak: 𝕏 ${account.name} (${account.handle})`,
            `Kategori: ${account.category}`,
            'Canlı Twitter (𝕏) Akışı'
          ]
        });
      }
    });
  } catch (err) {
    console.warn(`DOMParser error for ${account.handle}:`, err);
  }

  return articles;
}

/**
 * First-Party Feed Fetcher (/api/fetch-feed)
 * Securely proxies any external RSS/XML feed through our own server, bypassing CORS and avoiding 3rd-party proxy blocks.
 */
export async function fetchRemoteFeedXml(url: string, timeoutMs: number = 8000): Promise<string | null> {
  if (!url) return null;
  try {
    const safeUrl = `/api/fetch-feed?url=${encodeURIComponent(url)}&_t=${Date.now()}`;
    const res = await fetch(safeUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
    });
    if (res.ok) {
      const text = await res.text();
      // Ensure we didn't receive index.html SPA fallback
      if (text && (text.includes('<rss') || text.includes('<feed') || text.includes('<?xml'))) {
        return text;
      }
    }
  } catch (err) {
    console.warn(`fetchRemoteFeedXml error for ${url}:`, err);
  }
  return null;
}

/**
 * Universal Client-Side Real-Time RSS Fetcher
 * Used when server API is unavailable or on static CDN deployments (e.g. Vercel SPA)
 */
export async function fetchClientSideRssFeeds(category: string = 'Gündem'): Promise<Article[]> {
  const targetCategory = category === 'Tümü' ? 'Gündem' : category;
  const articles: Article[] = [];

  // Google News & Direct Turkish Outlets by Topic
  const feeds: { url: string; source: string; category: string }[] = [];

  if (targetCategory === 'Teknoloji') {
    feeds.push(
      { url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Teknoloji', category: 'Teknoloji' },
      { url: 'https://www.webtekno.com/rss.xml', source: 'Webtekno', category: 'Teknoloji' },
      { url: 'https://shiftdelete.net/feed', source: 'ShiftDelete', category: 'Teknoloji' },
      { url: 'https://www.ntv.com.tr/teknoloji.rss', source: 'NTV Teknoloji', category: 'Teknoloji' }
    );
  } else if (targetCategory === 'Ekonomi') {
    feeds.push(
      { url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Ekonomi', category: 'Ekonomi' },
      { url: 'https://www.bloomberght.com/rss', source: 'Bloomberg HT', category: 'Ekonomi' },
      { url: 'https://www.ntv.com.tr/ekonomi.rss', source: 'NTV Ekonomi', category: 'Ekonomi' }
    );
  } else if (targetCategory === 'Spor') {
    feeds.push(
      { url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Spor', category: 'Spor' },
      { url: 'https://www.ntvspor.net/rss/haber', source: 'NTV Spor', category: 'Spor' },
      { url: 'https://www.fanatik.com.tr/rss/futbol', source: 'Fanatik', category: 'Spor' }
    );
  } else if (targetCategory === 'Dünya') {
    feeds.push(
      { url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Dünya', category: 'Dünya' },
      { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', source: 'BBC Türkçe', category: 'Dünya' },
      { url: 'https://www.ntv.com.tr/dunya.rss', source: 'NTV Dünya', category: 'Dünya' }
    );
  } else if (targetCategory === 'Sağlık') {
    feeds.push(
      { url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Sağlık', category: 'Sağlık' },
      { url: 'https://www.ntv.com.tr/saglik.rss', source: 'NTV Sağlık', category: 'Sağlık' }
    );
  } else {
    // Gündem / Genel
    feeds.push(
      { url: 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr', source: 'Google Haberler Türkiye', category: 'Gündem' },
      { url: 'https://www.trthaber.com/sondakika_articles.rss', source: 'TRT Haber', category: 'Gündem' },
      { url: 'https://www.ntv.com.tr/gundem.rss', source: 'NTV Gündem', category: 'Gündem' },
      { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', source: 'BBC Türkçe', category: 'Gündem' }
    );
  }

  const fetchSingleFeed = async (feedItem: { url: string; source: string; category: string }) => {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedItem.url)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(feedItem.url)}`,
      feedItem.url
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
        });
        if (res.ok) {
          const xml = await res.text();
          if (xml && (xml.includes('<item') || xml.includes('<entry') || xml.includes('<rss') || xml.includes('<feed'))) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            const items = xmlDoc.querySelectorAll('item, entry');

            const feedArticles: Article[] = [];
            items.forEach((itemNode, idx) => {
              if (feedArticles.length >= 15) return;
              const title = itemNode.querySelector('title')?.textContent?.trim() || '';
              const desc = itemNode.querySelector('description, summary, content')?.textContent?.trim() || '';
              const link = itemNode.querySelector('link')?.textContent?.trim() || itemNode.querySelector('link')?.getAttribute('href') || '';
              const pubDate = itemNode.querySelector('pubDate, updated, published')?.textContent?.trim() || new Date().toISOString();
              
              // Extract real image from XML DOM
              let extractedImg = '';
              const enc = itemNode.querySelector('enclosure');
              if (enc && enc.getAttribute('url') && !enc.getAttribute('url')?.endsWith('.mp3')) {
                extractedImg = enc.getAttribute('url') || '';
              }
              if (!extractedImg) {
                const media = itemNode.getElementsByTagName('media:content')[0] || itemNode.getElementsByTagName('media:thumbnail')[0];
                if (media && media.getAttribute('url')) {
                  extractedImg = media.getAttribute('url') || '';
                }
              }
              if (!extractedImg) {
                const imgTag = itemNode.querySelector('image url') || itemNode.querySelector('image');
                if (imgTag && imgTag.textContent?.startsWith('http')) {
                  extractedImg = imgTag.textContent.trim();
                }
              }

              if (title && title.length > 5) {
                const cleanItem = parseGoogleNewsItem(
                  {
                    id: `live_${feedItem.category.toLowerCase()}_${idx}_${Date.now()}`,
                    title,
                    description: desc,
                    url: link,
                    pubDate,
                    category: feedItem.category,
                    author: feedItem.source,
                    imageUrl: extractedImg
                  },
                  feedItem.category,
                  idx
                );
                feedArticles.push(cleanItem);
              }
            });

            if (feedArticles.length > 0) {
              return feedArticles;
            }
          }
        }
      } catch (e) {
        // Try next proxy
      }
    }
    return [];
  };

  try {
    const results = await Promise.allSettled(feeds.map(f => fetchSingleFeed(f)));
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        articles.push(...res.value);
      }
    });
  } catch (e) {
    console.warn('fetchClientSideRssFeeds notice:', e);
  }

  return articles;
}

/**
 * Real-time Zero-Cost Twitter (X) Fetcher using internal VOX API (/api/tweets)
 */
export async function fetchRealTweets(category?: string, forceRefresh = false): Promise<Article[]> {
  const now = Date.now();

  // 1. In-memory / Storage Cache Check (5-minute TTL)
  if (!forceRefresh) {
    // A. Check in-memory cache first
    if (inMemoryTwitterCache && (now - inMemoryTwitterCache.timestamp < TWITTER_CACHE_TTL_MS)) {
      const cached = inMemoryTwitterCache.articles;
      if (cached && cached.length > 0) {
        if (category && category !== 'Tümü') {
          return cached.filter(t => t.category.toLowerCase() === category.toLowerCase());
        }
        return cached;
      }
    }

    // B. Check persistent localStorage cache
    try {
      const stored = appStorage.getItemSync(TWITTER_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.timestamp &&
          (now - parsed.timestamp < TWITTER_CACHE_TTL_MS) &&
          Array.isArray(parsed.articles) &&
          parsed.articles.length > 0
        ) {
          inMemoryTwitterCache = parsed;
          if (category && category !== 'Tümü') {
            return parsed.articles.filter((t: Article) => t.category.toLowerCase() === category.toLowerCase());
          }
          return parsed.articles;
        }
      }
    } catch (e) {}
  }

  // 2. Fetch fresh real tweets using VOX internal /api/tweets endpoint
  const fetchedArticles: Article[] = [];

  try {
    const res = await fetch(`/api/tweets?_t=${now}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.tweets || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((item: any) => {
          const { cleanTitle, cleanSummary, cleanContent } = cleanTweetText(item.content || item.summary || item.text || item.title);
          return {
            id: item.id || `tweet_${item.author || 'vox'}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: item.title || cleanTitle,
            summary: cleanSummary,
            content: cleanContent,
            category: item.category || 'Gündem',
            author: item.author || 'VOX Haber',
            sourceType: 'twitter' as const,
            sourceUrl: item.sourceUrl || 'https://x.com',
            imageUrl: item.imageUrl || getTopicContextualImage(item.title || cleanTitle, item.category) || DEFAULT_VOX_FALLBACK_IMAGE,
            durationSeconds: item.durationSeconds || 90,
            createdAt: item.createdAt || new Date().toISOString(),
            keyPoints: [cleanTitle, `Kaynak: 𝕏 ${item.author || 'VOX'}`, `Kategori: ${item.category || 'Gündem'}`]
          };
        });
        fetchedArticles.push(...mapped);
      }
    }
  } catch (err) {
    console.warn('fetchRealTweets internal API notice:', err);
  }

  // 3. Process fetched results and update Cache
  if (fetchedArticles.length > 0) {
    // Sort strictly newest first
    fetchedArticles.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const cachePayload = { timestamp: now, articles: fetchedArticles };
    inMemoryTwitterCache = cachePayload;
    try {
      appStorage.setItemSync(TWITTER_CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {}

    if (category && category !== 'Tümü') {
      return fetchedArticles.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    return fetchedArticles;
  }

  // Fallback to previous cache if temporary network outage
  try {
    const stored = appStorage.getItemSync(TWITTER_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.articles) && parsed.articles.length > 0) {
        if (category && category !== 'Tümü') {
          return parsed.articles.filter((t: Article) => t.category.toLowerCase() === category.toLowerCase());
        }
        return parsed.articles;
      }
    }
  } catch (e) {}

  return [];
}

/**
 * Fetch Twitter News wrapper (calls fetchRealTweets)
 */
export async function fetchTwitterNews(category?: string): Promise<Article[]> {
  return fetchRealTweets(category, false);
}

/**
 * Fetch dynamic Turkish news by category with ultra-fast server-side background cache and robust client fallback
 */
export async function fetchNewsByCategory(category: string = 'Tümü', lang: string = 'tr', limit: number = 80): Promise<Article[]> {
  const targetCategory = category === 'Tümü' ? 'Gündem' : category;
  const articles: Article[] = [];

  // 1. Fetch from high-speed local VOX /api/news endpoint (0ms in-memory cache)
  try {
    const queryParam = category && category !== 'Tümü' 
      ? `?category=${encodeURIComponent(category)}&lang=${lang}&limit=${limit}&_t=${Date.now()}` 
      : `?lang=${lang}&limit=${limit}&_t=${Date.now()}`;
    const res = await fetch(`/api/news${queryParam}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      const articlesList = Array.isArray(data) ? data : (data.articles || data.data || []);
      
      if (Array.isArray(articlesList) && articlesList.length > 0) {
        const parsed = articlesList.map((item: any, idx: number) => {
          if (item.id && item.title && item.content) {
            const rawImg = item.imageUrl || item.image || item.thumbnail;
            return {
              ...item,
              imageUrl: sanitizeImageUrl(rawImg) || getTopicContextualImage(item.title, item.category || targetCategory, idx)
            };
          }
          return parseGoogleNewsItem(item, targetCategory, idx);
        });
        articles.push(...parsed);
      }
    }
  } catch (err) {
    console.warn('/api/news fetch notice:', err);
  }

  // 2. Fetch Twitter Feed from @ozetgechaber, @ConflictTR, @vaziyetcomtr via internal /api/tweets
  let twitterArticles: Article[] = [];
  try {
    twitterArticles = await fetchTwitterNews(category);
  } catch (e) {
    twitterArticles = [];
  }

  // 3. Robust Client-Side RSS Fetcher (Google News + National Outlets) if /api/news returned empty
  if (articles.length === 0) {
    try {
      const liveRssItems = await fetchClientSideRssFeeds(targetCategory);
      if (Array.isArray(liveRssItems) && liveRssItems.length > 0) {
        articles.push(...liveRssItems);
      }
    } catch (e) {
      console.warn('Live client-side RSS fallback notice:', e);
    }
  }

  // 4. Secondary Proxy Fallback if still empty
  if (articles.length === 0) {
    try {
      const feedUrl = category === 'Teknoloji' 
        ? 'https://www.donanimhaber.com/rss/tum/' 
        : category === 'Ekonomi'
        ? 'https://www.bloomberght.com/rss'
        : 'https://www.trthaber.com/sondakika_articles.rss';
      const xml = await fetchRemoteFeedXml(feedUrl, 4000);
      if (xml) {
        const itemRegex = /<item[\s\S]*?<\/item>/gi;
        const matches = xml.match(itemRegex) || [];
        matches.slice(0, 15).forEach((itemXml, i) => {
          const tMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const dMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
          const lMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
          const rawT = tMatch ? tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';
          const rawD = dMatch ? dMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';
          if (rawT && rawT.length > 5) {
            articles.push({
              id: `feed_${targetCategory.toLowerCase()}_${Date.now()}_${i}`,
              title: rawT,
              summary: rawD || `${rawT} hakkında sıcak gelişmeler.`,
              content: `${rawT}.\n\n${rawD || ''}\n\nDetaylar VOX Akıllı Haber Akışı tarafından güncellenmektedir.`,
              category: targetCategory,
              author: 'VOX Canlı Haber',
              imageUrl: getTopicContextualImage(rawT, targetCategory, i),
              durationSeconds: 150,
              createdAt: new Date().toISOString(),
              sourceType: 'rss',
              sourceUrl: lMatch ? lMatch[1].trim() : 'https://trthaber.com'
            });
          }
        });
      }
    } catch (e) {
      console.warn('Secondary feed fallback notice:', e);
    }
  }

  // 5. Final fallback to curated initial articles if all network attempts fail
  if (articles.length === 0 && twitterArticles.length === 0) {
    const defaults = (INITIAL_ARTICLES || []).filter(
      a => !category || category === 'Tümü' || a.category.toLowerCase() === category.toLowerCase()
    );
    return defaults;
  }

  // 6. Aggregate Web RSS articles + Twitter articles into one single array
  const allCombined = [...twitterArticles, ...articles];

  // Deduplicate by title
  const uniqueMap = new Map<string, Article>();
  allCombined.forEach(a => {
    if (a.title && !uniqueMap.has(a.title.toLowerCase().trim())) {
      uniqueMap.set(a.title.toLowerCase().trim(), a);
    }
  });

  // Sort strictly chronologically (newest first)
  const sortedArticles = Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return sortedArticles;
}

/**
 * Lightweight checker for new live articles arriving in background
 */
export async function checkNewNewsUpdates(category: string = 'Tümü', sinceTimestamp: string): Promise<{ hasNew: boolean; count: number; latestCreatedAt: string; latestArticle?: Article }> {
  if (!sinceTimestamp) return { hasNew: false, count: 0, latestCreatedAt: '' };
  try {
    const res = await fetch(`/api/news/check-new?category=${encodeURIComponent(category)}&since=${encodeURIComponent(sinceTimestamp)}&_t=${Date.now()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return { hasNew: false, count: 0, latestCreatedAt: '' };
}

/**
 * Generate SEO-friendly slug ending with -voxozet
 */
export function generateArticleSlug(title: string, id: string = ''): string {
  const clean = (title || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);

  const idHash = id ? id.replace(/[^a-z0-9]/gi, '').slice(-5) : '';
  const suffix = idHash ? `${idHash}-voxozet` : 'voxozet';
  return `${clean}-${suffix}`;
}

/**
 * Returns canonical SEO URL path for an article
 */
export function getArticleUrl(article: Article): string {
  const slug = generateArticleSlug(article.title, article.id);
  return `/haber/${slug}`;
}

/**
 * Request server-side AI enrichment with Gemini (summary, 3-4 paragraphs, key points, high-res image)
 */
export async function enrichArticleWithAI(article: Article): Promise<Article> {
  if (!article || !article.title) return article;

  // If already enriched with rich multi-paragraph text and clean keypoints
  if (
    article.content && 
    article.content.length > 250 && 
    article.content.includes('\n\n') && 
    article.keyPoints && 
    article.keyPoints.length >= 3 && 
    !article.keyPoints.some(k => k.includes('Canlı Akış') || k.includes('Kategori:'))
  ) {
    return article;
  }

  try {
    const res = await fetch('/api/news/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.article) {
        return data.article;
      }
    }
  } catch (e) {
    console.warn('AI enrichment fetch notice:', e);
  }

  return article;
}

/**
 * Fetch a single article by ID or slug from server API
 */
export async function fetchArticleByIdOrSlug(idOrSlug: string): Promise<Article | null> {
  if (!idOrSlug) return null;
  try {
    const res = await fetch(`/api/news/article/${encodeURIComponent(idOrSlug)}?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.article) {
        return data.article;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Search News directly using internal VOX /api/news/search endpoint or local fallback
 */
export async function searchGoogleNews(query: string): Promise<Article[]> {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();

  try {
    const res = await fetch(`/api/news/search?q=${encodeURIComponent(cleanQuery)}&_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const articlesList = Array.isArray(data) ? data : (data.articles || data.data || []);
      if (Array.isArray(articlesList) && articlesList.length > 0) {
        return articlesList.map((item: any, idx: number) => {
          if (item.id && item.title && item.content) {
            const rawImg = item.imageUrl || item.image || item.thumbnail;
            return {
              ...item,
              imageUrl: sanitizeImageUrl(rawImg) || getTopicContextualImage(item.title, item.category || 'Arama', idx)
            };
          }
          return parseGoogleNewsItem(item, 'Arama', idx);
        });
      }
    }
  } catch (err) {
    console.warn('/api/news/search notice:', err);
  }

  // Client-side fallback
  return (INITIAL_ARTICLES || []).filter(a =>
    a.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(cleanQuery.toLowerCase())
  );
}



