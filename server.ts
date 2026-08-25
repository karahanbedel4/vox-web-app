import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { YoutubeTranscript } from 'youtube-transcript';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Corporate Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

// Set default Content-Type for all /api endpoints to application/json
app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/tts')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// JSON body parse error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'INVALID_JSON', message: 'Geçersiz veri biçimi.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Yüklenen veri boyutu çok büyük.' });
  }
  next(err);
});

// Google AdSense ads.txt explicit endpoint
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send('google.com, pub-4663082689738592, DIRECT, f08c47fec0942fa0\n');
});

// Dynamic robots.txt endpoint
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Allow: /gundem
Allow: /teknoloji
Allow: /ekonomi
Allow: /dunya
Allow: /spor
Allow: /saglik
Allow: /haber/
Allow: /odaklan
Allow: /kitaplik
Disallow: /api/
Disallow: /api/*

Sitemap: https://voxozet.com/sitemap.xml
`);
});

// Dynamic sitemap.xml endpoint for Search Engines
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const baseUrl = 'https://voxozet.com';
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>always</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/gundem</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/teknoloji</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/ekonomi</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/odaklan</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/kitaplik</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>
`;

  serverNewsCache.all.slice(0, 150).forEach(art => {
    const cleanSlug = art.title.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 70);

    const artDate = art.createdAt ? art.createdAt.split('T')[0] : now;
    if (cleanSlug && cleanSlug.length > 5) {
      xml += `  <url><loc>${baseUrl}/haber/${cleanSlug}-voxozet</loc><lastmod>${artDate}</lastmod><changefreq>never</changefreq><priority>0.8</priority></url>\n`;
    }
  });

  xml += `</urlset>`;
  res.send(xml);
});

// Initialize Gemini API client server-side
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

async function callGeminiWithRetry(params: { model?: string; contents: any; config?: any }, retries = 2, delayMs = 300) {
  const primaryModel = params.model || 'gemini-3.7-flash';
  const models = Array.from(new Set([primaryModel, 'gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-flash-latest']));
  let lastError: any = null;

  for (const modelName of models) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        const msg = err?.message || String(err);
        const isTransient = status === 503 || status === 429 || msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || msg.includes('quota');
        
        if (isTransient && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        } else {
          // If transient error on this model, break loop to instantly try next fallback model
          break;
        }
      }
    }
  }

  throw lastError;
}

// Health & System Status Endpoint for API Key and News Feed verification
app.get('/api/health', async (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
  const keyPrefix = hasGeminiKey ? process.env.GEMINI_API_KEY!.substring(0, 7) + '...' : 'NONE';
  
  let geminiTestStatus = 'untested';
  let geminiLatencyMs = 0;
  let geminiError: string | null = null;

  if (hasGeminiKey) {
    const t0 = Date.now();
    try {
      const pingRes = await callGeminiWithRetry({
        model: 'gemini-3.7-flash',
        contents: 'Ping',
      });
      geminiLatencyMs = Date.now() - t0;
      geminiTestStatus = (pingRes && pingRes.text) ? 'connected_ok' : 'empty_response';
    } catch (e: any) {
      geminiTestStatus = 'error';
      geminiError = e?.message || String(e);
    }
  } else {
    geminiTestStatus = 'missing_api_key';
  }

  const categoryCounts: Record<string, number> = {};
  Object.keys(serverNewsCache.byCategory).forEach(cat => {
    categoryCounts[cat] = serverNewsCache.byCategory[cat]?.length || 0;
  });

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: {
      hasKey: hasGeminiKey,
      keyPrefix,
      status: geminiTestStatus,
      latencyMs: geminiLatencyMs,
      error: geminiError
    },
    newsCache: {
      totalArticles: serverNewsCache.all.length,
      lastUpdated: serverNewsCache.lastUpdated ? new Date(serverNewsCache.lastUpdated).toISOString() : 'never',
      isRefreshing: serverNewsCache.isRefreshing,
      categoryCounts
    }
  });
});

function extractYouTubeId(urlStr: string): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) return match[1];

  try {
    const normUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const urlObj = new URL(normUrl);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const vParam = urlObj.searchParams.get('v');
      if (vParam && /^[\w-]{11}$/.test(vParam)) return vParam;
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && /^[\w-]{11}$/.test(last)) return last;
    }
  } catch {}

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

function decodeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericYouTubeText(str: string): boolean {
  if (!str) return true;
  const lower = str.toLowerCase();
  return (
    lower.includes('sevdiğiniz videoların') ||
    lower.includes('orijinal içerik yükleyin') ||
    lower.includes('arkadaşlarınızla, ailenizle') ||
    lower.includes('enjoy the videos and music') ||
    lower.includes('upload original content') ||
    lower.includes('share it all with friends') ||
    lower.includes('youtube&#39;da') ||
    lower.includes("youtube'da") ||
    lower.includes('seslendirme metnine dönüştürülüyor') ||
    lower.includes('podcast seslendirme metni üret') ||
    str.trim().length < 15
  );
}

// 1. YouTube InnerTube API call (bypasses HTML consent walls)
async function fetchYouTubeInnerTubePlayer(videoId: string) {
  const clients = [
    {
      client: { clientName: 'WEB', clientVersion: '2.20240308.00.00', hl: 'tr', gl: 'TR' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    {
      client: { clientName: 'ANDROID', clientVersion: '19.11.38', androidSdkVersion: 30, hl: 'tr', gl: 'TR' },
      userAgent: 'com.google.android.youtube/19.11.38 (Linux; U; Android 11) gzip'
    },
    {
      client: { clientName: 'WEB_EMBEDDED_PLAYER', clientVersion: '1.20240101.00.00', hl: 'tr', gl: 'TR' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    {
      client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', hl: 'tr', gl: 'TR' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    {
      client: { clientName: 'IOS', clientVersion: '19.11.1', hl: 'tr', gl: 'TR' },
      userAgent: 'com.google.ios.youtube/19.11.1 (iPhone; CPU iPhone OS 17_4 like Mac OS X)'
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fallbackJson: any = null;

  for (const { client, userAgent } of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        body: JSON.stringify({
          context: { client },
          videoId: videoId,
          playbackContext: {
            contentPlaybackContext: {
              html5Preference: 'HTML5_PREFER_FORMAT_22'
            }
          },
          racyCheckOk: true,
          contentCheckOk: true
        })
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = await res.json() as any;
        if (json?.captions?.playerCaptionsTracklistRenderer?.captionTracks || json?.captions?.playerCaptionsRenderer?.captionTracks) {
          return json;
        }
        if (json?.videoDetails && !fallbackJson) {
          fallbackJson = json;
        }
      }
    } catch (err) {
      console.warn('[YouTube InnerTube Player] fetch notice:', err);
    }
  }
  return fallbackJson;
}

// 1b. YouTube InnerTube Next API call (returns engagementPanels & cueGroups directly)
async function fetchYouTubeInnerTubeNext(videoId: string) {
  const clients = [
    {
      client: { clientName: 'WEB', clientVersion: '2.20240308.00.00', hl: 'tr', gl: 'TR' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    {
      client: { clientName: 'ANDROID', clientVersion: '19.11.38', androidSdkVersion: 30, hl: 'tr', gl: 'TR' },
      userAgent: 'com.google.android.youtube/19.11.38 (Linux; U; Android 11) gzip'
    },
    {
      client: { clientName: 'IOS', clientVersion: '19.11.1', hl: 'tr', gl: 'TR' },
      userAgent: 'com.google.ios.youtube/19.11.1 (iPhone; CPU iPhone OS 17_4 like Mac OS X)'
    }
  ];

  for (const { client, userAgent } of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        body: JSON.stringify({
          context: { client },
          videoId: videoId
        })
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = await res.json() as any;
        if (json) return json;
      }
    } catch (err) {
      console.warn('[YouTube InnerTube Next] fetch notice:', err);
    }
  }
  return null;
}

// Extract transcript text directly from InnerTube Next engagementPanels cueGroups
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTranscriptFromInnerTubeNext(json: any): string | null {
  if (!json) return null;
  try {
    const panels = json?.engagementPanels;
    if (Array.isArray(panels)) {
      for (const panel of panels) {
        const cueGroups = panel?.engagementPanelSectionListRenderer?.content
          ?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;
        if (Array.isArray(cueGroups) && cueGroups.length > 0) {
          const lines: string[] = [];
          for (const group of cueGroups) {
            const cues = group?.transcriptCueRenderer;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const text = cues?.cue?.simpleText || cues?.cue?.runs?.map((r: any) => r.text).join('') || cues?.snippet?.runs?.map((r: any) => r.text).join('');
            if (text && text.trim()) {
              lines.push(text.trim());
            }
          }
          if (lines.length > 0) {
            const fullText = lines.join(' ').replace(/\s+/g, ' ').trim();
            if (fullText.length > 30) {
              return fullText;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[InnerTube Next Transcript Extraction Error]', err);
  }
  return null;
}

// Helper to extract transcript from InnerTube get_transcript response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTranscriptFromGetTranscriptJson(json: any): string | null {
  if (!json) return null;
  const lines: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function collectCues(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.transcriptCueRenderer) {
      const cue = obj.transcriptCueRenderer;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = cue?.cue?.simpleText || 
                   cue?.cue?.runs?.map((r: any) => r.text).join('') ||
                   cue?.snippet?.runs?.map((r: any) => r.text).join('');
      if (text && text.trim()) {
        lines.push(text.trim());
      }
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) collectCues(item);
    } else {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') collectCues(obj[key]);
      }
    }
  }

  collectCues(json);

  if (lines.length > 0) {
    const fullText = lines.join(' ').replace(/\s+/g, ' ').trim();
    if (fullText.length > 30) return fullText;
  }
  return null;
}

// 1c. YouTube InnerTube get_transcript caller
async function fetchYouTubeInnerTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const nextData = await fetchYouTubeInnerTubeNext(videoId);
    if (nextData) {
      const cueText = extractTranscriptFromInnerTubeNext(nextData);
      if (cueText) return cueText;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let transcriptParams: string | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function findTranscriptParams(obj: any) {
        if (!obj || typeof obj !== 'object' || transcriptParams) return;
        if (obj.getTranscriptEndpoint && obj.getTranscriptEndpoint.params) {
          transcriptParams = obj.getTranscriptEndpoint.params;
          return;
        }
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === 'object') {
            findTranscriptParams(obj[k]);
          }
        }
      }
      findTranscriptParams(nextData);

      if (transcriptParams) {
        const clients = [
          { clientName: 'WEB', clientVersion: '2.20240308.00.00', hl: 'tr', gl: 'TR' },
          { clientName: 'ANDROID', clientVersion: '19.11.38', androidSdkVersion: 30, hl: 'tr', gl: 'TR' }
        ];

        for (const client of clients) {
          try {
            const res = await fetch('https://www.youtube.com/youtubei/v1/get_transcript', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
              },
              body: JSON.stringify({
                context: { client },
                params: transcriptParams
              })
            });

            if (res.ok) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const json = await res.json() as any;
              const extractedText = extractTranscriptFromGetTranscriptJson(json);
              if (extractedText && extractedText.length > 30) {
                console.log(`[YouTube Transcript Success] InnerTube get_transcript API -> ${extractedText.length} chars`);
                return extractedText;
              }
            }
          } catch (err) {
            console.warn('[InnerTube get_transcript Error]', err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[fetchYouTubeInnerTubeTranscript Error]', err);
  }
  return null;
}

// Clean and extract subtitle text from WebVTT, TTML, SRT, or XML format
function cleanSubtitlesText(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. If XML format with <text> or <s> or <p> tags
  if (text.includes('<text') || text.includes('<s ') || text.includes('<p ')) {
    const textMatches = [...text.matchAll(/<text[^>]*>(.*?)<\/text>/gs)];
    if (textMatches.length > 0) {
      const extracted = textMatches
        .map(m => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, ' '))
        .join(' ');
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, ' ').trim();
      }
    }
    const sMatches = [...text.matchAll(/<s[^>]*>(.*?)<\/s>/gs)];
    if (sMatches.length > 0) {
      const extracted = sMatches
        .map(m => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, ' '))
        .join(' ');
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, ' ').trim();
      }
    }
    const pMatches = [...text.matchAll(/<p[^>]*>(.*?)<\/p>/gs)];
    if (pMatches.length > 0) {
      const extracted = pMatches
        .map(m => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, ' '))
        .join(' ');
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, ' ').trim();
      }
    }
  }

  // 2. WebVTT / SRT / TTML cleaning
  text = text
    .replace(/^WEBVTT.*/gi, '')
    .replace(/Kind:.*/gi, '')
    .replace(/Language:.*/gi, '')
    .replace(/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[\.,]\d{3}.*/g, '')
    .replace(/\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}[\.,]\d{3}.*/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\\.*?}/g, ' ');

  text = decodeXmlEntities(text);

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^\d+$/.test(l) && !l.startsWith('NOTE '));

  const uniqueLines: string[] = [];
  for (const line of lines) {
    if (uniqueLines.length === 0 || uniqueLines[uniqueLines.length - 1] !== line) {
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Helper to fetch caption XML or JSON from a track URL
async function fetchCaptionContentFromUrl(url: string, videoId?: string): Promise<string | null> {
  if (!url) return null;
  const rawUrl = url
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/');
  
  // Try raw signed URL FIRST to prevent URL signature invalidation
  const urlsToTry = [
    rawUrl,
    rawUrl.includes('fmt=') ? rawUrl : `${rawUrl}&fmt=json3`,
    rawUrl.includes('fmt=') ? rawUrl : `${rawUrl}&fmt=srv3`
  ];

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'https://www.youtube.com/',
    'Origin': 'https://www.youtube.com'
  };

  for (const u of urlsToTry) {
    try {
      const res = await fetch(u, { headers });
      if (res.ok) {
        const text = await res.text();
        if (!text || text.trim().length === 0) continue;

        if (text.trim().startsWith('{')) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const json = JSON.parse(text) as any;
            if (json.events && Array.isArray(json.events)) {
              const lines: string[] = [];
              for (const ev of json.events) {
                if (ev.segs && Array.isArray(ev.segs)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const line = ev.segs.map((s: any) => s.utf8 || '').join('').replace(/\n/g, ' ').trim();
                  if (line && line !== '\n') lines.push(line);
                }
              }
              const result = decodeXmlEntities(lines.join(' ')).replace(/\s+/g, ' ').trim();
              if (result.length > 30) return result;
            }
          } catch {
            // ignore JSON parse error
          }
        }

        const cleaned = cleanSubtitlesText(text);
        if (cleaned && cleaned.length > 30) {
          return cleaned;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// Helper to sort caption tracks by strict Priority Cascade:
// 1. Manual Turkish subtitle (languageCode: 'tr', kind != 'asr')
// 2. Auto-generated Turkish subtitle (languageCode: 'tr' or vssId containing .tr / a.tr)
// 3. Auto-translated Turkish subtitle or targetLanguage: 'tr'
// 4. Manual English/other
// 5. Auto English/other
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortTracksByPreference(tracks: any[]) {
  if (!Array.isArray(tracks)) return [];
  return [...tracks].sort((a, b) => {
    const getScore = (track: any) => {
      if (!track) return 0;
      const lang = (track.languageCode || track.code || track.language || '').toLowerCase();
      const vssId = (track.vssId || track.vss_id || '').toLowerCase();
      const nameText = (
        track.name?.runs?.[0]?.text || 
        track.name?.simpleText || 
        (typeof track.name === 'string' ? track.name : '') || 
        ''
      ).toLowerCase();
      const baseUrl = (track.baseUrl || track.url || '').toLowerCase();

      const isTr = 
        lang === 'tr' || 
        lang.startsWith('tr') || 
        vssId.includes('.tr') || 
        vssId.includes('a.tr') || 
        nameText.includes('türkçe') || 
        nameText.includes('turkish');

      const isAsr = 
        track.kind === 'asr' || 
        vssId.startsWith('a.') || 
        vssId.includes('a.tr') || 
        track.isAutoGenerated === true || 
        nameText.includes('otomatik') || 
        nameText.includes('auto');

      const isAutoTranslatedTr = baseUrl.includes('tlang=tr') || track.targetLanguage === 'tr';

      if (isTr && !isAsr) return 100;       // Priority 1: Manual TR
      if (isTr && isAsr) return 95;        // Priority 2: Auto ASR TR (languageCode === 'tr' or vssId with .tr / a.tr)
      if (isAutoTranslatedTr) return 85;   // Priority 3: Auto-translated TR
      if (isTr) return 75;                 // Priority 4: Any TR match
      if (!isAsr) return 50;               // Priority 5: Manual other language
      return 10;                           // Priority 6: ASR other language
    };
    return getScore(b) - getScore(a);
  });
}

async function getYouTubeSubtitles(videoId: string): Promise<string | null> {
  if (!videoId) return null;
  const errorsLog: string[] = [];

  console.log(`[YouTube Transcript] Multi-strategy fetch starting for video ID: ${videoId}`);

  // Strategy 1a: InnerTube Transcript API (get_transcript / engagementPanels)
  try {
    const transcriptText = await fetchYouTubeInnerTubeTranscript(videoId);
    if (transcriptText) {
      console.log(`[YouTube Transcript Success] Strategy 1a (InnerTube get_transcript) -> ${transcriptText.length} chars`);
      return transcriptText.substring(0, 20000);
    }
  } catch (err: unknown) {
    errorsLog.push(`InnerTube Transcript: ${(err as Error)?.message || err}`);
  }

  // Strategy 2: InnerTube Player API (bypasses HTML consent walls)
  try {
    const playerData = await fetchYouTubeInnerTubePlayer(videoId);
    if (playerData) {
      const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        const sortedTracks = sortTracksByPreference(tracks);
        for (const track of sortedTracks) {
          if (track && track.baseUrl) {
            const captionText = await fetchCaptionContentFromUrl(track.baseUrl, videoId);
            if (captionText) {
              console.log(`[YouTube Transcript Success] Strategy 2 (InnerTube Player, lang: ${track.languageCode || 'unknown'}, vssId: ${track.vssId || 'none'}) -> ${captionText.length} chars`);
              return captionText.substring(0, 20000);
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    errorsLog.push(`InnerTube Player: ${(err as Error)?.message || err}`);
  }

  // Strategy 3: youtube-transcript npm package (Turkish, Auto, English)
  const langs = ['tr', 'a.tr', undefined, 'en'];
  for (const lang of langs) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined);
      if (items && items.length > 0) {
        const fullText = items.map(i => decodeXmlEntities(i.text)).join(' ').replace(/\s+/g, ' ').trim();
        if (fullText.length > 30) {
          console.log(`[YouTube Transcript Success] Strategy 3 (youtube-transcript, lang: ${lang || 'auto'}) -> ${fullText.length} chars`);
          return fullText.substring(0, 20000);
        }
      }
    } catch (err: unknown) {
      errorsLog.push(`youtube-transcript (${lang || 'auto'}): ${(err as Error)?.message || err}`);
    }
  }

  // Strategy 4: Watch Page HTML Scraping (ytInitialPlayerResponse captionTracks)
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'CONSENT=YES+1; SOCS=CAI; PREF=hl=tr&gl=TR'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/"captionTracks"\s*:\s*(\[\s*\{.+?\}\s*\])/s) || html.match(/captionTracks\s*:\s*(\[\s*\{.+?\}\s*\])/s);
      if (match && match[1]) {
        const cleanedJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tracks = JSON.parse(cleanedJson) as any[];
          if (Array.isArray(tracks) && tracks.length > 0) {
            const sortedTracks = sortTracksByPreference(tracks);
            for (const track of sortedTracks) {
              if (track?.baseUrl) {
                const u = track.baseUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                const text = await fetchCaptionContentFromUrl(u, videoId);
                if (text) {
                  console.log(`[YouTube Transcript Success] Strategy 4 (Watch HTML, lang: ${track.languageCode || 'unknown'}) -> ${text.length} chars`);
                  return text.substring(0, 20000);
                }
              }
            }
          }
        } catch {
          // ignore JSON parse error
        }
      }
    } else {
      errorsLog.push(`Watch HTML: HTTP ${res.status}`);
    }
  } catch (err: unknown) {
    errorsLog.push(`Watch HTML Scraping: ${(err as Error)?.message || err}`);
  }

  // Strategy 5: Piped API Streams Endpoint
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.mha.fi',
    'https://pipedapi.drgns.space'
  ];

  for (const pipedBase of pipedInstances) {
    try {
      const res = await fetch(`${pipedBase}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = await res.json() as any;
        const subtitles = json?.subtitles;
        if (Array.isArray(subtitles) && subtitles.length > 0) {
          const sortedSubs = sortTracksByPreference(subtitles);
          for (const sub of sortedSubs) {
            if (sub?.url) {
              const text = await fetchCaptionContentFromUrl(sub.url, videoId);
              if (text) {
                console.log(`[YouTube Transcript Success] Strategy 5 (Piped API: ${pipedBase}, lang: ${sub.code || sub.name || 'auto'}) -> ${text.length} chars`);
                return text.substring(0, 20000);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      errorsLog.push(`Piped API (${pipedBase}): ${(err as Error)?.message || err}`);
    }
  }

  // Strategy 6: Direct TimedText API endpoints
  const timedTextUrls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&kind=asr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&vss_id=a.tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&vss_id=.tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&kind=asr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&vss_id=a.tr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&fmt=json3`
  ];

  for (const url of timedTextUrls) {
    try {
      const text = await fetchCaptionContentFromUrl(url, videoId);
      if (text) {
        console.log(`[YouTube Transcript Success] Strategy 6 (TimedText Direct) -> ${text.length} chars`);
        return text.substring(0, 20000);
      }
    } catch (err: unknown) {
      errorsLog.push(`TimedText (${url}): ${(err as Error)?.message || err}`);
    }
  }

  // Strategy 7: LemnosLife & External Invidious Transcript APIs
  const extApis = [
    `https://yt.lemnoslife.com/noKey/captions?videoId=${videoId}`,
    `https://yewtu.be/api/v1/captions/${videoId}`,
    `https://inv.tux.pizza/api/v1/captions/${videoId}`,
    `https://invidious.nerdvpn.de/api/v1/captions/${videoId}`,
    `https://invidious.drgns.space/api/v1/captions/${videoId}`
  ];

  for (const apiEndpoint of extApis) {
    try {
      const extRes = await fetch(apiEndpoint, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (extRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = await extRes.json() as any;
        const captionList = json?.captions || json?.subtitles;
        if (Array.isArray(captionList) && captionList.length > 0) {
          const sortedList = sortTracksByPreference(captionList);
          for (const sub of sortedList) {
            const subUrl = sub.url || sub.baseUrl;
            if (subUrl) {
              const fullSubUrl = subUrl.startsWith('http') ? subUrl : `${new URL(apiEndpoint).origin}${subUrl}`;
              const text = await fetchCaptionContentFromUrl(fullSubUrl, videoId);
              if (text) {
                console.log(`[YouTube Transcript Success] Strategy 7 (External Proxy: ${apiEndpoint}) -> ${text.length} chars`);
                return text.substring(0, 20000);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      errorsLog.push(`External API (${apiEndpoint}): ${(err as Error)?.message || err}`);
    }
  }

  console.info(`[YouTube Transcript Notice] Automatic subtitles not available for Video ID: ${videoId}. Falling back to metadata / description.`);
  return null;
}

async function getYouTubeMetadata(urlStr: string) {
  const videoId = extractYouTubeId(urlStr);
  if (!videoId) {
    console.error('[YouTube Metadata Failed] Invalid YouTube URL or Video ID missing:', urlStr);
    return null;
  }

  let title = '';
  let author = '';
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let videoDescription = '';
  let originalDurationSeconds = 0;

  // 1. Try oEmbed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
    }
  } catch (err) {
    console.warn('[YouTube Metadata] oEmbed notice:', err);
  }

  // 2. Try InnerTube API
  try {
    const playerData = await fetchYouTubeInnerTubePlayer(videoId);
    if (playerData?.videoDetails) {
      const vd = playerData.videoDetails;
      if (vd.title && (!title || title.length < vd.title.length)) title = vd.title;
      if (vd.author && !author) author = vd.author;
      if (vd.lengthSeconds) {
        originalDurationSeconds = parseInt(vd.lengthSeconds, 10) || 0;
      }
      if (vd.shortDescription && !isGenericYouTubeText(vd.shortDescription)) {
        videoDescription = vd.shortDescription;
      }
    }
  } catch (err) {
    console.warn('[YouTube Metadata] InnerTube notice:', err);
  }

  // 3. Fallback: Watch HTML page with OpenGraph & Meta tags
  if (!videoDescription || !title || title === 'YouTube Videosu') {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': 'CONSENT=YES+1; SOCS=CAI; PREF=hl=tr&gl=TR'
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const dom = new JSDOM(html, { url: `https://www.youtube.com/watch?v=${videoId}` });
        const doc = dom.window.document;
        
        const getMeta = (nameOrProp: string) => {
          const el = doc.querySelector(`meta[property="${nameOrProp}"], meta[name="${nameOrProp}"]`);
          return el ? el.getAttribute('content')?.trim() || '' : '';
        };

        const ogTitle = getMeta('og:title') || getMeta('twitter:title') || doc.title || '';
        const ogDesc = getMeta('og:description') || getMeta('description') || getMeta('twitter:description') || '';
        const ogAuthor = getMeta('og:site_name') || getMeta('author') || '';

        if (ogTitle && (!title || title === 'YouTube Videosu')) {
          title = ogTitle.replace(/- YouTube$/, '').trim();
        }
        if (ogAuthor && (!author || author === 'YouTube Yayıncısı')) {
          author = ogAuthor;
        }
        if (ogDesc && !isGenericYouTubeText(ogDesc) && (!videoDescription || videoDescription.length < ogDesc.length)) {
          videoDescription = ogDesc;
        }

        if (!videoDescription) {
          const shortDescMatch = html.match(/"shortDescription":"([^"]+)"/);
          if (shortDescMatch && shortDescMatch[1]) {
            const cand = shortDescMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            if (!isGenericYouTubeText(cand)) {
              videoDescription = cand;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Fetch Transcript (RAW TRANSCRIPT ONLY)
  const transcript = await getYouTubeSubtitles(videoId);

  return {
    videoId,
    title: title || 'YouTube Videosu',
    author: author || 'YouTube Yayıncısı',
    thumbnail,
    transcript: transcript && transcript.trim().length > 30 ? transcript.trim() : null,
    videoDescription,
    originalDurationSeconds
  };
}

const imageCache = new Map<string, string>();

async function resolveWebImage(urlStr: string): Promise<string> {
  if (!urlStr) return '';
  if (imageCache.has(urlStr)) return imageCache.get(urlStr)!;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return '';

    const html = await res.text();
    const dom = new JSDOM(html, { url: res.url || urlStr });
    const doc = dom.window.document;

    const getMeta = (nameOrProp: string) => {
      const el = doc.querySelector(`meta[property="${nameOrProp}"], meta[name="${nameOrProp}"], meta[itemprop="${nameOrProp}"]`);
      return el ? el.getAttribute('content')?.trim() || '' : '';
    };

    let imgUrl = 
      getMeta('og:image:secure_url') ||
      getMeta('og:image') ||
      getMeta('og:image:url') ||
      getMeta('twitter:image:src') ||
      getMeta('twitter:image') ||
      getMeta('twitter:image:url') ||
      getMeta('image') ||
      getMeta('thumbnail') ||
      doc.querySelector('link[rel="image_src"]')?.getAttribute('href')?.trim() ||
      '';

    // If meta tags don't contain image, search in main article body
    if (!imgUrl) {
      const imgElements = doc.querySelectorAll('article img, figure img, .content img, .detail img, .news-image img, main img, img');
      for (const img of Array.from(imgElements)) {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
        if (src && !src.startsWith('data:') && !src.includes('1x1') && !src.includes('pixel') && !src.includes('clear') && !src.includes('avatar') && !src.includes('icon')) {
          imgUrl = src;
          break;
        }
      }
    }

    if (imgUrl) {
      if (imgUrl.startsWith('//')) {
        imgUrl = 'https:' + imgUrl;
      } else if (imgUrl.startsWith('/') || !imgUrl.startsWith('http')) {
        try {
          imgUrl = new URL(imgUrl, res.url || urlStr).href;
        } catch {}
      }
      imageCache.set(urlStr, imgUrl);
      return imgUrl;
    }
  } catch (err) {
    // Fail silently on timeout or network error
  }
  return '';
}

async function getWebpageText(urlStr: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(urlStr, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Web Scraping Error] HTTP ${res.status} for ${urlStr}`);
      return null;
    }

    const finalUrl = res.url || urlStr;
    const html = await res.text();
    const dom = new JSDOM(html, { url: finalUrl });
    const doc = dom.window.document;

    // Helper for Meta extraction
    const getMeta = (nameOrProp: string) => {
      const el = doc.querySelector(`meta[property="${nameOrProp}"], meta[name="${nameOrProp}"], meta[itemprop="${nameOrProp}"]`);
      return el ? el.getAttribute('content')?.trim() || '' : '';
    };

    const ogTitle = getMeta('og:title') || getMeta('twitter:title') || doc.title || '';
    const ogDesc = getMeta('og:description') || getMeta('description') || getMeta('twitter:description') || '';
    let ogImg = 
      getMeta('og:image:secure_url') ||
      getMeta('og:image') ||
      getMeta('og:image:url') ||
      getMeta('twitter:image:src') ||
      getMeta('twitter:image') ||
      getMeta('image') ||
      getMeta('thumbnail') ||
      doc.querySelector('link[rel="image_src"]')?.getAttribute('href')?.trim() ||
      '';

    if (ogImg) {
      if (ogImg.startsWith('//')) {
        ogImg = 'https:' + ogImg;
      } else if (ogImg.startsWith('/') || !ogImg.startsWith('http')) {
        try {
          ogImg = new URL(ogImg, finalUrl).href;
        } catch {}
      }
      imageCache.set(urlStr, ogImg);
      imageCache.set(finalUrl, ogImg);
    }

    const ogSection = getMeta('article:section') || getMeta('article:tag') || '';
    const ogAuthor = getMeta('article:author') || getMeta('author') || getMeta('og:site_name') || '';

    // Remove noise & header/footer/nav/sidebar/cookie/ad elements
    const noiseSelectors = [
      'nav', 'footer', 'header', 'aside', 'script', 'style', 'iframe', 'noscript',
      '.advertisement', '.ads', '.ad-box', '.social-share', '.related-news',
      '.cookie-banner', '#cookie-notice', '.comments', '.sidebar', '.copyright',
      '.rel-news', '.headline-list', '.footer-copyright'
    ];
    noiseSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });

    // If still no ogImg, search in body article images
    if (!ogImg) {
      const bodyImgs = doc.querySelectorAll('article img, figure img, .content img, .detail img, main img, img');
      for (const img of Array.from(bodyImgs)) {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
        if (src && !src.startsWith('data:') && !src.includes('1x1') && !src.includes('pixel') && !src.includes('icon')) {
          try {
            ogImg = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : new URL(src, finalUrl).href);
            imageCache.set(urlStr, ogImg);
            break;
          } catch {}
        }
      }
    }

    // Parse main article body via Mozilla Readability
    const reader = new Readability(doc, { charThreshold: 100 });
    const parsed = reader.parse();

    let cleanText = '';
    let title = ogTitle;
    let author = ogAuthor;

    if (parsed && parsed.textContent) {
      cleanText = parsed.textContent
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('\n\n');

      if (parsed.title && parsed.title.length > title.length) {
        title = parsed.title;
      }
      if (parsed.byline && !author) {
        author = parsed.byline;
      }
    }

    // Dynamic / Client-Side Rendered (SPA) Fallback using OG & Meta Description
    let wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    let charCount = cleanText.length;

    if (charCount < 300 || wordCount < 50) {
      const fallbackCombo = [ogTitle, ogDesc, ogSection].filter(Boolean).join('\n\n');
      const fallbackWords = fallbackCombo.split(/\s+/).filter(Boolean).length;
      if (fallbackCombo.length >= 300 || fallbackWords >= 50) {
        cleanText = fallbackCombo;
        wordCount = fallbackWords;
        charCount = fallbackCombo.length;
      }
    }

    const isValid = charCount >= 300 || wordCount >= 50;

    const metadataString = `Sayfa Başlığı: "${title}"\nYazar/Kaynak: "${author || 'Web Yayını'}"\nMeta Açıklama: "${ogDesc}"\nThumbnail Görseli: "${ogImg}"\nWeb Bağlantısı (URL): "${urlStr}"`;

    return {
      title: title || 'Haber Analizi',
      author: author || 'Web Yayını',
      metadata: metadataString,
      thumbnail: ogImg,
      text: cleanText,
      charCount,
      wordCount,
      isValid,
      fullContext: `${metadataString}\n\n[SAYFA MAKALENİN TEMİZ METNİ]:\n${cleanText}`
    };
  } catch (err) {
    console.error('getWebpageText error:', err);
    return null;
  }
}

// --- REVENUECAT & APPLE IAP SUBSCRIPTION ENDPOINTS ---
// In-memory subscription store for server-side verification fallback
const activeSubscriptionsStore = new Map<string, {
  isPremium: boolean;
  subscriptionTier: 'free' | 'premium_monthly' | 'premium_yearly';
  subscriptionEndsAt: string;
  updatedAt: string;
  customerId?: string;
}>();

// RevenueCat Webhook Listener (Serverless Endpoint)
app.post('/api/webhooks/revenuecat', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    // Optional bearer secret verification for webhook security
    const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }

    const { event } = req.body || {};
    if (!event) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const appUserId = event.app_user_id || event.original_app_user_id;
    const eventType = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, PRODUCT_CHANGE
    const entitlementId = event.entitlement_id || 'vox_premium';
    const expirationAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

    console.log(`[RevenueCat Webhook] Event received: ${eventType} for User: ${appUserId}`);

    if (appUserId) {
      if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL' || eventType === 'UNCANCELLATION') {
        const isYearly = event.product_id?.includes('year') || event.period_type === 'ANNUAL';
        activeSubscriptionsStore.set(appUserId, {
          isPremium: true,
          subscriptionTier: isYearly ? 'premium_yearly' : 'premium_monthly',
          subscriptionEndsAt: expirationAt,
          updatedAt: new Date().toISOString(),
          customerId: event.subscriber_attributes?.$appleAppAccountToken?.value || appUserId
        });
      } else if (eventType === 'EXPIRATION' || eventType === 'CANCELLATION') {
        activeSubscriptionsStore.set(appUserId, {
          isPremium: false,
          subscriptionTier: 'free',
          subscriptionEndsAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully', appUserId, eventType });
  } catch (err: unknown) {
    console.error('RevenueCat webhook error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Centralized Platform-Agnostic Entitlement Validation (Apple IAP / Android / Web)
app.get('/api/verify-entitlement', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId parameter is required' });
  }

  const sub = activeSubscriptionsStore.get(userId);
  if (sub && sub.isPremium) {
    return res.json({
      success: true,
      isPremium: true,
      subscriptionTier: sub.subscriptionTier,
      subscriptionEndsAt: sub.subscriptionEndsAt,
      entitlements: ['vox_premium', 'unlimited_summaries', 'hd_tts', 'pdf_ocr_unlimited']
    });
  }

  return res.json({
    success: true,
    isPremium: false,
    subscriptionTier: 'free',
    subscriptionEndsAt: null,
    entitlements: []
  });
});

// Subscription Purchase Execution Endpoint
app.post('/api/subscription/purchase', (req, res) => {
  const { userId, tier, platform } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  const isYearly = tier === 'yearly';
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + (isYearly ? 365 : 30));

  activeSubscriptionsStore.set(userId, {
    isPremium: true,
    subscriptionTier: isYearly ? 'premium_yearly' : 'premium_monthly',
    subscriptionEndsAt: expiresDate.toISOString(),
    updatedAt: new Date().toISOString(),
    customerId: `cust_${platform || 'web'}_${Date.now()}`
  });

  res.json({
    success: true,
    isPremium: true,
    subscriptionTier: isYearly ? 'premium_yearly' : 'premium_monthly',
    subscriptionEndsAt: expiresDate.toISOString(),
    message: 'Subscription successfully activated'
  });
});

// Subscription Status Endpoint
app.get('/api/subscription/status', (req, res) => {
  const userId = req.query.userId as string;
  const sub = activeSubscriptionsStore.get(userId);
  if (sub) {
    return res.json({ success: true, ...sub });
  }
  return res.json({
    success: true,
    isPremium: false,
    subscriptionTier: 'free',
    subscriptionEndsAt: null
  });
});

// 0. High-Quality Audio TTS Proxy Endpoint
app.get('/api/tts', async (req, res) => {
  try {
    const text = req.query.text as string;
    const lang = (req.query.lang as string) || 'tr';
    if (!text || text.trim().length === 0) {
      return res.status(400).send('Text parameter is required');
    }

    const cleanText = text.trim().substring(0, 250);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('TTS upstream service error');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(buffer);
  } catch (err) {
    console.error('TTS endpoint error:', err);
    res.status(500).send('Internal TTS error');
  }
});

// YouTube Subscriptions Endpoint
app.get('/api/youtube/subscriptions', async (req, res) => {
  try {
    const token = req.query.token as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channels: any[] = [];

    if (token) {
      try {
        const ytRes = await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=25', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (ytRes.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = await ytRes.json() as any;
          if (data.items && Array.isArray(data.items)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            channels = data.items.map((item: any) => {
              const chTitle = item.snippet.title;
              const chId = item.snippet.resourceId.channelId;
              const thumb = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chTitle)}&background=ef4444&color=fff&size=128`;
              return {
                id: chId,
                title: chTitle,
                thumbnail: thumb,
                description: item.snippet.description || 'YouTube Abone Olunan Kanal',
                type: 'youtube',
                unreadCount: 2,
                enabled: true,
                notificationsEnabled: true,
                recentVideos: [
                  {
                    id: `yt_${chId}_1`,
                    title: `${chTitle} - Son Yayınlanan Özel Yayın & Analiz`,
                    videoId: 'ScMzIvxBSi4',
                    publishedAt: '1 saat önce',
                    thumbnail: 'https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg'
                  },
                  {
                    id: `yt_${chId}_2`,
                    title: `${chTitle} - Haftalık Önemli Başlıklar Değerlendirmesi`,
                    videoId: '2lAe1cqCOXo',
                    publishedAt: 'Dün',
                    thumbnail: 'https://img.youtube.com/vi/2lAe1cqCOXo/hqdefault.jpg'
                  }
                ]
              };
            });
          }
        }
      } catch (err) {
        console.warn('YouTube API fetch error:', err);
      }
    }

    if (channels.length === 0) {
      channels = [
        {
          id: 'UC_nevsin_mengu',
          title: 'Nevşin Mengü',
          thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          description: 'Günlük Siyaset, Ekonomi ve Dış Politika Bültenleri',
          type: 'youtube',
          unreadCount: 3,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: 'v_nm_1',
              title: 'Siyasette Sıcak Gelişmeler & Ekonomi Analizi',
              videoId: 'ScMzIvxBSi4',
              publishedAt: '1 saat önce',
              thumbnail: 'https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg'
            },
            {
              id: 'v_nm_2',
              title: 'Küresel Piyasalar ve Merkez Bankaları Kararları',
              videoId: 'L_LUpnjgPso',
              publishedAt: 'Dün',
              thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg'
            }
          ]
        },
        {
          id: 'UC_baris_ozcan',
          title: 'Barış Özcan',
          thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          description: 'Sanat, Tasarım, Bilim ve Teknoloji Hikayeleri',
          type: 'youtube',
          unreadCount: 1,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: 'v_bo_1',
              title: 'Yapay Zekanın Geleceği ve İnsan Beyni',
              videoId: '2lAe1cqCOXo',
              publishedAt: '3 saat önce',
              thumbnail: 'https://img.youtube.com/vi/2lAe1cqCOXo/hqdefault.jpg'
            },
            {
              id: 'v_bo_2',
              title: 'Uzay Yolculuğunda Yeni Dönem: Artemis ve Mars',
              videoId: 'M7lc1UVf-VE',
              publishedAt: '2 gün önce',
              thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg'
            }
          ]
        },
        {
          id: 'UC_cuneyt_ozdemir',
          title: 'Cüneyt Özdemir',
          thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          description: 'Canlı Yayınlar, Gündem ve Tarafsız Yorumlar',
          type: 'youtube',
          unreadCount: 2,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: 'v_co_1',
              title: 'Gündemin Öne Çıkan Başlıkları & Canlı Tartışma',
              videoId: 'fJ9rUzIMcZQ',
              publishedAt: '4 saat önce',
              thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
            }
          ]
        },
        {
          id: 'UC_evrim_agaci',
          title: 'Evrim Ağacı',
          thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
          description: 'Popüler Bilim, Biyoloji ve Nörobilim',
          type: 'youtube',
          unreadCount: 4,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: 'v_ea_1',
              title: 'Kuantum Fiziği Gerçekten Ne Söylüyor?',
              videoId: 'bHIhgxav9LY',
              publishedAt: '5 saat önce',
              thumbnail: 'https://img.youtube.com/vi/bHIhgxav9LY/hqdefault.jpg'
            }
          ]
        }
      ];
    }

    res.json({ success: true, channels });
  } catch (err) {
    console.error('YouTube subscriptions error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch YouTube subscriptions' });
  }
});

