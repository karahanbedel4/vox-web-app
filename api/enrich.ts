import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

async function scrapeUrlText(url: string): Promise<{ summary?: string; paragraphs: string[] } | null> {
  if (!url || !url.startsWith('http')) return null;
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!r.ok) return null;
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, noscript, iframe, .ad, .ads, [class*="cookie"], [class*="paywall"]').remove();
    const paragraphs: string[] = [];
    const seen = new Set<string>();
    const sel = 'article p, .content-text p, .news-content p, .detail-content p, main p';
    $(sel).each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (!txt || txt.length < 30) return;
      const lower = txt.toLowerCase();
      if (
        lower.includes('çerez') || lower.includes('cookie') || lower.includes('abone ol') ||
        lower.includes('telif hakkı') || lower.includes('mega ajans') || lower.includes('izin alınmadan') ||
        lower.includes('iktibas edilemez') || lower.includes('internet sitesinde yayınlanan')
      ) return;
      const fp = txt.substring(0, 40).toLowerCase();
      if (seen.has(fp)) return;
      seen.add(fp);
      paragraphs.push(txt);
    });
    const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    return { summary: ogDesc?.trim(), paragraphs };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const article = req.body?.article;
    if (!article || !article.title) {
      return res.status(400).json({ success: false, error: 'Valid article object is required' });
    }

    // Try real web scraping first if sourceUrl is available
    let scrapedInfo: { summary?: string; paragraphs: string[] } | null = null;
    if (article.sourceUrl && article.sourceUrl.startsWith('http')) {
      scrapedInfo = await scrapeUrlText(article.sourceUrl);
    }

    const effectiveText = scrapedInfo && scrapedInfo.paragraphs.length >= 2 
      ? scrapedInfo.paragraphs.join('\n\n')
      : (article.content || article.summary || '');

    const ai = getGeminiClient();
    if (ai && effectiveText.length > 50) {
      const prompt = `
Sen VOX haber platformu için kıdemli bir haber editörüsün.
Aşağıdaki haber detaylarını oku ve okuyucunun konuyu eksiksiz, net ve tüm kilit detaylarıyla kavrayacağı doğal Türkçe bir haber metni hazırla.

BAŞLIK: "${article.title}"
KAYNAK: "${article.author || 'Haber Merkezi'}"
HAM HABER METNİ VE DETAYLAR:
${effectiveText.substring(0, 3000)}

KURALLAR:
1. "summary": Haberin en önemli can alıcı bilgisini veren 1-2 cümlelik net spot cümle.
2. "content": Olayın arka planını, açıklamalarını, neyin ne olduğunu (örneğin borç faizleri ise hangi borçlar, kimin borcu, şartlar neler) detaylarıyla aktaran, aralarında '\\n\\n' olan 3-4 doğal paragraf. Asla robotik, klişe ("süreç titizlikle yürütülüyor" gibi) yapay cümleler kurma, gerçek olguları aktar.
3. "keyPoints": Haberin somut 2-3 kilit noktası.

Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "summary": "...",
  "content": "...",
  "keyPoints": ["...", "..."]
}
`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(aiRes.text || '{}');
      if (parsed && parsed.summary && parsed.content) {
        return res.status(200).json({
          success: true,
          article: {
            ...article,
            summary: parsed.summary,
            content: parsed.content,
            keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 4) : [article.title]
          }
        });
      }
    }

    // High quality scraping / direct fallback (zero robotic boilerplate)
    const title = article.title;
    const cleanSummary = scrapedInfo?.summary || (article.summary && article.summary.length > 25 ? article.summary : title);
    const cleanContent = scrapedInfo && scrapedInfo.paragraphs.length >= 2
      ? scrapedInfo.paragraphs.join('\n\n')
      : (article.content && article.content.length > 50 ? article.content : cleanSummary);

    const sentences = cleanSummary.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
    const cleanKeyPoints = sentences.length >= 2 ? sentences.slice(0, 3) : [title];

    return res.status(200).json({
      success: true,
      article: {
        ...article,
        summary: cleanSummary,
        content: cleanContent,
        keyPoints: cleanKeyPoints
      }
    });
  } catch (err: any) {
    return res.status(200).json({ success: true, article: req.body?.article });
  }
}
