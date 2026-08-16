import { Article } from '../types';

export const DEFAULT_VOX_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';

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
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
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
    'https://www.ntv.com.tr/gundem.rss',
    'https://feeds.bbci.co.uk/turkce/rss.xml',
    'https://www.hurriyet.com.tr/rss/gundem'
  ],
  'Teknoloji': [
    'https://www.webtekno.com/rss.xml',
    'https://shiftdelete.net/feed',
    'https://www.ntv.com.tr/teknoloji.rss'
  ],
  'Ekonomi': [
    'https://www.bloomberght.com/rss',
    'https://www.ntv.com.tr/ekonomi.rss',
    'https://www.hurriyet.com.tr/rss/ekonomi'
  ],
  'Spor': [
    'https://www.ntvspor.net/rss/haber',
    'https://www.fanatik.com.tr/rss/futbol'
  ],
  'Dünya': [
    'https://feeds.bbci.co.uk/turkce/rss.xml',
    'https://www.ntv.com.tr/dunya.rss'
  ],
  'Sağlık': [
    'https://www.ntv.com.tr/saglik.rss'
  ],
  'Tümü': [
    'https://www.ntv.com.tr/gundem.rss',
    'https://feeds.bbci.co.uk/turkce/rss.xml',
    'https://www.webtekno.com/rss.xml',
    'https://www.bloomberght.com/rss',
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
  const cleanPlainText = htmlToPlainText(rawHtml);

  // 4. GENERATE CLEAN SINGLE-PARAGRAPH 1-2 SENTENCE AI SUMMARY
  let aiSummary = '';
  let textForSummary = cleanPlainText;
  if (textForSummary.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
    textForSummary = textForSummary.substring(cleanTitle.length).trim();
  }

  const sentences = textForSummary.match(/[^.!?]+[.!?]+/g) || [];
  const validSentences: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
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

  return {
    id: item.id || `news-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    title: cleanTitle,
    summary: aiSummary,
    content: cleanPlainText || `${cleanTitle}. ${extractedAuthor} haberi.`,
    rawHtml: rawHtml,
    category: item.category || defaultCategory,
    author: extractedAuthor,
    imageUrl: extractedImage,
    durationSeconds: item.durationSeconds || 180,
    sourceType: 'rss',
    sourceUrl: item.url || item.link,
    createdAt: item.createdAt || item.pubDate || new Date().toISOString(),
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined
  };
}

/**
 * Fetch dynamic Turkish news by category with local /api/news & direct RSS fallback
 */
export async function fetchNewsByCategory(category: string = 'Tümü', lang: string = 'tr'): Promise<Article[]> {
  const targetCategory = category === 'Tümü' ? 'Gündem' : category;
  const articles: Article[] = [];

  // 1. Primary: Fetch from local VOX /api/news endpoint with rich media extraction
  try {
    const queryParam = category && category !== 'Tümü' ? `?category=${encodeURIComponent(category)}&lang=${lang}` : `?lang=${lang}`;
    const res = await fetch(`/api/news${queryParam}`);
    
    if (res.ok) {
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
    console.warn('/api/news fetch error, falling back to direct RSS:', err);
  }

  // If local /api/news returned items, return immediately
  if (articles.length > 0) {
    const uniqueMap = new Map<string, Article>();
    articles.forEach(a => {
      if (a.title && !uniqueMap.has(a.title.toLowerCase().trim())) {
        uniqueMap.set(a.title.toLowerCase().trim(), a);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // 2. Fetch from Direct Turkish News RSS Feeds (NTV, BBC Türkçe, Webtekno, Bloomberg, etc.)
  const directUrls = CATEGORY_DIRECT_RSS[category] || CATEGORY_DIRECT_RSS['Tümü'];
  
  const rssPromises = directUrls.map(async (rssUrl, i) => {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.items)) {
          return data.items.map((item: any, idx: number) => 
            parseGoogleNewsItem(item, targetCategory, i * 10 + idx)
          );
        }
      }
    } catch (e) {
      console.warn(`Direct RSS fetch error for ${rssUrl}:`, e);
    }
    return [];
  });

  try {
    const rssResults = await Promise.all(rssPromises);
    rssResults.forEach(list => {
      if (Array.isArray(list)) articles.push(...list);
    });
  } catch (err) {
    console.warn('Direct RSS parallel fetch error:', err);
  }

  // 3. Fallback to Google News RSS
  if (articles.length === 0) {
    try {
      const rssTopic = TOPIC_MAP[category] || '';
      const rssUrl = rssTopic 
        ? `https://news.google.com/rss/headlines/section/topic/${rssTopic}?hl=tr&gl=TR&ceid=TR:tr`
        : `https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr`;

      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.items)) {
          const parsed = data.items.map((item: any, idx: number) => parseGoogleNewsItem(item, targetCategory, idx + 100));
          articles.push(...parsed);
        }
      }
    } catch (err) {
      console.warn('Google News RSS fetch error:', err);
    }
  }

  // Deduplicate by title
  const uniqueMap = new Map<string, Article>();
  articles.forEach(a => {
    if (a.title && !uniqueMap.has(a.title.toLowerCase().trim())) {
      uniqueMap.set(a.title.toLowerCase().trim(), a);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Search Google News directly for a query string
 */
export async function searchGoogleNews(query: string): Promise<Article[]> {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();

  // Try fetching from vox-ai-repo with query
  try {
    const res = await fetch(`https://vox-ai-repo.onrender.com/api/news?q=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      const articlesList = Array.isArray(data) ? data : (data.articles || data.data || []);
      if (Array.isArray(articlesList) && articlesList.length > 0) {
        return articlesList.map((item: any, idx: number) => parseGoogleNewsItem(item, 'Arama', idx));
      }
    }
  } catch (err) {
    console.warn('vox-ai-repo search error:', err);
  }

  // Google News RSS Search via RSS2JSON
  try {
    const googleNewsRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=tr&gl=TR&ceid=TR:tr`;
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleNewsRssUrl)}`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.items)) {
        return data.items.map((item: any, idx: number) => parseGoogleNewsItem(item, 'Arama', idx));
      }
    }
  } catch (err) {
    console.warn('Google News Search error:', err);
  }

  return [];
}



