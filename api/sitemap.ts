import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  const baseUrl = 'https://voxozet.com';
  const now = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'always' },
    { path: '/gundem', priority: '0.9', changefreq: 'hourly' },
    { path: '/teknoloji', priority: '0.9', changefreq: 'hourly' },
    { path: '/ekonomi', priority: '0.9', changefreq: 'hourly' },
    { path: '/odaklan', priority: '0.8', changefreq: 'daily' },
    { path: '/kitaplik', priority: '0.7', changefreq: 'daily' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  staticRoutes.forEach(r => {
    xml += `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
`;
  });

  // Fetch live articles for sitemap
  try {
    const newsRes = await fetch('https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(4000)
    });

    if (newsRes.ok) {
      const xmlText = await newsRes.text();
      const itemRegex = /<item[\s\S]*?<\/item>/gi;
      const matches = xmlText.match(itemRegex) || [];

      matches.slice(0, 40).forEach(itemXml => {
        const tMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const pMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);

        if (tMatch && tMatch[1]) {
          const rawTitle = tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim();
          const cleanSlug = rawTitle
            .toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 70);

          let pubDateISO = now;
          if (pMatch && pMatch[1]) {
            try {
              const d = new Date(pMatch[1]);
              if (!isNaN(d.getTime())) pubDateISO = d.toISOString().split('T')[0];
            } catch {}
          }

          if (cleanSlug && cleanSlug.length > 5) {
            xml += `  <url>
    <loc>${baseUrl}/haber/${cleanSlug}-voxozet</loc>
    <lastmod>${pubDateISO}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
`;
          }
        }
      });
    }
  } catch (e) {}

  xml += `</urlset>`;
  return res.status(200).send(xml);
}