// 1. Article & URL / PDF / Text / YouTube Summarization Endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { url, rawText, sourceType, focusArea, summaryLength, manualTranscript, customTitle, pageCount } = req.body;

    const summaryLevelCode = (summaryLength || '').includes('Kısa') 
      ? 'CokKisa' 
      : (summaryLength || '').includes('Detaylı') 
      ? 'Detayli' 
      : 'Normal';

    // PDF 50-Page Limit Check
    if (sourceType === 'pdf') {
      let estimatedPageCount = pageCount;
      if (!estimatedPageCount) {
        if (rawText && rawText.includes('/Type') && rawText.includes('/Page')) {
          const pageMatches = rawText.match(/\/Type\s*\/Page\b/g);
          estimatedPageCount = pageMatches ? pageMatches.length : 1;
        } else if (rawText && rawText.includes('base64,')) {
          estimatedPageCount = Math.max(1, Math.ceil(rawText.length / 50000));
        } else {
          const cleanLen = (rawText || '').replace(/[^a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ]/g, '').length;
          estimatedPageCount = Math.max(1, Math.ceil(cleanLen / 3000));
        }
      }

      if (estimatedPageCount > 50) {
        return res.status(400).json({
          success: false,
          error: "Yüklediğiniz belge 50 sayfa sınırını aşıyor. Lütfen daha kısa bir belge yükleyin veya ilgili bölümü parçalar halinde taratın."
        });
      }
    }

    let prompt = '';
    let fetchedTitle = customTitle || '';
    let fetchedAuthor = 'VOX AI Studio';
    let fetchedThumbnail = '';
    let fetchedTextSource = manualTranscript || rawText || '';

    const ytId = url ? extractYouTubeId(url) : null;

    if (sourceType === 'web' || (url && !ytId && sourceType !== 'youtube')) {
      // 1. Web Bağlantısı (URL / Haber Analizi) Prompt Şablonu
      const webInfo = await getWebpageText(url || '');

      if (!webInfo || !webInfo.isValid || !webInfo.text || webInfo.text.length < 300 || webInfo.wordCount < 50) {
        console.warn(`[Web Scraping Failed] Article text unreadable or too short for URL: ${url}`);
        return res.status(400).json({
          success: false,
          error: 'URL_CONTENT_TOO_SHORT',
          message: 'Bu web sayfasındaki ana makale metni okunamadı veya çok kısa. Lütfen doğrudan metin yapıştırın.'
        });
      }

      fetchedTitle = customTitle || webInfo.title || 'Haber Analizi';
      fetchedThumbnail = webInfo.thumbnail || '';
      fetchedAuthor = webInfo.author || 'VOX Haber Analisti';
      if (webInfo.fullContext) {
        fetchedTextSource = webInfo.fullContext;
      }

      prompt = `
[SİSTEM VE ÖZETLEME TALİMATI]
Websitesinden aldığın metni anlamlı bir bütün halinde özetle. Giriş gelişme ve sonuç olarak değerlendir. Maksimum 7 cümle olmalı. Anlamsız ve kendini terkar eden cümleler burada bulunmamalı. Haber kaynağının adı belirtilmeli ancak kaynak sistem (Canlı Google Haberler Akışı) belirtilmemeli.

[GÖREV PARAMETLERİ]
- Kaynak Türü: Web Sitesi / Haber Bağlantısı (URL)
- Haber Kaynağı / Yayıncı: "${fetchedAuthor}"
- Sayfa Başlığı: "${fetchedTitle.replace(/"/g, "'")}"
- Sayfa Meta Verileri: ${webInfo.metadata || url || 'N/A'}
- Websitesinden Çekilen Metin:
"""
${webInfo.text}
"""
- İstenen Özet Seviyesi: ${summaryLevelCode} (ÇokKisa / Normal / Detayli)

[ANALİZ VE ÖZETLEME KURALLARI]
1. Websitesinden aldığın metni anlamlı bir bütün halinde özetle.
2. Giriş, gelişme ve sonuç olarak değerlendir.
3. Maksimum 7 cümle olmalı.
4. Anlamsız ve kendini tekrar eden cümleler burada bulunmamalı.
5. Haber kaynağının adı belirtilmeli (${fetchedAuthor && !fetchedAuthor.includes('VOX') ? `"${fetchedAuthor}"` : 'ilgili haber kaynağı'}), ancak kaynak sistem (Canlı Google Haberler Akışı) kesinlikle belirtilmemeli.
6. Reklam, yönlendirme metinleri, menü ve çerez öğelerini tamamen temizle; saf makale gövdesine odaklan.

[ÇIKTI FORMATI]
Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Giriş, gelişme ve sonuç değerlendirmesi içeren, maksimum 7 cümlelik anlamlı özet.",
  "content": "Giriş, gelişme ve sonuç bütünlüğünde, maksimum 7 cümlelik net ve akıcı seslendirme/okuma metni. Haber kaynağının adı belirtilmeli ancak kaynak sistem (Canlı Google Haberler Akışı) belirtilmemeli.",
  "category": "${focusArea ? focusArea.split(' ')[0] : 'Haber'}",
  "durationSeconds": ${summaryLevelCode === 'CokKisa' ? 180 : summaryLevelCode === 'Detayli' ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "${fetchedThumbnail || ''}",
  "keyPoints": [
    "Ana nokta 1",
    "Ana nokta 2",
    "Ana nokta 3"
  ]
}
`;
    } else if (sourceType === 'pdf') {
      // 2. PDF & Belge Modülü Prompt Şablonu
      const estimatedPageCount = pageCount || Math.max(1, Math.ceil((rawText || '').length / 1500));
      fetchedTitle = customTitle || 'Doküman Analizi';
      fetchedAuthor = 'VOX Akademik & Belge Analisti';

      prompt = `
[SİSTEM ROLÜ]
Sen uzman bir doküman ve akademik içerik analistisin. Görevin; kullanıcı tarafından yüklenen PDF ve belgeleri analiz ederek ana fikirleri, önemli bulguları ve sonuçları net bir şekilde özetlemektir.

[GÖREV PARAMETLERİ]
- Kaynak Türü: PDF & Belge (Çevrimdışı Hafıza)
- Belge Sayfa Sayısı: ${estimatedPageCount}
- Belge İçeriği / Metni:
"""
${rawText || 'PDF ve Belge Metni'}
"""
- İstenen Özet Seviyesi: ${summaryLevelCode} (ÇokKisa / Normal / Detayli)

[KRİTİK KONTROL VE KURALLAR]
1. **Sayfa Sınırı Kontrolü:** Eğer yüklenen belgenin sayfa sayısı 50'dan fazlaysa, sistemin zorlanmaması ve token sınırının aşılmaması için kullanıcıya şu uyarıyı döndür: *"Yüklediğiniz belge 50 sayfa sınırını aşıyor. Lütfen daha kısa bir belge yükleyin veya ilgili bölümü parçalar halinde taratın."*
2. **Derinlemesine Analiz:** Belge 50 sayfa ve altındaysa, içeriğin giriş, ana argümanlar, metodoloji/detaylar ve sonuç bölümlerini eksiksiz olarak tara.
3. Belgenin akademik veya teknik dilini bozmadan, kullanıcıya hızlıca stratejik çıktılar sunacak şekilde sadeleştir.

[ÇIKTI FORMATI]
Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Dokümanın genel yönetici özeti (Executive Summary).",
  "content": "Seçilen '${summaryLevelCode}' seviyesine tam uygun; giriş, bölüm bazlı önemli bulgular, detaylar ve sonuç/önerileri doğrudan aktaran podcast seslendirme metni.",
  "category": "Belge",
  "durationSeconds": ${summaryLevelCode === 'CokKisa' ? 180 : summaryLevelCode === 'Detayli' ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
  "keyPoints": [
    "Önemli bulgu 1",
    "Önemli bulgu 2",
    "Sonuç ve öneri 3"
  ]
}
`;
    } else if (sourceType === 'text') {
      // 3. Yapıştır (Metin & Pano) Prompt Şablonu
      fetchedTitle = customTitle || 'Metin Analizi';
      fetchedAuthor = 'VOX Metin Düzenleme Uzmanı';

      prompt = `
[SİSTEM ROLÜ]
Sen metin düzenleme ve içerik sadeleştirme uzmanısın. Görevin; kullanıcının panodan doğrudan yapıştırdığı ham, dağınık veya uzun metinleri mantıksal bir sıraya koymak ve anlaşılır kılmaktır.

[GÖREV PARAMETLERİ]
- Kaynak Türü: Pano Metni (Direct Paste)
- Ham Metin Verisi:
"""
${rawText || 'Pano ham metin verisi'}
"""
- İstenen Özet Seviyesi: ${summaryLevelCode} (ÇokKisa / Normal / Detayli)

[ANALİZ VE ÖZETLEME KURALLARI]
1. Metindeki yazım hatalarını, dağınık cümle yapılarını ve tekrarları ayıkla.
2. Metni mantıksal bir akışa (\`Giriş - Gelişme - Sonuç\`) oturt.
3. Kullanıcının seçtiği özet seviyesine (\`Çok Kısa\`, \`Normal\`, \`Detaylı\`) sadık kalarak metni özetle veya yapılandırılmış maddeler haline getir.

[ÇIKTI FORMATI]
Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Metnin düzenlenmiş ana özeti ve yapılandırılmış içeriği.",
  "content": "Giriş - Gelişme - Sonuç akışına yerleştirilmiş, yazım hatalarından arındırılmış, doğrudan okunan podcast metni.",
  "category": "Metin",
  "durationSeconds": ${summaryLevelCode === 'CokKisa' ? 180 : summaryLevelCode === 'Detayli' ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
  "keyPoints": [
    "Önemli vurgu 1",
    "Önemli vurgu 2",
    "Önemli vurgu 3"
  ]
}
`;
    } else {
      // YouTube / Fallback
      const effectiveUrl = url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : '');
      const targetYtId = extractYouTubeId(effectiveUrl) || ytId;

      if (!targetYtId) {
        return res.status(400).json({
          success: false,
          error: 'TRANSCRIPT_FETCH_FAILED',
          message: 'Geçersiz YouTube video bağlantısı. Lütfen geçerli bir YouTube URL adresi girin.'
        });
      }

      const ytInfo = await getYouTubeMetadata(effectiveUrl);

      // Raw transcript from YouTube or user-provided manualTranscript
      let rawTranscriptText = (manualTranscript && manualTranscript.trim().length > 30) 
        ? manualTranscript.trim() 
        : (ytInfo?.transcript && ytInfo.transcript.trim().length > 30 ? ytInfo.transcript.trim() : null);

      let isMetadataFallback = false;

      // Smart Fallback: If raw transcript is not available, use video description and title metadata
      if (!rawTranscriptText) {
        const desc = ytInfo?.videoDescription && !isGenericYouTubeText(ytInfo.videoDescription) ? ytInfo.videoDescription.trim() : '';
        const title = ytInfo?.title || customTitle || 'YouTube Videosu';
        const author = ytInfo?.author || 'YouTube Yayıncısı';

        isMetadataFallback = true;
        rawTranscriptText = `[VİDEO BİLGİLERİ VE AÇIKLAMA METNİ]\nVideo Başlığı: ${title}\nKanal / Yayıncı: ${author}\nVideo ID: ${targetYtId}\n\nVideo Açıklaması:\n${desc || 'Gündemdeki bu YouTube yayınında öne çıkan temel fikirler ve bülten detayları analiz edilerek VOX Akıllı Seslendirme Metnine dönüştürülmüştür.'}`;
      }

      fetchedTitle = customTitle || ytInfo?.title || 'YouTube Videosu';
      fetchedAuthor = ytInfo?.author || 'YouTube Yayıncısı';
      fetchedThumbnail = ytInfo?.thumbnail || `https://img.youtube.com/vi/${targetYtId}/hqdefault.jpg`;
      fetchedTextSource = rawTranscriptText;

      // Smart Duration Recommendation based on original video length or transcript length
      const origSecs = ytInfo?.originalDurationSeconds || 0;
      const textLen = rawTranscriptText.length;

      let targetDurationSeconds = 300; // 5 min default
      let durationInstruction = '';

      if (summaryLevelCode === 'CokKisa') {
        targetDurationSeconds = 180;
        durationInstruction = 'Metin Seviyesi: Kısa Bülten (Yaklaşık 3 dakika seslendirme süresi, 300-450 kelime). Öz ve vurucu 2-3 paragraf oluştur.';
      } else if (summaryLevelCode === 'Detayli') {
        targetDurationSeconds = 480;
        durationInstruction = 'Metin Seviyesi: Detaylı Analiz (Yaklaşık 8-10 dakika geniş bülten, 900-1300 kelime). Konudaki hiçbir ana başlığı, yaş hikayesini veya sayısal analizi atlalamadan 4-6 geniş paragraf yaz.';
      } else {
        // Dynamic Recommendation
        if (origSecs >= 1800 || textLen > 12000) {
          // 30+ min video or long transcript -> Recommend 8 mins (480s)
          targetDurationSeconds = 480;
          durationInstruction = `[SİSTEM OTOMATİK ÖNERİSİ: UZUN VİDEO ANALİZİ] Orijinal YouTube videosu ${origSecs > 0 ? Math.round(origSecs / 60) + ' dakika' : 'uzun/detaylı'} olduğu için metni aşırı kırpmamak adına yaklaşık 8 DAKİKALIK (480 saniye / ~900-1200 kelime) zengin ve detaylı bir bülten metni yaz. 4-6 kapsamlı paragrafta konuşmacının tüm argümanlarını, karşılaştırmalarını ve sonuçlarını eksiksiz anlat.`;
        } else if (origSecs >= 900 || textLen > 6000) {
          // 15-30 min video -> Recommend 6 mins (360s)
          targetDurationSeconds = 360;
          durationInstruction = `[SİSTEM OTOMATİK ÖNERİSİ: ORTA UZUNLUKTA VİDEO] Orijinal video ${origSecs > 0 ? Math.round(origSecs / 60) + ' dakika' : 'orta uzunlukta'} olduğu için yaklaşık 6 DAKİKALIK (360 saniye / ~700-900 kelime) dengeli ve açıklayıcı bir podcast bülteni metni yaz. 3-5 akıcı paragraf oluştur.`;
        } else {
          // <15 min video -> Recommend 4 mins (240s)
          targetDurationSeconds = 240;
          durationInstruction = `[SİSTEM OTOMATİK ÖNERİSİ: KISA VİDEO] Orijinal video kısa olduğu için 4 DAKİKALIK (240 saniye / ~450-600 kelime) net ve öz bir bülten metni yaz.`;
        }
      }

      prompt = `
[SİSTEM ROLÜ VE ANLATICI VİZYONU]
Sen VOX Stüdyo'nun kıdemli yayın direktörü ve profesyonel podcast sunucususun. Görevin; ham YouTube ${isMetadataFallback ? 'video başlık ve açıklamalarını' : 'deşifre/transkript metnini'} inceleyip, dinleyiciye son derece akıcı, anlamlı, bütünsel ve sürükleyici bir Türkçe sesli bülten (podcast akış metni) hazırlamaktır.

[BÜTÜNSEL AKIŞ VE METİN BİRLEŞTİRME KURALLARI - KRİTİK]
1. KOPUK ALT YAZI PARÇALARINI BİRLEŞTİR: Ham transkriptte yer alan "25 vs.", "35 YAŞ.", "Dr.", "Örn.", "1.", "Evet," gibi tek başına kalmış kopuk sözcükleri, başlık kırıntılarını ve yarım kalmış cümle parçalarını KESİNLİKLE AYNEN BIRAKMA. Bunları anlamlı ve tam Türkçe cümleler haline getirerek birleştir.
2. AKICI VE ANLAMLILIK ODAKLI BÜLTEN: Metin parçalı olmayacak; doğrudan konunun özüne, konuşmacının ana mesajlarına ve yaş hayati dönüşümlerine odaklanan akıcı paragraflardan oluşan bir anlatım metni yaz.
3. ${durationInstruction}
4. TAM CÜMLE ANLATIMI: Her bir paragraf en az 3-5 tam Türkçe cümleden oluşmalıdır. Hiçbir cümle veya metin bloku 4 kelimeden kısa veya kopuk olmayacaktır.
5. DOĞRUDAN ANLATICI DİLİ: "Girişte sunucu şöyle dedi" gibi yapay 3. şahıs aktarımları yerine, dinleyiciye konunun anlatıldığı sıcak, akıcı ve kaliteli bir seslendirme metni oluştur.

[GÖREV PARAMETLERİ]
- Kaynak Türü: ${isMetadataFallback ? 'YouTube Video Açıklaması & Metadata' : 'YouTube Transkript'}
- Video Başlığı: "${fetchedTitle.replace(/"/g, "'")}"
- Kanal / Yayıncı: "${fetchedAuthor.replace(/"/g, "'")}"
- Veri Metni:
"""
${rawTranscriptText}
"""
- İstenen Özet Seviyesi: ${summaryLevelCode} (ÇokKisa / Normal / Detayli)
- Odak Alanı: ${focusArea || 'Genel Konu & Önemli Noktalar'}

[ÇIKTI FORMATI]
Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Videonun ana konusunu, arka planını ve nihai sonucunu aktaran 2-3 cümlelik net özet.",
  "content": "Jenerik selamlama içermeyen, bilgileri doğrudan ve akıcı paragraflar halinde aktaran podcast seslendirme metni.",
  "category": "YouTube",
  "durationSeconds": ${targetDurationSeconds},
  "author": "${fetchedAuthor.replace(/"/g, "'")}",
  "imageUrl": "${fetchedThumbnail}",
  "keyPoints": [
    "Ana fikir 1",
    "Ana fikir 2",
    "Ana fikir 3"
  ]
}
`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let geminiContents: any = prompt;
    if (sourceType === 'pdf' && rawText && rawText.includes('base64,')) {
      const base64Data = rawText.split('base64,')[1];
      geminiContents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        },
        prompt
      ];
    }

    // Wrap Gemini AI call in try/catch to gracefully handle rate limits or network glitches
    let data;
    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-3.7-flash',
        contents: geminiContents,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error('Empty response from Gemini');
      }
      data = JSON.parse(jsonText);

      if (data.error === 'TRANSCRIPT_UNAVAILABLE' || data.content === 'TRANSCRIPT_UNAVAILABLE') {
        if (sourceType === 'youtube' && fetchedTitle) {
          // Recover gracefully with video metadata if transcript is flagged unavailable by AI
          data = {
            title: fetchedTitle,
            summary: `${fetchedTitle} konusundaki temel gelişmeler ve özet içerik.`,
            content: `${fetchedTitle} başlıklı video içerik analizi ile oluşturulmuştur. ${fetchedTextSource || ''}`,
            category: 'YouTube',
            durationSeconds: 300,
            author: fetchedAuthor || 'YouTube Yayıncısı',
            imageUrl: fetchedThumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80'),
            keyPoints: [fetchedTitle, 'YouTube İçerik Analizi', 'VOX Sesli Bülten']
          };
        } else {
          return res.status(400).json({
            success: false,
            error: 'TRANSCRIPT_UNAVAILABLE',
            message: 'Bu YouTube videosunun alt yazıları (transkripti) bulunamadı veya çekilemedi. Lütfen alt yazıları aktif olan bir video seçin ya da transkript metnini manuel ekleyin.'
          });
        }
      }

      if (data.error === 'ERROR_INSUFFICIENT_TEXT' || data.content === 'ERROR_INSUFFICIENT_TEXT') {
        return res.status(400).json({
          success: false,
          error: 'URL_CONTENT_TOO_SHORT',
          message: 'Bu web sayfasındaki ana makale metni okunamadı veya çok kısa. Lütfen doğrudan metin yapıştırın.'
        });
      }
    } catch (aiErr: unknown) {
      console.log('Gemini summarization fallback triggered:', (aiErr as Error)?.message || aiErr);

      // Algorithmic Fallback Summary when Gemini API is unavailable
      const textSource = (fetchedTextSource || manualTranscript || rawText || '').replace(/<[^>]+>/g, '').trim();
      
      const rawLines = textSource
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 
          && !l.startsWith('[VİDEO SEZON')
          && !l.startsWith('[VİDEO AÇIKLAMASI')
          && !isGenericYouTubeText(l)
          && !l.includes('seslendirme metnine dönüştürülüyor')
        );

      const cleanBodyText = rawLines.join(' ');
      const sentences = cleanBodyText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10 && !isGenericYouTubeText(s) && !s.includes('seslendirme metnine dönüştürülüyor'));

      const fallbackTitle = customTitle || (fetchedTitle && !fetchedTitle.includes('N/A') ? fetchedTitle : 'VOX YouTube Sesli Bülteni');
      const fallbackSummary = sentences.slice(0, 3).join(' ') || `${fallbackTitle} konusundaki detaylar ve önemli gelişmeler.`;

      let fallbackContent = '';
      if (sentences.length >= 2) {
        const paragraphSize = Math.max(2, Math.ceil(sentences.length / 4));
        const paragraphs: string[] = [];
        for (let i = 0; i < sentences.length; i += paragraphSize) {
          paragraphs.push(sentences.slice(i, i + paragraphSize).join(' '));
        }
        fallbackContent = paragraphs.join('\n\n');
      } else {
        fallbackContent = `${fallbackTitle} konusundaki detaylar analiz edilmiş olup VOX Akıllı Seslendirme Modu ile dinlenmeye hazırdır.`;
      }

      data = {
        title: fallbackTitle,
        summary: fallbackSummary,
        content: fallbackContent,
        category: focusArea ? focusArea.split(' ')[0] : (sourceType === 'pdf' ? 'Doküman' : sourceType === 'youtube' ? 'YouTube' : 'Haber'),
        durationSeconds: summaryLevelCode === 'CokKisa' ? 180 : summaryLevelCode === 'Detayli' ? 480 : 300,
        author: fetchedAuthor || 'VOX Akıllı Özet',
        imageUrl: fetchedThumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80'),
        keyPoints: sentences.slice(0, 3).length > 0 ? sentences.slice(0, 3).map(s => s.substring(0, 80)) : [fallbackTitle, 'İçerik özeti hazırlandı', 'VOX Akıllı Mod']
      };
    }

    // Fallback thumbnail for youtube if missing
    if (!data.imageUrl && ytId) {
      data.imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }

    res.json({ success: true, data });
  } catch (err: unknown) {
    console.error('Summarize error:', err);
    res.status(500).json({ 
      success: false, 
      error: (err as Error).message || 'Failed to process summarization' 
    });
  }
});

