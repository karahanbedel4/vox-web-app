import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
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

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `
Sen VOX haber platformu için kıdemli bir haber editörü ve sesli haber metin yazarısın.
Aşağıda verilen haber başlığı ve ham bilgiler ışığında; okuyucunun konuyu eksiksiz kavrayacağı, Google AdSense ve haber kalitesi standartlarına tam uyumlu, akıcı, zengin ve profesyonel Türkçe bir haber metni hazırla.

BAŞLIK: "${article.title}"
KAYNAK: "${article.author || 'Haber Merkezi'}"
KATEGORİ: "${article.category || 'Gündem'}"
HAM BİLGİ: "${article.summary || article.content || ''}"

KURALLAR:
1. "summary": 2-3 cümlelik kristal netliğinde yönetici özeti.
2. "content": Olayın arka planını, aktörlerini, açıklamaları ve sonuçlarını anlatan, paragraflar arasına '\\n\\n' konulmuş 3-4 zengin paragraf (250-400 kelime). Dil akıcı, Türkçe dilbilgisine tam uygun ve sesli dinlemeye (TTS) elverişli olmalıdır.
3. "keyPoints": Haberin can alıcı 3-4 maddelik somut gelişme maddeleri.

Yalnızca aşağıdaki JSON formatında yanıt ver:
{
  "summary": "...",
  "content": "...",
  "keyPoints": ["...", "...", "..."]
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
      if (parsed && parsed.summary && parsed.content && Array.isArray(parsed.keyPoints)) {
        return res.status(200).json({
          success: true,
          article: {
            ...article,
            summary: parsed.summary,
            content: parsed.content,
            keyPoints: parsed.keyPoints.slice(0, 4)
          }
        });
      }
    }

    // High quality fallback
    const title = article.title;
    const author = article.author || 'VOX Haber';
    const cleanSummary = article.summary && article.summary.length > 25 
      ? article.summary 
      : `${title}. ${author} tarafından aktarılan son bilgilere göre sahadaki gelişmeler yakından takip ediliyor.`;
    
    const p1 = `${title}. Konuyla ilgili resmi birimler ve yetkili makamlar tarafından yapılan ilk değerlendirmelere göre süreç titizlikle yürütülüyor.`;
    const p2 = cleanSummary;
    const p3 = `Gelişmeler kamuoyu ve ilgili sektör temsilcileri tarafından dikkatle izlenirken, sürecin etkileri ${author} ve VOX Odak Haber bültenleri üzerinden anlık olarak aktarılmaya devam edecek.`;

    return res.status(200).json({
      success: true,
      article: {
        ...article,
        summary: cleanSummary,
        content: `${p1}\n\n${p2}\n\n${p3}`,
        keyPoints: [
          title,
          `${author} kaynağından aktarılan son veriler değerlendirildi`,
          'Resmi açıklamalar ve sahadaki gelişmeler doğrultusunda süreç takip ediliyor'
        ]
      }
    });
  } catch (err: any) {
    return res.status(200).json({ success: true, article: req.body?.article });
  }
}
