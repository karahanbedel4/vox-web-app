import type { VercelRequest, VercelResponse } from '@vercel/node';

// Corporate-Grade SSRF Protection Filter
function isSafeExternalUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost and loopback addresses
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }

    // Block AWS/GCP/Cloud Metadata IP
    if (host === '169.254.169.254' || host.startsWith('169.254.')) {
      return false;
    }

    // Block Private RFC1918 IPv4 ranges
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;

    return true;
  } catch {
    return false;
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

  const url = (req.query.url as string) || '';
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('Invalid or missing url query parameter');
  }

  if (!isSafeExternalUrl(url)) {
    return res.status(403).send('Target host is not permitted by corporate security policy');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch upstream feed: ${response.statusText}`);
    }

    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).send(xml);
  } catch (err: any) {
    return res.status(500).send(`Feed fetch error: ${err?.message || String(err)}`);
  }
}