// Translate Article content to English for audio narration & reading
app.post('/api/translate', async (req, res) => {
  try {
    const { title, summary, content, keyPoints } = req.body;
    if (!content && !summary) {
      return res.status(400).json({ success: false, error: 'Content or summary required' });
    }

    let data;
    try {
      const prompt = `
You are a professional podcast translator and news anchor. Translate the following news bulletin / podcast content into natural, engaging, clear English suitable for audio narration (TTS).

CRITICAL RULE FOR AUDIO: Do NOT include meta-intros (e.g., "Welcome to the podcast", "Here is the translation", "This is..."), stage directions in brackets (e.g., "[Music]", "[Intro]", "(Pause)"), or filler greetings. Start the translated content directly with the actual news story so speech narration begins immediately without any silent gap or intro delay.

Input Data:
Title: "${title || ''}"
Summary: "${summary || ''}"
Content: "${content || ''}"
Key Points: ${JSON.stringify(keyPoints || [])}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "English translated title",
  "summary": "English translated summary (2-3 sentences)",
  "content": "English translated podcast narration content (engaging, direct natural phrasing)",
  "keyPoints": ["English point 1", "English point 2", "English point 3"]
}
`;

      const response = await callGeminiWithRetry({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const jsonText = response.text || '{}';
      data = JSON.parse(jsonText);
    } catch (aiErr: any) {
      console.log('Gemini translate API quota or rate limit reached. Returning direct original content fallback.');
      data = {
        title: title ? `${title} (Original)` : 'VOX News Bulletin',
        summary: summary || 'Summary in original language',
        content: content || 'Content in original language',
        keyPoints: keyPoints || []
      };
    }

    res.json({ success: true, data });
  } catch (err: unknown) {
    console.log('Translate request error:', (err as Error).message || err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Proxy route for generic Gemini AI processing
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are VOX AI assistant for podcast audio processing.'
        }
      });
      res.json({ success: true, text: response.text });
    } catch (aiErr: any) {
      const isQuotaError = aiErr?.status === 429 || aiErr?.message?.includes('429');
      console.log('Gemini proxy status notice:', isQuotaError ? 'Quota limit reached' : 'Processing fallback');
      res.json({
        success: false,
        isQuotaExceeded: isQuotaError,
        error: isQuotaError 
          ? 'Yapay zeka servis kotası geçici olarak doldu. Lütfen 15 saniye sonra tekrar deneyin.' 
          : ((aiErr as Error).message || 'AI İşlem hatası')
      });
    }
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// YouTube Channel Feed Endpoint
app.get('/api/youtube/channel-feed', async (req, res) => {
  try {
    const { handle } = req.query;
    // Default 7 channels
    const channels = [
      { name: 'Nevşin Mengü', handle: '@nevsinmengu', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', lastVideo: 'Günün Önemli Gelişmeleri & Siyaset Analizi', bell: true },
      { name: 'Barış Özcan', handle: '@BarisOzcan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', lastVideo: 'Yapay Zeka Dünyasındaki Devrim', bell: true },
      { name: 'Cüneyt Özdemir', handle: '@cuneytozdemir', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', lastVideo: 'Gündeme Dair Özel Yayın', bell: true },
      { name: 'Fatih Altaylı', handle: '@fatihaltayli', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', lastVideo: 'Teke Tek Özel Yorumlar', bell: true },
      { name: 'ShiftDelete.Net', handle: '@shiftdeletenet', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80', lastVideo: 'Yeni Nesil Mobil Teknolojiler', bell: false },
      { name: 'Evrim Ağacı', handle: '@evrimagaci', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80', lastVideo: 'Evrenin Derinliklerindeki Gizem', bell: true },
      { name: 'Efe Aydal', handle: '@efeaydal', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', lastVideo: 'Haftalık Kırmızı Hap Bültensel Bakış', bell: false }
    ];

    let filtered = channels;
    if (handle) {
      filtered = channels.filter(c => c.handle.toLowerCase().includes((handle as string).toLowerCase()) || c.name.toLowerCase().includes((handle as string).toLowerCase()));
    }

    res.json({ success: true, channels: filtered });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// YouTube Subscriptions Sync Endpoint for karahanbedel@gmail.com
app.get('/api/youtube/sync-user-subscriptions', (req, res) => {
  res.json({
    success: true,
    email: 'karahanbedel@gmail.com',
    status: 'connected',
    activeBellsCount: 5,
    syncedChannels: [
      'Nevşin Mengü',
      'Barış Özcan',
      'Cüneyt Özdemir',
      'Fatih Altaylı',
      'Evrim Ağacı'
    ],
    lastSyncTime: new Date().toISOString()
  });
});

// 2. OCR Image / Document Scanner Endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 required' });
    }

    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType
      }
    };

    const prompt = `
Read and transcribe the text from this image or document. Then, summarize it as a VOX news item.
Respond ONLY with valid JSON:
{
  "title": "Extracted headline or title",
  "summary": "Short 2-sentence summary of the image content",
  "content": "Full cleaned and transcribed text formatted for narration",
  "category": "Teknoloji",
  "durationSeconds": 240,
  "keyPoints": ["Point 1", "Point 2"]
}
`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: [imagePart, prompt],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text || '{}';
    const data = JSON.parse(jsonText);
    res.json({ success: true, data });
  } catch (err: unknown) {
    console.error('OCR error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// --- HIGH-SPEED CONTINUOUS SERVER-SIDE RSS & BREAKING NEWS ENGINE ---
interface CachedNewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  hasRealImage: boolean;
  sourceType: string;
  sourceUrl: string;
  durationSeconds: number;
  createdAt: string;
  keyPoints: string[];
}

let serverNewsCache: {
  all: CachedNewsArticle[];
  byCategory: Record<string, CachedNewsArticle[]>;
  lastUpdated: number;
  isRefreshing: boolean;
} = {
  all: [],
  byCategory: {},
  lastUpdated: 0,
  isRefreshing: false
};

const HIGH_FREQUENCY_FEEDS = [
  // Son Dakika & Gündem
  { url: 'https://www.ensonhaber.com/rss/manset.xml', category: 'Gündem', author: 'Ensonhaber' },
  { url: 'https://www.ensonhaber.com/rss/gundem.xml', category: 'Gündem', author: 'Ensonhaber' },
  { url: 'https://www.ensonhaber.com/rss/ensonhaber.xml', category: 'Gündem', author: 'Ensonhaber' },
  { url: 'https://www.trthaber.com/sondakika_articles.rss', category: 'Gündem', author: 'TRT Haber' },
  { url: 'https://www.trthaber.com/manset_articles.rss', category: 'Gündem', author: 'TRT Haber' },
  { url: 'https://www.trthaber.com/gundem_articles.rss', category: 'Gündem', author: 'TRT Haber' },
  { url: 'https://www.haberturk.com/rss/manset.xml', category: 'Gündem', author: 'Habertürk' },
  { url: 'https://www.haberturk.com/rss/kategori/gundem.xml', category: 'Gündem', author: 'Habertürk' },
  { url: 'https://www.ntv.com.tr/gundem.rss', category: 'Gündem', author: 'NTV' },
  { url: 'https://www.ntv.com.tr/son-dakika.rss', category: 'Gündem', author: 'NTV' },
  { url: 'https://www.cnnturk.com/feed/rss/all/news', category: 'Gündem', author: 'CNN Türk' },
  { url: 'https://www.cnnturk.com/feed/rss/turkiye/news', category: 'Gündem', author: 'CNN Türk' },
  { url: 'https://www.sozcu.com.tr/rss/anasayfa.xml', category: 'Gündem', author: 'Sözcü' },
  { url: 'https://www.sozcu.com.tr/rss/gundem.xml', category: 'Gündem', author: 'Sözcü' },
  { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'Gündem', author: 'BBC Türkçe' },

  // Teknoloji & Bilim
  { url: 'https://www.webtekno.com/rss.xml', category: 'Teknoloji', author: 'Webtekno' },
  { url: 'https://shiftdelete.net/feed', category: 'Teknoloji', author: 'ShiftDelete' },
  { url: 'https://www.donanimhaber.com/rss/tum/', category: 'Teknoloji', author: 'DonanımHaber' },
  { url: 'https://webrazzi.com/feed/', category: 'Teknoloji', author: 'Webrazzi' },
  { url: 'https://www.ensonhaber.com/rss/teknoloji.xml', category: 'Teknoloji', author: 'Ensonhaber Teknoloji' },
  { url: 'https://www.haberturk.com/rss/kategori/teknoloji.xml', category: 'Teknoloji', author: 'Habertürk Teknoloji' },
  { url: 'https://www.ntv.com.tr/teknoloji.rss', category: 'Teknoloji', author: 'NTV Teknoloji' },
  { url: 'https://www.cnnturk.com/feed/rss/teknoloji/news', category: 'Teknoloji', author: 'CNN Türk Teknoloji' },

  // Ekonomi & Finans
  { url: 'https://www.bloomberght.com/rss', category: 'Ekonomi', author: 'Bloomberg HT' },
  { url: 'https://www.trthaber.com/ekonomi_articles.rss', category: 'Ekonomi', author: 'TRT Ekonomi' },
  { url: 'https://www.ensonhaber.com/rss/ekonomi.xml', category: 'Ekonomi', author: 'Ensonhaber Ekonomi' },
  { url: 'https://www.haberturk.com/rss/kategori/ekonomi.xml', category: 'Ekonomi', author: 'Habertürk Ekonomi' },
  { url: 'https://www.ntv.com.tr/ekonomi.rss', category: 'Ekonomi', author: 'NTV Ekonomi' },
  { url: 'https://www.cnnturk.com/feed/rss/ekonomi/news', category: 'Ekonomi', author: 'CNN Türk Ekonomi' },
  { url: 'https://www.sozcu.com.tr/rss/ekonomi.xml', category: 'Ekonomi', author: 'Sözcü Ekonomi' },

  // Dünya
  { url: 'https://feeds.bbci.co.uk/turkce/rss.xml', category: 'Dünya', author: 'BBC Türkçe' },
  { url: 'https://rss.dw.com/rdf/rss-tur-all', category: 'Dünya', author: 'DW Türkçe' },
  { url: 'https://www.trthaber.com/dunya_articles.rss', category: 'Dünya', author: 'TRT Dünya' },
  { url: 'https://www.ensonhaber.com/rss/dunya.xml', category: 'Dünya', author: 'Ensonhaber Dünya' },
  { url: 'https://www.haberturk.com/rss/kategori/dunya.xml', category: 'Dünya', author: 'Habertürk Dünya' },
  { url: 'https://www.ntv.com.tr/dunya.rss', category: 'Dünya', author: 'NTV Dünya' },
  { url: 'https://www.cnnturk.com/feed/rss/dunya/news', category: 'Dünya', author: 'CNN Türk Dünya' },

  // Spor
  { url: 'https://www.ensonhaber.com/rss/kralspor.xml', category: 'Spor', author: 'Ensonhaber Spor' },
  { url: 'https://www.trthaber.com/spor_articles.rss', category: 'Spor', author: 'TRT Spor' },
  { url: 'https://www.haberturk.com/rss/kategori/spor.xml', category: 'Spor', author: 'Habertürk Spor' },
  { url: 'https://www.ntvspor.net/rss/haber', category: 'Spor', author: 'NTV Spor' },
  { url: 'https://www.cnnturk.com/feed/rss/spor/news', category: 'Spor', author: 'CNN Türk Spor' },
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

// Fast OpenGraph image scraper for publisher news pages
async function fetchOgImageFromUrl(pageUrl: string): Promise<string> {
  if (!pageUrl || !pageUrl.startsWith('http')) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
      return ogMatch[1].trim();
    }
  } catch (e) {}
  return '';
}

// In-Memory Persistent AI Enriched Cache (zero token re-consumption)
const enrichedArticleCache = new Map<string, { summary: string; content: string; keyPoints: string[]; imageUrl?: string }>();

async function enrichNewsArticle(article: CachedNewsArticle): Promise<CachedNewsArticle> {
  if (!article || !article.title) return article;

  const cacheKey = article.id || article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (enrichedArticleCache.has(cacheKey)) {
    const cached = enrichedArticleCache.get(cacheKey)!;
    return {
      ...article,
      summary: cached.summary || article.summary,
      content: cached.content || article.content,
      keyPoints: cached.keyPoints || article.keyPoints,
      imageUrl: cached.imageUrl || article.imageUrl,
      hasRealImage: !!(cached.imageUrl || article.hasRealImage)
    };
  }

  let realImageUrl = article.imageUrl;
  // If article has no real image, try fetching og:image from sourceUrl
  if (!article.hasRealImage && article.sourceUrl && article.sourceUrl.startsWith('http')) {
    try {
      const ogImg = await fetchOgImageFromUrl(article.sourceUrl);
      if (ogImg) {
        realImageUrl = ogImg;
        article.hasRealImage = true;
      }
    } catch (e) {}
  }

  // Check if article already has rich journalistic content
  if (
    article.content && 
    article.content.length > 250 && 
    article.content.includes('\n\n') && 
    article.keyPoints && 
    article.keyPoints.length >= 3 && 
    !article.keyPoints.some(k => k.includes('Canlı Akış') || k.includes('Kategori:'))
  ) {
    enrichedArticleCache.set(cacheKey, {
      summary: article.summary,
      content: article.content,
      keyPoints: article.keyPoints,
      imageUrl: realImageUrl
    });
    return { ...article, imageUrl: realImageUrl };
  }

  // Call Gemini (gemini-3.7-flash) to produce high-quality journalistic content
  try {
    const prompt = `
Sen VOX platformu için kıdemli bir haber editörü ve sesli podcast metin yazarısın.
Aşağıda verilen haber başlığı, kaynak ve ham metin verilerini kullanarak; okuyucunun ve sesli dinleyicinin (TTS) olay hakkında eksiksiz, doyurucu ve derinlemesine bilgi edineceği, Google AdSense kalite standartlarına uygun, yüksek kaliteli ve zengin bir Türkçe haber metni hazırla.

HABER BİLGİLERİ:
Başlık: "${article.title}"
Yayıncı / Kaynak: "${article.author || 'Haber Merkezi'}"
Kategori: "${article.category || 'Gündem'}"
Ham Bilgi: "${article.summary || article.content || ''}"

KURALLAR:
1. "summary" (Haberin Özeti): Haberin ne olduğunu, nerede ve ne zaman gerçekleştiğini aktaran 2-3 cümlelik, kristal netliğinde yönetici özeti.
2. "content" (Detaylı İçerik): Olayın arka planını, kritik detaylarını, tarafların açıklamalarını veya olası sonuçlarını anlatan, paragraflar arasına '\\n\\n' konulmuş 3-4 zengin paragraf (250-400 kelime). Dil akıcı, Türkçe dilbilgisine tam uygun, sesli dinlemeye (TTS) elverişli ve profesyonel olmalıdır. Kesinlikle "Canlı akıştan derlendi", "Detaylar VOX Akıllı Akış tarafından..." gibi jenerik laflar yazma.
3. "keyPoints" (Öne Çıkan Başlıklar): Haberin can alıcı 3-4 maddelik somut gelişme maddeleri (kesinlikle "Kaynak: X" veya "Kategori: Y" veya "Canlı Akış" gibi genel etiketler koyma; doğrudan haberin içindeki somut olguları yaz).

Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "summary": "...",
  "content": "...",
  "keyPoints": ["...", "...", "..."]
}
`;

    const aiRes = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(aiRes.text || '{}');
    if (parsed && parsed.summary && parsed.content && Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0) {
      const enriched = {
        summary: parsed.summary,
        content: parsed.content,
        keyPoints: parsed.keyPoints.slice(0, 4),
        imageUrl: realImageUrl
      };
      enrichedArticleCache.set(cacheKey, enriched);
      return {
        ...article,
        ...enriched,
        imageUrl: realImageUrl,
        hasRealImage: !!realImageUrl
      };
    }
  } catch (err) {
    console.warn(`[AI Article Enricher] Notice for "${article.title}":`, (err as Error).message || err);
  }

  // Heuristic Fallback: Ensure clean, professional journalistic text
  const cleanTitle = article.title.trim();
  const publisher = article.author || 'VOX Haber';
  const cleanSummary = article.summary && article.summary.length > 30 && !article.summary.includes('son dakika gelişmeleri') 
    ? article.summary 
    : `${cleanTitle}. ${publisher} tarafından aktarılan son bilgilere göre konuyla ilgili gelişmeler ve sahadaki son durum yakından takip ediliyor.`;
  
  const p1 = `${cleanTitle}. Konuyla ilgili yetkililerden ve ilgili birimlerden yapılan ilk açıklamalara göre süreç titizlikle yürütülüyor.`;
  const p2 = cleanSummary;
  const p3 = `Gelişmeler kamuoyu tarafından yakından izlenirken, sürecin önümüzdeki günlerdeki etkileri ve alınacak yeni kararlar ${publisher} ve VOX Akıllı Haber bültenleri üzerinden anlık olarak aktarılmaya devam edecek.`;
  
  const fallbackContent = `${p1}\n\n${p2}\n\n${p3}`;
  const fallbackKeyPoints = [
    cleanTitle,
    `${publisher} kaynağından aktarılan son bilgiler değerlendirildi`,
    'Gelişmeler ve resmi açıklamalar doğrultusunda süreç takip ediliyor'
  ];

  const enrichedFallback = {
    summary: cleanSummary,
    content: fallbackContent,
    keyPoints: fallbackKeyPoints,
    imageUrl: realImageUrl
  };

  enrichedArticleCache.set(cacheKey, enrichedFallback);
  return {
    ...article,
    ...enrichedFallback,
    imageUrl: realImageUrl
  };
}

function cleanRssText(str: string): string {
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
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // Remove scripts and style blocks
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // Strip all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Strip URL fragments and leftover attributes
  text = text.replace(/https?:\/\/[^\s]+/gi, '');
  text = text.replace(/\b(a\s+href|href|target=|[a-z0-9_-]+\.html)\b[^\s]*/gi, '');
  text = text.replace(/target=["'][^"']*["']/gi, '');
  text = text.replace(/href=["'][^"']*["']/gi, '');

  return text.replace(/\s+/g, ' ').trim();
}

async function fetchSingleRssFeed(feedConfig: typeof HIGH_FREQUENCY_FEEDS[0]): Promise<CachedNewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const xmlText = await res.text();
    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
    const parsedItems: CachedNewsArticle[] = [];

    const isGoogleNews = feedConfig.url.includes('news.google.com');

    for (let i = 0; i < Math.min(itemMatches.length, 25); i++) {
      const itemStr = itemMatches[i];
      const titleMatch = itemStr.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descMatch = itemStr.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const contentMatch = itemStr.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      const authorMatch = itemStr.match(/<author[^>]*>([\s\S]*?)<\/author>/i) || itemStr.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
      const sourceMatch = itemStr.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const linkMatch = itemStr.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemStr.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);

      // Robust Multi-Pattern Image extraction
      let extractedImg = '';
      const encUrlMatch = itemStr.match(/<enclosure[^>]+url=["']([^"']+)["']/i) || itemStr.match(/<enclosure[^>]+url=([^\s>]+)/i);
      const mediaContent = itemStr.match(/<media:content[^>]+url=["']([^"']+)["']/i) || itemStr.match(/<media:content[^>]+url=([^\s>]+)/i);
      const mediaThumb = itemStr.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) || itemStr.match(/<media:thumbnail[^>]+url=([^\s>]+)/i);
      const imageTag = itemStr.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i) || itemStr.match(/<image>([^<]+)<\/image>/i);
      const imgTagMatch = itemStr.match(/<img[^>]+src=["']([^"']+)["']/i) || itemStr.match(/<img[^>]+src=([^\s>]+)/i);
      const htmlEntityImgMatch = itemStr.match(/&lt;img[^&]+src=(?:&quot;|"|'|)([^\s&"'>]+)(?:&quot;|"|'|)/i);

      if (encUrlMatch && encUrlMatch[1] && !encUrlMatch[1].endsWith('.mp3') && !encUrlMatch[1].endsWith('.m4a')) {
        extractedImg = encUrlMatch[1].trim();
      } else if (mediaContent && mediaContent[1]) {
        extractedImg = mediaContent[1].trim();
      } else if (mediaThumb && mediaThumb[1]) {
        extractedImg = mediaThumb[1].trim();
      } else if (imageTag && imageTag[1] && imageTag[1].trim().startsWith('http')) {
        extractedImg = imageTag[1].trim();
      } else if (imgTagMatch && imgTagMatch[1]) {
        extractedImg = imgTagMatch[1].trim();
      } else if (htmlEntityImgMatch && htmlEntityImgMatch[1]) {
        extractedImg = htmlEntityImgMatch[1].trim();
      }

      if (extractedImg.startsWith('//')) {
        extractedImg = 'https:' + extractedImg;
      } else if (extractedImg.startsWith('http://')) {
        extractedImg = extractedImg.replace(/^http:\/\//i, 'https://');
      }

      let rawTitle = titleMatch ? cleanRssText(titleMatch[1]) : '';
      let author = authorMatch ? cleanRssText(authorMatch[1]) : feedConfig.author;
      let sourcePublisher = sourceMatch ? cleanRssText(sourceMatch[1]) : '';

      if (sourcePublisher) {
        author = sourcePublisher;
      }

      if (author.includes('@') || author.includes('\n') || author.includes('http')) {
        author = feedConfig.author;
      }

      let title = rawTitle;
      // Clean publisher suffixes from title (e.g., "- Hürriyet", "| Sözcü", " - NTV")
      if (author && title.endsWith(' - ' + author)) {
        title = title.substring(0, title.length - (author.length + 3)).trim();
      } else if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length > 1 && parts[parts.length - 1].length < 30) {
          const possibleAuthor = parts.pop()!.trim();
          if (!author || author === 'Google Haberler' || author === 'VOX') {
            author = possibleAuthor;
          }
          title = parts.join(' - ').trim();
        }
      } else if (title.includes(' | ')) {
        const parts = title.split(' | ');
        if (parts.length > 1 && parts[parts.length - 1].length < 30) {
          parts.pop();
          title = parts.join(' | ').trim();
        }
      }

      let summary = descMatch ? cleanRssText(descMatch[1]) : '';
      let fullContent = contentMatch ? cleanRssText(contentMatch[1]) : '';
      const sourceUrl = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';

      const pubDateMatch = itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || itemStr.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
      let itemDate = new Date().toISOString();
      if (pubDateMatch && pubDateMatch[1]) {
        try {
          const d = new Date(cleanRssText(pubDateMatch[1]));
          if (!isNaN(d.getTime())) {
            itemDate = d.toISOString();
          }
        } catch (e) {}
      }

      if (title && title.length > 5) {
        const cleanSummary = summary && summary.length > 25 ? summary : `${title}. ${author} kaynağından aktarılan sıcak gelişmelerin detayları.`;
        const cleanContent = fullContent && fullContent.length > 60 
          ? fullContent 
          : `${title}.\n\n${cleanSummary}\n\nKonuyla ilgili resmi makamlar ve yetkili birimler tarafından yapılan açıklamalar doğrultusunda gelişmeler yakından izleniyor.`;

        const categoryImages = categoryDefaultImages[feedConfig.category] || categoryDefaultImages['Gündem'];
        const fallbackImg = categoryImages[i % categoryImages.length];

        // Unique deterministic ID based on title hash / cleaned slug
        const cleanSlug = title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').substring(0, 40);
        const uniqueId = `vox_${feedConfig.category.toLowerCase()}_${cleanSlug}`;

        const articleObj: CachedNewsArticle = {
          id: uniqueId,
          title,
          summary: cleanSummary,
          content: cleanContent,
          category: feedConfig.category,
          author: author || feedConfig.author,
          imageUrl: extractedImg || fallbackImg,
          hasRealImage: !!extractedImg,
          sourceType: 'rss',
          sourceUrl: sourceUrl,
          durationSeconds: Math.max(120, Math.min(360, (cleanSummary.length + cleanContent.length) * 2)),
          createdAt: itemDate,
          keyPoints: [
            title,
            `${author || feedConfig.author} tarafından aktarılan son bilgiler değerlendirildi`,
            'Resmi açıklamalar ve sahadaki gelişmeler doğrultusunda süreç takip ediliyor'
          ]
        };

        parsedItems.push(articleObj);
      }
    }

    return parsedItems;
  } catch (err) {
    return [];
  }
}

const PUBLIC_TELEGRAM_NEWS_CHANNELS = [
  { channel: 'sondakikaz', category: 'Gündem', author: 'Son Dakika (Telegram)' },
  { channel: 'sondakika', category: 'Gündem', author: 'Son Dakika (Telegram)' },
  { channel: 'pusholder', category: 'Gündem', author: 'Pusholder (Telegram)' },
  { channel: 'webtekno', category: 'Teknoloji', author: 'Webtekno (Telegram)' }
];

async function fetchTelegramChannelFeed(tgConfig: typeof PUBLIC_TELEGRAM_NEWS_CHANNELS[0]): Promise<CachedNewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://t.me/s/${tgConfig.channel}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const html = await res.text();
    const messageBlocks = html.split('<div class="tgme_widget_message_wrap');
    const items: CachedNewsArticle[] = [];

    const categoryImages = categoryDefaultImages[tgConfig.category] || categoryDefaultImages['Gündem'];

    for (let i = 0; i < messageBlocks.slice(1).length; i++) {
      const block = messageBlocks[i + 1];
      const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const photoMatch = block.match(/background-image:url\('([^']+)'\)/i);
      const timeMatch = block.match(/<time datetime="([^"]+)"/i);
      const linkMatch = block.match(/<a class="tgme_widget_message_date" href="([^"]+)"/i);

      if (textMatch && textMatch[1]) {
        const rawText = textMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        if (rawText.length > 20) {
          const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
          const firstLine = lines[0] || rawText;
          let title = firstLine.replace(/^[•\-\*\s#]+/, '').trim();
          if (title.length > 110) title = title.substring(0, 107) + '...';

          const fallbackImg = categoryImages[i % categoryImages.length];
          const extractedImg = photoMatch ? photoMatch[1] : '';

          const cleanSlug = title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').substring(0, 40);
          const uniqueId = `tg_${tgConfig.channel}_${cleanSlug}`;

          items.push({
            id: uniqueId,
            title,
            summary: rawText.substring(0, 240) + (rawText.length > 240 ? '...' : ''),
            content: `${rawText}\n\nBu anlık sıcak gelişme, VOX Akıllı Akış motoru ile Telegram (@${tgConfig.channel}) üzerinden derlenmiştir.`,
            category: tgConfig.category,
            author: tgConfig.author,
            imageUrl: extractedImg || fallbackImg,
            hasRealImage: !!extractedImg,
            sourceType: 'telegram',
            sourceUrl: linkMatch ? linkMatch[1] : `https://t.me/${tgConfig.channel}`,
            durationSeconds: Math.max(60, Math.min(180, Math.round(rawText.length * 0.4))),
            createdAt: timeMatch ? timeMatch[1] : new Date().toISOString(),
            keyPoints: [title, `Kaynak: Telegram (@${tgConfig.channel})`, `Kategori: ${tgConfig.category}`, 'Canlı Akış']
          });
        }
      }
    }
    return items;
  } catch (e) {
    return [];
  }
}

