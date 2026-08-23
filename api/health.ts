import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5;
  const keyPrefix = hasGeminiKey ? process.env.GEMINI_API_KEY!.substring(0, 7) + '...' : 'NONE';

  return res.status(200).json({
    status: 'ok',
    environment: 'vercel_serverless',
    timestamp: new Date().toISOString(),
    gemini: {
      hasKey: hasGeminiKey,
      keyPrefix
    }
  });
}
