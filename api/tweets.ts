import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Fetch real tweets via live mirrors without hardcoded dummy fallback
  const accounts = [
    { username: 'ConflictTR', name: 'Conflict TR', category: 'Gündem' },
    { username: 'ozetgechaber', name: 'Özet Geç Haber', category: 'Teknoloji' },
    { username: 'vaziyetcomtr', name: 'Vaziyet', category: 'Ekonomi' }
  ];

  const tweets: any[] = [];

  try {
    const fetchPromises = accounts.map(async (acc) => {
      const mirrors = [
        `https://nitter.poast.org/${acc.username}/rss`,
        `https://rsshub.app/twitter/user/${acc.username}`
      ];

      for (const mirror of mirrors) {
        try {
          const resp = await fetch(mirror, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VoxBot/1.0)' },
            signal: AbortSignal.timeout(3000)
          });
          if (resp.ok) {
            const xml = await resp.text();
            const itemRegex = /<item[\s\S]*?<\/item>/gi;
            const matches = xml.match(itemRegex) || [];
            return matches.slice(0, 5).map((itemBlock, idx) => {
              const titleMatch = itemBlock.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              const descMatch = itemBlock.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
              const linkMatch = itemBlock.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
              const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';
              const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';
              const clean = (rawDesc || rawTitle).replace(/https?:\/\/[^\s]+/g, '').trim();
              if (!clean) return null;
              return {
                id: `tweet_${acc.username}_${idx}_${Date.now()}`,
                title: rawTitle || clean.substring(0, 80),
                summary: clean,
                content: clean,
                category: acc.category,
                author: acc.name,
                sourceType: 'twitter',
                sourceUrl: linkMatch ? linkMatch[1] : `https://x.com/${acc.username}`,
                createdAt: new Date().toISOString()
              };
            }).filter(Boolean);
          }
        } catch (e) {}
      }
      return [];
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(list => {
      if (Array.isArray(list)) tweets.push(...list);
    });
  } catch (err) {}

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  return res.status(200).json({ tweets, success: true });
}