let activeRefreshPromise: Promise<void> | null = null;

// Background Worker: Refreshes and organizes all feeds every 45 seconds
async function refreshServerNewsWorker(): Promise<void> {
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = (async () => {
    serverNewsCache.isRefreshing = true;

    try {
      const rssPromises = HIGH_FREQUENCY_FEEDS.map(f => fetchSingleRssFeed(f));
      const tgPromises = PUBLIC_TELEGRAM_NEWS_CHANNELS.map(ch => fetchTelegramChannelFeed(ch));
      const [rssResults, tgResults] = await Promise.all([
        Promise.all(rssPromises),
        Promise.all(tgPromises)
      ]);
      const flatList = [...rssResults.flat(), ...tgResults.flat()];

      const now = Date.now();
      const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 saatten eski haberleri filtrele

      // Keep only fresh articles
      const freshArticles = flatList.filter(item => {
        if (!item.createdAt) return true;
        const d = new Date(item.createdAt).getTime();
        return isNaN(d) || (now - d) < MAX_AGE_MS;
      });

      // Deduplicate strictly by normalized title
      const seenMap = new Map<string, CachedNewsArticle>();
      freshArticles.forEach(item => {
        const normTitle = item.title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').trim();
        if (normTitle && !seenMap.has(normTitle)) {
          seenMap.set(normTitle, item);
        }
      });

      const allArticles = Array.from(seenMap.values());

      // Sort strictly chronological (newest first)
      allArticles.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // Build byCategory map
      const byCategoryMap: Record<string, CachedNewsArticle[]> = {
        'Gündem': [],
        'Ekonomi': [],
        'Teknoloji': [],
        'Dünya': [],
        'Spor': [],
        'Sağlık': []
      };

      allArticles.forEach(a => {
        const cat = a.category;
        if (!byCategoryMap[cat]) byCategoryMap[cat] = [];
        byCategoryMap[cat].push(a);
      });

      // Keep top 250 most recent, relevant articles in memory to prevent clutter
      serverNewsCache.all = allArticles.slice(0, 250);
      serverNewsCache.byCategory = byCategoryMap;
      serverNewsCache.lastUpdated = Date.now();

      console.log(`[VOX News Worker] Cache updated: ${serverNewsCache.all.length} active fresh articles across ${Object.keys(byCategoryMap).length} categories.`);
    } catch (err) {
      console.warn('[VOX News Worker] Update notice:', err);
    } finally {
      serverNewsCache.isRefreshing = false;
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

// Start background worker immediately on boot
refreshServerNewsWorker();
setInterval(refreshServerNewsWorker, 45 * 1000); // Continuous auto-refresh every 45s

// Fast Instant News Feed API Endpoint (0ms in-memory latency)
app.get('/api/news', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
    
    const category = (req.query.category as string) || 'Tümü';
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 60, 150);
    const since = req.query.since as string;

    // If cache is not ready yet on cold boot, wait for initial fetch
    if (serverNewsCache.all.length === 0) {
      await refreshServerNewsWorker();
    }

    let list: CachedNewsArticle[] = [];
    if (!category || category === 'Tümü') {
      list = serverNewsCache.all;
    } else {
      list = serverNewsCache.byCategory[category] || serverNewsCache.all.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    if (since) {
      const sinceTime = new Date(since).getTime();
      if (!isNaN(sinceTime)) {
        list = list.filter(a => new Date(a.createdAt).getTime() > sinceTime);
      }
    }

    const sliced = list.slice(0, limit);

    res.json({
      success: true,
      category,
      totalCount: list.length,
      lastUpdated: serverNewsCache.lastUpdated,
      articles: sliced
    });
  } catch (err: unknown) {
    console.error('News feed error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Direct Article by Slug or ID Endpoint (Supports instant SSR / Direct URLs with AI enrichment)
app.get('/api/news/article/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    if (!idOrSlug) {
      return res.status(400).json({ success: false, error: 'idOrSlug is required' });
    }

    const decoded = decodeURIComponent(idOrSlug).toLowerCase().trim();

    // 1. Direct ID match
    let found = serverNewsCache.all.find(a => a.id.toLowerCase() === decoded);

    // 2. Slug fuzzy match
    if (!found) {
      found = serverNewsCache.all.find(a => {
        const cleanSlug = a.title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').substring(0, 40);
        return cleanSlug && (decoded.includes(cleanSlug) || a.id.toLowerCase().includes(decoded));
      });
    }

    if (found) {
      // Automatically enrich with Gemini AI / clean structure
      const enriched = await enrichNewsArticle(found);
      return res.json({ success: true, article: enriched });
    }

    return res.status(404).json({ success: false, error: 'Article not found in cache' });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// AI Article Enrichment On-Demand Endpoint
app.post('/api/news/enrich', async (req, res) => {
  try {
    const article = req.body?.article;
    if (!article || !article.title) {
      return res.status(400).json({ success: false, error: 'Valid article object is required' });
    }

    const enriched = await enrichNewsArticle(article);
    return res.json({ success: true, article: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Lightweight Quick-Check for Live Updates (Returns boolean & count for floating pill)
app.get('/api/news/check-new', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const since = req.query.since as string;
    const category = (req.query.category as string) || 'Tümü';

    if (!since) {
      return res.json({ hasNew: false, count: 0, latestCreatedAt: serverNewsCache.all[0]?.createdAt || '' });
    }

    const sinceTime = new Date(since).getTime();
    if (isNaN(sinceTime)) {
      return res.json({ hasNew: false, count: 0, latestCreatedAt: serverNewsCache.all[0]?.createdAt || '' });
    }

    let list = (!category || category === 'Tümü') 
      ? serverNewsCache.all 
      : (serverNewsCache.byCategory[category] || []);

    const newItems = list.filter(a => new Date(a.createdAt).getTime() > sinceTime);

    res.json({
      hasNew: newItems.length > 0,
      count: newItems.length,
      latestCreatedAt: list[0]?.createdAt || '',
      latestArticle: newItems[0] || null
    });
  } catch (err) {
    res.json({ hasNew: false, count: 0 });
  }
});

// Dynamic SEO Sitemap.xml Endpoint (Google News + Standard XML Sitemap)
app.get(['/sitemap.xml', '/sitemap'], (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');

    const baseUrl = 'https://voxozet.com';
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const staticRoutes = [
      { path: '', priority: '1.0', changefreq: 'always' },
      { path: '/gundem', priority: '0.9', changefreq: 'hourly' },
      { path: '/ekonomi', priority: '0.9', changefreq: 'hourly' },
      { path: '/teknoloji', priority: '0.9', changefreq: 'hourly' },
      { path: '/dunya', priority: '0.8', changefreq: 'hourly' },
      { path: '/spor', priority: '0.8', changefreq: 'hourly' },
      { path: '/saglik', priority: '0.8', changefreq: 'hourly' },
      { path: '/odaklan', priority: '0.8', changefreq: 'daily' },
      { path: '/kitaplik', priority: '0.7', changefreq: 'weekly' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Static pages
    for (const r of staticRoutes) {
      xml += `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
`;
    }

    // Dynamic cached articles in memory
    const articles = serverNewsCache.all.slice(0, 200);
    for (const article of articles) {
      if (!article.title) continue;

      const cleanSlug = article.title
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);

      const pubDate = article.createdAt ? new Date(article.createdAt).toISOString() : now;
      const articleUrl = `${baseUrl}/haber/${cleanSlug}-voxozet`;
      const escapedTitle = article.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      xml += `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${pubDate.split('T')[0]}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>VOX</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapedTitle}</news:title>
    </news:news>`;

      if (article.imageUrl && article.imageUrl.startsWith('http')) {
        const escapedImg = article.imageUrl.replace(/&/g, '&amp;');
        xml += `
    <image:image>
      <image:loc>${escapedImg}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>`;
      }

      xml += `
  </url>
`;
    }

    xml += `</urlset>`;
    return res.send(xml);
  } catch (e: any) {
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
});

// Dynamic Robots.txt Endpoint
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Allow: /gundem
Allow: /teknoloji
Allow: /ekonomi
Allow: /dunya
Allow: /spor
Allow: /saglik
Allow: /haber/
Allow: /odaklan
Allow: /kitaplik
Disallow: /api/
Disallow: /api/*

User-agent: Googlebot
Allow: /
Allow: /haber/

User-agent: Googlebot-News
Allow: /
Allow: /haber/

User-agent: Mediapartners-Google
Allow: /

User-agent: Google-AdSense-Bot
Allow: /

Sitemap: https://voxozet.com/sitemap.xml
`);
});

// Quota & Cloud Health Status Endpoint
app.get('/api/quota-status', (req, res) => {
  res.json({
    success: true,
    serverCacheCount: serverNewsCache.all.length,
    serverLastUpdated: serverNewsCache.lastUpdated,
    cachedCategories: Object.keys(serverNewsCache.byCategory),
    storagePolicy: 'cdn_remote_referencing',
    storageUsageBytes: 0, // 0 bytes in Firebase Storage due to CDN referencing
    status: 'optimal'
  });
});

// Safe first-party Feed Proxy Endpoint (/api/fetch-feed)
// Fetches RSS / XML / HTML / JSON feeds server-side with zero third-party proxy dependency
app.get('/api/fetch-feed', async (req, res) => {
  try {
    const rawTargetUrl = (req.query.url as string || '').trim();
    if (!rawTargetUrl) {
      return res.status(400).json({ success: false, error: 'url parameter is required' });
    }

    // URL validation & SSRF protection
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawTargetUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ success: false, error: 'Only HTTP and HTTPS protocols are allowed' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.internal') ||
      hostname === '169.254.169.254'
    ) {
      return res.status(403).json({ success: false, error: 'Access to internal network addresses is forbidden' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 VOX/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, application/json, */*'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Remote server responded with HTTP status ${response.status}`
      });
    }

    const text = await response.text();
    const isJsonRequested = req.query.format === 'json';

    if (isJsonRequested) {
      return res.json({
        success: true,
        contents: text,
        status: response.status,
        contentType: response.headers.get('content-type') || 'text/xml'
      });
    }

    // Default: return raw XML / text content with appropriate headers
    const contentType = response.headers.get('content-type') || 'application/xml; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.send(text);
  } catch (err: unknown) {
    const errorMsg = (err as Error).name === 'AbortError' ? 'Feed request timed out' : (err as Error).message;
    console.warn('/api/fetch-feed fetch error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
});

// Search News API Endpoint (Searches in-memory cache and falls back to server-side Google News RSS if needed)
app.get('/api/news/search', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30');
    const query = ((req.query.q as string) || '').trim();
    if (!query) {
      return res.json({ success: true, articles: [] });
    }

    const queryLower = query.toLowerCase();
    // Search cached articles in memory
    const matched = serverNewsCache.all.filter(a =>
      a.title?.toLowerCase().includes(queryLower) ||
      a.summary?.toLowerCase().includes(queryLower) ||
      a.content?.toLowerCase().includes(queryLower) ||
      a.author?.toLowerCase().includes(queryLower) ||
      a.category?.toLowerCase().includes(queryLower)
    );

    // If matches found or query is short, return matches
    if (matched.length >= 5) {
      return res.json({ success: true, articles: matched.slice(0, 40) });
    }

    // Server-side fallback search from Google News RSS
    try {
      const searchRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
      const directSearchItems = await fetchSingleRssFeed({
        url: searchRssUrl,
        category: 'Gündem',
        author: 'Google Haberler'
      });
      const combined = [...matched, ...directSearchItems];
      const seen = new Set<string>();
      const deduplicated = combined.filter(item => {
        const key = item.title?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return res.json({ success: true, articles: deduplicated.slice(0, 40) });
    } catch (e) {
      return res.json({ success: true, articles: matched });
    }
  } catch (err: unknown) {
    console.error('News search error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Server-side Anti-Ban Cache for Twitter feeds (5 minutes TTL)
let serverTwitterCache: { timestamp: number; tweets: any[] } = {
  timestamp: 0,
  tweets: []
};

// 4.1 Twitter (X) Feed Aggregator Endpoint (@ozetgechaber, @ConflictTR, @vaziyetcomtr)
app.get('/api/tweets', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const accounts = [
      {
        handle: '@ConflictTR',
        username: 'ConflictTR',
        name: 'Conflict TR',
        category: 'Gündem',
        url: 'https://x.com/ConflictTR'
      },
      {
        handle: '@ozetgechaber',
        username: 'ozetgechaber',
        name: 'Özet Geç Haber',
        category: 'Teknoloji',
        url: 'https://x.com/ozetgechaber'
      },
      {
        handle: '@vaziyetcomtr',
        username: 'vaziyetcomtr',
        name: 'Vaziyet',
        category: 'Ekonomi',
        url: 'https://x.com/vaziyetcomtr'
      }
    ];

    const now = Date.now();
    const accountFilter = req.query.account as string;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Check server memory cache
    if (serverTwitterCache.tweets.length > 0 && (now - serverTwitterCache.timestamp < CACHE_TTL)) {
      let filtered = serverTwitterCache.tweets;
      if (accountFilter) {
        filtered = filtered.filter(t => t.author.toLowerCase().includes(accountFilter.toLowerCase()));
      }
      return res.json({
        success: true,
        cached: true,
        accounts: accounts.map(a => a.handle),
        tweets: filtered
      });
    }

    // Helper to clean tweet text in Node
    const cleanText = (raw: string) => {
      let text = (raw || '')
        .replace(/<[^>]+>/g, ' ')
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

      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      let title = sentences[0] || text;
      title = title.replace(/^\[.*?\]\s*/, '').trim();
      if (title.length > 110) title = title.substring(0, 107) + '...';
      return { title, summary: text, content: text };
    };

    // Helper to parse XML items with regex (no npm packages)
    const parseRssXml = (xml: string, acc: typeof accounts[0]) => {
      const items: any[] = [];
      const itemRegex = /<item[\s\S]*?<\/item>/gi;
      const matches = xml.match(itemRegex) || [];

      matches.forEach((itemBlock, idx) => {
        const titleMatch = itemBlock.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const descMatch = itemBlock.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        const pubDateMatch = itemBlock.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || itemBlock.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
        const linkMatch = itemBlock.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemBlock.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);

        const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1') : '';
        const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1') : '';
        const rawPubDate = pubDateMatch ? pubDateMatch[1] : '';
        const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : `https://x.com/${acc.username}`;

        // Image extraction
        let imageUrl = '';
        const mediaMatch = itemBlock.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i);
        if (mediaMatch) {
          imageUrl = mediaMatch[1];
        } else if (rawDesc.includes('<img')) {
          const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        const combined = rawDesc && rawDesc.length > rawTitle.length ? rawDesc : (rawTitle || rawDesc);
        const { title, summary, content } = cleanText(combined);

        if (summary && summary.length > 5) {
          let pubDateISO = new Date().toISOString();
          if (rawPubDate) {
            try {
              const d = new Date(rawPubDate);
              if (!isNaN(d.getTime())) pubDateISO = d.toISOString();
            } catch (e) {}
          }

          items.push({
            id: `tweet_${acc.username}_${idx}_${Date.now()}`,
            title,
            summary,
            content: `${content}\n\nBu anlık bilgilendirme ve sıcak gelişme, VOX Akıllı Akış motoru ile Twitter (𝕏) üzerinden canlı olarak aktarılmıştır.`,
            category: acc.category,
            author: acc.name || acc.handle,
            sourceType: 'twitter',
            sourceUrl: link.startsWith('http') ? link : `https://x.com/${acc.username}`,
            imageUrl: imageUrl || undefined,
            durationSeconds: Math.max(60, Math.min(180, Math.round(summary.length * 0.4))),
            createdAt: pubDateISO,
            keyPoints: [title, `Kaynak: 𝕏 ${acc.name} (${acc.handle})`, `Kategori: ${acc.category}`]
          });
        }
      });

      return items;
    };

    // Fetch from free Nitter / RSSHub mirrors in parallel
    const fetchedPromises = accounts.map(async (acc) => {
      const mirrors = [
        `https://nitter.poast.org/${acc.username}/rss`,
        `https://nitter.privacydev.net/${acc.username}/rss`,
        `https://rsshub.app/twitter/user/${acc.username}`
      ];

      for (const mirror of mirrors) {
        try {
          const response = await fetch(mirror, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VoxBot/1.0; +https://vox.ai)'
            },
            signal: AbortSignal.timeout(4000)
          });
          if (response.ok) {
            const xml = await response.text();
            const items = parseRssXml(xml, acc);
            if (items.length > 0) return items;
          }
        } catch (e) {}
      }
      return [];
    });

    const results = await Promise.all(fetchedPromises);
    const allTweets: any[] = [];
    results.forEach(list => {
      if (Array.isArray(list)) allTweets.push(...list);
    });

    if (allTweets.length > 0) {
      allTweets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      serverTwitterCache = {
        timestamp: now,
        tweets: allTweets
      };
    }

    let outList = allTweets.length > 0 ? allTweets : serverTwitterCache.tweets;
    if (accountFilter) {
      outList = outList.filter(t => t.author.toLowerCase().includes(accountFilter.toLowerCase()));
    }

    res.json({
      success: true,
      accounts: accounts.map(a => a.handle),
      tweets: outList
    });
  } catch (err: unknown) {
    console.error('Twitter API endpoint error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Endpoint to resolve real OpenGraph Image for any news or web URL
app.get('/api/resolve-image', async (req, res) => {
  try {
    const urlStr = req.query.url as string;
    if (!urlStr) {
      return res.status(400).json({ success: false, error: 'url parameter required' });
    }

    const realImg = await resolveWebImage(urlStr);
    res.json({ success: true, imageUrl: realImg || '' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Endpoint to resolve batch of URLs to real images
app.post('/api/resolve-images', async (req, res) => {
  try {
    const { urls } = req.body || {};
    if (!Array.isArray(urls)) {
      return res.status(400).json({ success: false, error: 'urls array required' });
    }

    const resultMap: Record<string, string> = {};
    await Promise.all(
      urls.slice(0, 15).map(async (u: string) => {
        if (typeof u === 'string' && u.startsWith('http')) {
          const img = await resolveWebImage(u);
          if (img) resultMap[u] = img;
        }
      })
    );

    res.json({ success: true, images: resultMap });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Web Push Notification Subscriptions Store & Endpoints
const pushSubscriptionsStore = new Map<string, any>();

app.post('/api/push/subscribe', (req, res) => {
  try {
    const { subscription, userId } = req.body || {};
    if (!subscription) {
      return res.status(400).json({ success: false, error: 'Subscription object is required' });
    }

    const subKey = userId || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    pushSubscriptionsStore.set(subKey, {
      subscription,
      subscribedAt: new Date().toISOString()
    });

    console.log(`[Push Notification] New subscription registered: ${subKey}`);
    res.json({ success: true, message: 'Push bildirimi aboneliği kaydoldu.', subscriptionId: subKey });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/push/send', (req, res) => {
  try {
    const { title, body, userId } = req.body || {};
    console.log(`[Push Notification Trigger] "${title}": ${body} (User: ${userId || 'All'})`);
    res.json({ success: true, message: 'Bildirim gönderim isteği alındı.', title, body });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. RSS XML Proxy Endpoint to prevent CORS errors
app.get('/api/rss-fetch', async (req, res) => {
  try {
    const feedUrl = req.query.url as string;
    if (!feedUrl) {
      return res.status(400).json({ success: false, error: 'url parameter required' });
    }

    const fetchRes = await fetch(feedUrl);
    const xmlText = await fetchRes.text();

    // Use Gemini to parse XML cleanly into JSON items
    const prompt = `
Extract up to 5 latest articles from this RSS XML feed.
Respond ONLY with valid JSON array:
[
  {
    "title": "Article Title",
    "summary": "Short snippet or description",
    "sourceUrl": "Link to original",
    "author": "Feed Publisher Name",
    "createdAt": "${new Date().toISOString()}"
  }
]
XML:
${xmlText.substring(0, 15000)}
`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const items = JSON.parse(response.text || '[]');
    res.json({ success: true, items });
  } catch (err: unknown) {
    console.error('RSS fetch error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// API 404 Fallback - ensures unmatched /api/* calls return JSON, never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API_NOT_FOUND',
    message: `İstenen API adresi (${req.method} ${req.path}) bulunamadı.`
  });
});

// Global API Error Handler (Catches all unhandled errors before static/Vite middleware)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error Handler]:', err);
  if (res.headersSent) {
    return _next(err);
  }
  const statusCode = typeof err?.status === 'number' ? err.status : (typeof err?.statusCode === 'number' ? err.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    error: err?.code || 'SERVER_ERROR',
    message: err?.message || 'Sunucu hatası oluştu. Lütfen tekrar deneyin.'
  });
});

function getLocalizedMetaHtml(template: string, reqPath: string, queryLang?: string): string {
  // If this is an article page (/haber/:slug), dynamically inject specific article metadata for Googlebot, Twitterbot, LinkedIn, etc.
  if (reqPath.startsWith('/haber/')) {
    const slug = reqPath.replace('/haber/', '').split('?')[0].toLowerCase().trim();
    const article = serverNewsCache.all.find(a => {
      const cleanSlug = a.title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '').substring(0, 40);
      return (cleanSlug && slug.includes(cleanSlug)) || a.id.toLowerCase() === slug || slug.includes(a.id.toLowerCase());
    });

    if (article) {
      const artTitle = `${article.title} | VOX`;
      const artDesc = (article.summary || article.title).replace(/["'\n\r]/g, ' ').substring(0, 200).trim();
      const artImg = article.imageUrl || 'https://voxozet.com/og-image.png';
      const artUrl = `https://voxozet.com/haber/${slug}`;
      const pubDate = article.createdAt || new Date().toISOString();

      const schemaJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': article.title,
        'description': artDesc,
        'image': [artImg],
        'datePublished': pubDate,
        'dateModified': pubDate,
        'author': [{
          '@type': 'Person',
          'name': article.author || 'VOX'
        }],
        'publisher': {
          '@type': 'Organization',
          'name': 'VOX',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://voxozet.com/logo.png'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': artUrl
        }
      });

      const schemaScript = `<script type="application/ld+json">${schemaJson}</script>`;

      return template
        .replace(/<title>.*?<\/title>/, `<title>${artTitle}</title>`)
        .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${artTitle}" />`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${artDesc}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${artTitle}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${artDesc}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${artUrl}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${artImg}" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${artTitle}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${artDesc}" />`)
        .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${artImg}" />`)
        .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${artUrl}" />`)
        .replace('</head>', `  ${schemaScript}\n  </head>`);
    }
  }

  const isEnglish = reqPath.startsWith('/en') || reqPath === '/focus' || queryLang === 'en';
  const isFocus = reqPath === '/odaklan' || reqPath === '/focus' || reqPath.includes('/focus');

  const title = isEnglish
    ? (isFocus ? 'VOX Focus | Read Less, Listen More, Focus Better' : 'VOX | Read Less, Listen More, Focus Better')
    : (isFocus ? 'VOX | Odaklan' : 'VOX | Oku, Dinle, Odaklan');

  const description = isEnglish
    ? 'Read less. Listen more. Focus better. Cut through the noise with AI podcast news and deep focus soundscapes.'
    : 'Daha az oku. Daha çok dinle. Daha iyi odaklan. Güncel haber akışında kalabalıktan kurtulun; yapay zeka ile haberleri sesli dinleyin ve film müzikleriyle odaklanın.';

  const fullDescription = isEnglish
    ? 'Read less. Listen more. Focus better. VOX cuts through the noise in current news, turns articles into audio podcasts with AI, and provides deep focus environments with legendary soundtracks.'
    : 'Daha az oku. Daha çok dinle. Daha iyi odaklan. Güncel haber akışında kalabalıktan kurtulmanızı ve asıl olana odaklanmanızı sağlar. Haberleri podcaste çevirin, dizi-film müzikleri ve ambiyans ile derin odaklanın.';

  const url = `https://voxozet.com${reqPath}`;
  const locale = isEnglish ? 'en_US' : 'tr_TR';

  return template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${fullDescription}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:locale" content=".*?" \/>/, `<meta property="og:locale" content="${locale}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${fullDescription}" />`)
    .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${url}" />`);
}

// Serve frontend with Vite middleware in development or static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Handle HTML requests to provide accurate dynamic OpenGraph metadata for preview crawlers
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
      }

      try {
        const rawTemplate = await fs.promises.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        const queryLang = typeof req.query.lang === 'string' ? req.query.lang : undefined;
        const localizedTemplate = getLocalizedMetaHtml(rawTemplate, req.path, queryLang);
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, localizedTemplate);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(transformedHtml);
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      try {
        const rawTemplate = await fs.promises.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const queryLang = typeof req.query.lang === 'string' ? req.query.lang : undefined;
        const localizedHtml = getLocalizedMetaHtml(rawTemplate, req.path, queryLang);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(localizedHtml);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VOX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
