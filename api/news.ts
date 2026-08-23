import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  durationSeconds: number;
  createdAt: string;
  sourceType: 'rss' | 'twitter' | 'custom';
  sourceUrl?: string;
  slug?: string;
  keyPoints?: string[];
}

function cleanHtmlText(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  
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
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // Remove scripts & styles
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // Strip all HTML tags completely
  text = text.replace(/<[^>]+>/g, ' ');

  // Strip URL fragments and leftover attributes
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  text = text.replace(/\b(a\s+href|href|target=|[a-z0-9_-]+\.html)\b[^\s]*/gi, '');
  text = text.replace(/target=["'][^"']*["']/gi, '');
  text = text.replace(/href=["'][^"']*["']/gi, '');

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const category = (req.query.category as string) || 'Gündem';
  const targetCategory = category === 'Tümü' ? 'Gündem' : category;

  let rssUrl = 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr';
  if (targetCategory === 'Teknoloji') {
    rssUrl = 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=tr&gl=TR&ceid=TR:tr';
  } else if (targetCategory === 'Ekonomi') {
    rssUrl = 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=tr&gl=TR&ceid=TR:tr';
  } else if (targetCategory === 'Spor') {
    rssUrl = 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=tr&gl=TR&ceid=TR:tr';
  } else if (targetCategory === 'Dünya') {
    rssUrl = 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=tr&gl=TR&ceid=TR:tr';
  } else if (targetCategory === 'Sağlık') {
    rssUrl = 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=tr&gl=TR&ceid=TR:tr';
  }

  try {
    const upstreamRes = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!upstreamRes.ok) {
      return res.status(200).json({ articles: [], source: 'upstream_failed' });
    }

    const xml = await upstreamRes.text();
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const matches = xml.match(itemRegex) || [];

    const now = Date.now();
    const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 saatten eski haberleri filtrele
    const seenTitles = new Set<string>();
    const articles: NewsItem[] = [];

    matches.slice(0, 40).forEach((itemXml, idx) => {
      const tMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const dMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const lMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const pMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const sMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

      const rawTitle = tMatch ? cleanHtmlText(tMatch[1]) : '';
      const rawDesc = dMatch ? cleanHtmlText(dMatch[1]) : '';
      const link = lMatch ? lMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : '';
      const rawPubDate = pMatch ? pMatch[1].trim() : '';
      const source = sMatch ? cleanHtmlText(sMatch[1]) : 'Google Haberler';

      let pubDateISO = new Date().toISOString();
      if (rawPubDate) {
        try {
          const d = new Date(rawPubDate);
          if (!isNaN(d.getTime())) {
            // Prune if older than 48 hours
            if (now - d.getTime() > MAX_AGE_MS) {
              return;
            }
            pubDateISO = d.toISOString();
          }
        } catch {}
      }

      if (rawTitle && rawTitle.length > 5) {
        // Strip trailing source name
        let cleanTitle = rawTitle;
        const dashIdx = cleanTitle.lastIndexOf(' - ');
        if (dashIdx > 10) {
          cleanTitle = cleanTitle.substring(0, dashIdx).trim();
        }

        const normKey = cleanTitle.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').trim();
        if (seenTitles.has(normKey)) return;
        seenTitles.add(normKey);

        const id = `vox_${targetCategory.toLowerCase()}_${idx}_${Date.now()}`;
        const slug = generateSlug(cleanTitle, id);

        // Extract real image from item if present
        let extractedImg = '';
        const encMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i) || itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
        const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
        
        if (encMatch && encMatch[1] && !encMatch[1].match(/\.(mp3|m4a|wav)/i)) {
          extractedImg = encMatch[1].trim();
        } else if (mediaMatch && mediaMatch[1]) {
          extractedImg = mediaMatch[1].trim();
        } else if (imgMatch && imgMatch[1]) {
          extractedImg = imgMatch[1].trim();
        }

        if (extractedImg.startsWith('//')) {
          extractedImg = 'https:' + extractedImg;
        } else if (extractedImg.startsWith('http://')) {
          extractedImg = extractedImg.replace(/^http:\/\//i, 'https://');
        }

        const categoryDefaultImages: Record<string, string[]> = {
          'Teknoloji': [
            'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
          ],
          'Ekonomi': [
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80'
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

        const defaultPool = categoryDefaultImages[targetCategory] || categoryDefaultImages['Gündem'];
        const finalImage = extractedImg || defaultPool[idx % defaultPool.length];

        articles.push({
          id,
          slug,
          title: cleanTitle,
          summary: rawDesc || `${cleanTitle} hakkında sıcak gelişmeler ve tüm detaylar.`,
          content: `${cleanTitle}.\n\n${rawDesc || ''}\n\nDetaylar VOX Akıllı Haber Akışı tarafından anlık olarak derlenmiştir.`,
          category: targetCategory,
          author: source,
          imageUrl: finalImage,
          durationSeconds: 150,
          createdAt: pubDateISO,
          sourceType: 'rss',
          sourceUrl: link,
          keyPoints: [
            cleanTitle,
            `Kaynak: ${source}`,
            `Kategori: ${targetCategory}`,
            'Canlı Akış'
          ]
        });
      }
    });

    // Chronological sort: Newest first
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=45, stale-while-revalidate=120');
    return res.status(200).json({ articles, success: true, count: articles.length });
  } catch (err: any) {
    return res.status(200).json({ articles: [], error: err?.message || String(err) });
  }
}
