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
  return raw
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

        articles.push({
          id,
          slug,
          title: cleanTitle,
          summary: rawDesc || `${cleanTitle} hakkında sıcak gelişmeler ve tüm detaylar.`,
          content: `${cleanTitle}.\n\n${rawDesc || ''}\n\nDetaylar VOX Akıllı Haber Akışı tarafından anlık olarak derlenmiştir.`,
          category: targetCategory,
          author: source,
          imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
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
