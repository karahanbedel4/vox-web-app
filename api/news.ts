import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  hasRealImage?: boolean;
  durationSeconds: number;
  createdAt: string;
  sourceType: 'rss' | 'twitter' | 'custom';
  sourceUrl?: string;
  slug?: string;
  keyPoints?: string[];
}

const FEED_CONFIGS = [
  // Gündem & Son Dakika
  { url: 'https://www.ensonhaber.com/rss/manset.xml', category: 'Gündem', author: 'Ensonhaber' },
  { url: 'https://www.ensonhaber.com/rss/gundem.xml', category: 'Gündem', author: 'Ensonhaber' },
  { url: 'https://www.trthaber.com/sondakika_articles.rss', category: 'Gündem', author: 'TRT Haber' },
  { url: 'https://www.trthaber.com/gundem_articles.rss', category: 'Gündem', author: 'TRT Haber' },
  { url: 'https://www.haberturk.com/rss/manset.xml', category: 'Gündem', author: 'Habertürk' },
  { url: 'https://www.haberturk.com/rss/kategori/gundem.xml', category: 'Gündem', author: 'Habertürk' },
  { url: 'https://www.ntv.com.tr/gundem.rss', category: 'Gündem', author: 'NTV' },
  { url: 'https://www.sozcu.com.tr/rss/gundem.xml', category: 'Gündem', author: 'Sözcü' },
  { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'Gündem', author: 'BBC Türkçe' },

  // Teknoloji
  { url: 'https://www.webtekno.com/rss.xml', category: 'Teknoloji', author: 'Webtekno' },
  { url: 'https://www.donanimhaber.com/rss/tum/', category: 'Teknoloji', author: 'DonanımHaber' },
  { url: 'https://www.ensonhaber.com/rss/teknoloji.xml', category: 'Teknoloji', author: 'Ensonhaber Teknoloji' },
  { url: 'https://www.haberturk.com/rss/kategori/teknoloji.xml', category: 'Teknoloji', author: 'Habertürk Teknoloji' },
  { url: 'https://www.ntv.com.tr/teknoloji.rss', category: 'Teknoloji', author: 'NTV Teknoloji' },

  // Ekonomi
  { url: 'https://www.bloomberght.com/rss', category: 'Ekonomi', author: 'Bloomberg HT' },
  { url: 'https://www.ensonhaber.com/rss/ekonomi.xml', category: 'Ekonomi', author: 'Ensonhaber Ekonomi' },
  { url: 'https://www.haberturk.com/rss/kategori/ekonomi.xml', category: 'Ekonomi', author: 'Habertürk Ekonomi' },
  { url: 'https://www.ntv.com.tr/ekonomi.rss', category: 'Ekonomi', author: 'NTV Ekonomi' },
  { url: 'https://www.sozcu.com.tr/rss/ekonomi.xml', category: 'Ekonomi', author: 'Sözcü Ekonomi' },

  // Dünya
  { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'Dünya', author: 'BBC Türkçe' },
  { url: 'https://rss.dw.com/rdf/rss-tur-all', category: 'Dünya', author: 'DW Türkçe' },
  { url: 'https://www.trthaber.com/dunya_articles.rss', category: 'Dünya', author: 'TRT Dünya' },
  { url: 'https://www.ensonhaber.com/rss/dunya.xml', category: 'Dünya', author: 'Ensonhaber Dünya' },
  { url: 'https://www.ntv.com.tr/dunya.rss', category: 'Dünya', author: 'NTV Dünya' },

  // Spor
  { url: 'https://www.ensonhaber.com/rss/kralspor.xml', category: 'Spor', author: 'Ensonhaber Spor' },
  { url: 'https://www.trthaber.com/spor_articles.rss', category: 'Spor', author: 'TRT Spor' },
  { url: 'https://www.haberturk.com/rss/kategori/spor.xml', category: 'Spor', author: 'Habertürk Spor' },
  { url: 'https://www.ntvspor.net/rss/haber', category: 'Spor', author: 'NTV Spor' },
  { url: 'https://www.fanatik.com.tr/rss/futbol', category: 'Spor', author: 'Fanatik' },
  { url: 'https://www.sozcu.com.tr/rss/spor.xml', category: 'Spor', author: 'Sözcü Spor' },

  // Sağlık
  { url: 'https://www.ensonhaber.com/rss/saglik.xml', category: 'Sağlık', author: 'Ensonhaber Sağlık' },
  { url: 'https://www.ntv.com.tr/saglik.rss', category: 'Sağlık', author: 'NTV Sağlık' },
  { url: 'https://www.haberturk.com/rss/kategori/saglik.xml', category: 'Sağlık', author: 'Habertürk Sağlık' }
];

const categoryDefaultImages: Record<string, string[]> = {
  'Teknoloji': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
  ],
  'Ekonomi': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80'
  ],
  'Dünya': [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80'
  ],
  'Spor': [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80'
  ],
  'Sağlık': [
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'
  ],
  'Gündem': [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=800&auto=format&fit=crop&q=80'
  ]
};

function cleanHtmlText(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  
  for (let k = 0; k < 3; k++) {
    text = text
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  text = text.replace(/\b(a\s+href|href|target=|[a-z0-9_-]+\.html)\b[^\s]*/gi, '');

  return text.replace(/\s+/g, ' ').trim();
}

function generateSlug(title: string, id: string = ''): string {
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
    .substring(0, 75);

  const idHash = id ? id.replace(/[^a-z0-9]/gi, '').slice(-5) : '';
  return `${clean}-${idHash || 'vox'}-voxozet`;
}

// In-Memory serverless cache to provide lightning-fast responses on Vercel
let vercelNewsCache: { timestamp: number; articles: NewsItem[] } = { timestamp: 0, articles: [] };
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function fetchFeed(feed: typeof FEED_CONFIGS[0]): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    const items: NewsItem[] = [];

    for (let i = 0; i < Math.min(itemMatches.length, 15); i++) {
      const itemXml = itemMatches[i];
      const tMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const dMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const cMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      const lMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      const pMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      const aMatch = itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i) || itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);

      let rawTitle = tMatch ? cleanHtmlText(tMatch[1]) : '';
      if (!rawTitle || rawTitle.length < 6) continue;

      let author = aMatch ? cleanHtmlText(aMatch[1]) : feed.author;
      if (author.includes('@') || author.length > 30) author = feed.author;

      let title = rawTitle;
      if (author && title.endsWith(' - ' + author)) {
        title = title.substring(0, title.length - (author.length + 3)).trim();
      } else if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1 && parts[parts.length - 1].length < 30) {
          parts.pop();
          title = parts.join(' - ').trim();
        }
      } else if (title.includes(' | ')) {
        const parts = title.split(' | ');
        if (parts.length > 1 && parts[parts.length - 1].length < 30) {
          parts.pop();
          title = parts.join(' | ').trim();
        }
      }

      // Robust Image Extraction
      let extractedImg = '';
      const encMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i) || itemXml.match(/<enclosure[^>]+url=([^\s>]+)/i);
      const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i) || itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
      const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) || itemXml.match(/<img[^>]+src=([^\s>]+)/i);
      const htmlEntityImgMatch = itemXml.match(/&lt;img[^&]+src=(?:&quot;|"|'|)([^\s&"'>]+)(?:&quot;|"|'|)/i);
      const imageTag = itemXml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i) || itemXml.match(/<image>([^<]+)<\/image>/i);

      if (encMatch && encMatch[1] && !encMatch[1].endsWith('.mp3') && !encMatch[1].endsWith('.m4a')) {
        extractedImg = encMatch[1].trim();
      } else if (mediaMatch && mediaMatch[1]) {
        extractedImg = mediaMatch[1].trim();
      } else if (imgMatch && imgMatch[1]) {
        extractedImg = imgMatch[1].trim();
      } else if (htmlEntityImgMatch && htmlEntityImgMatch[1]) {
        extractedImg = htmlEntityImgMatch[1].trim();
      } else if (imageTag && imageTag[1] && imageTag[1].trim().startsWith('http')) {
        extractedImg = imageTag[1].trim();
      }

      if (extractedImg.startsWith('//')) {
        extractedImg = 'https:' + extractedImg;
      } else if (extractedImg.startsWith('http://')) {
        extractedImg = extractedImg.replace(/^http:\/\//i, 'https://');
      }

      const hasRealImg = !!(extractedImg && extractedImg.startsWith('https://') && !extractedImg.includes('1x1') && !extractedImg.includes('pixel'));

      const rawDesc = dMatch ? cleanHtmlText(dMatch[1]) : '';
      const rawContent = cMatch ? cleanHtmlText(cMatch[1]) : '';
      const sourceUrl = lMatch ? lMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';

      let pubDateISO = new Date().toISOString();
      if (pMatch && pMatch[1]) {
        try {
          const d = new Date(cleanHtmlText(pMatch[1]));
          if (!isNaN(d.getTime())) pubDateISO = d.toISOString();
        } catch {}
      }

      const defaultPool = categoryDefaultImages[feed.category] || categoryDefaultImages['Gündem'];
      const finalImage = (hasRealImg ? extractedImg : null) || defaultPool[i % defaultPool.length];

      const cleanSlug = title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').substring(0, 35);
      const id = `vox_${feed.category.toLowerCase()}_${cleanSlug}`;
      const slug = generateSlug(title, id);

      const cleanSummary = rawDesc && rawDesc.length > 25 
        ? rawDesc 
        : `${title}. ${author} tarafından aktarılan son bilgilere göre sahadaki gelişmeler yakından takip ediliyor.`;
      
      const p1 = `${title}. Konuyla ilgili resmi birimler ve yetkili makamlar tarafından yapılan ilk değerlendirmelere göre süreç titizlikle yürütülüyor.`;
      const p2 = cleanSummary;
      const p3 = `Gelişmeler kamuoyu ve ilgili sektör temsilcileri tarafından dikkatle izlenirken, sürecin etkileri ${author} ve VOX Odak Haber bültenleri üzerinden anlık olarak aktarılmaya devam edecek.`;
      
      const cleanContent = (rawContent && rawContent.length > 100) ? rawContent : `${p1}\n\n${p2}\n\n${p3}`;

      items.push({
        id,
        slug,
        title,
        summary: cleanSummary,
        content: cleanContent,
        category: feed.category,
        author: author,
        imageUrl: finalImage,
        hasRealImage: hasRealImg,
        durationSeconds: Math.max(120, Math.min(360, (cleanSummary.length + cleanContent.length) * 2)),
        createdAt: pubDateISO,
        sourceType: 'rss',
        sourceUrl,
        keyPoints: [
          title,
          `${author} kaynağından aktarılan son veriler değerlendirildi`,
          'Resmi açıklamalar ve sahadaki gelişmeler doğrultusunda süreç takip ediliyor'
        ]
      });
    }

    return items;
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const idOrSlug = (req.query.idOrSlug as string) || '';
  const searchQ = (req.query.q as string) || '';
  const category = (req.query.category as string) || 'Tümü';
  const targetCategory = category === 'Tümü' ? null : category;

  // Refresh cache if stale
  const now = Date.now();
  if (now - vercelNewsCache.timestamp > CACHE_TTL_MS || vercelNewsCache.articles.length === 0) {
    try {
      const results = await Promise.allSettled(FEED_CONFIGS.map(f => fetchFeed(f)));
      const freshArticles: NewsItem[] = [];
      const seenTitles = new Set<string>();

      results.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          r.value.forEach(a => {
            const normKey = a.title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').trim();
            if (!seenTitles.has(normKey)) {
              seenTitles.add(normKey);
              freshArticles.push(a);
            }
          });
        }
      });

      if (freshArticles.length > 0) {
        freshArticles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        vercelNewsCache = { timestamp: now, articles: freshArticles };
      }
    } catch {}
  }

  let articles = vercelNewsCache.articles;

  // 1. Single article lookup by ID or slug
  if (idOrSlug) {
    const cleanLookup = idOrSlug.toLowerCase().trim();
    const found = articles.find(a => 
      a.id.toLowerCase() === cleanLookup || 
      (a.slug && a.slug.toLowerCase() === cleanLookup) ||
      cleanLookup.includes(a.id.toLowerCase())
    );

    if (found) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=180');
      return res.status(200).json({ success: true, article: found });
    }
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  // 2. Search query filter
  if (searchQ) {
    const qLower = searchQ.toLowerCase().trim();
    const filtered = articles.filter(a => 
      a.title.toLowerCase().includes(qLower) || 
      a.summary.toLowerCase().includes(qLower) ||
      a.category.toLowerCase().includes(qLower)
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, articles: filtered, count: filtered.length });
  }

  // 3. Category filter
  if (targetCategory) {
    articles = articles.filter(a => a.category.toLowerCase() === targetCategory.toLowerCase());
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=180');
  return res.status(200).json({ 
    success: true, 
    articles, 
    count: articles.length, 
    timestamp: vercelNewsCache.timestamp 
  });
}
