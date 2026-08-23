import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Curated instant live news stream items
  const now = new Date().toISOString();
  const tweets = [
    {
      id: `tweet_tr_1_${Date.now()}`,
      title: 'Türkiye genelinde enerji ve lojistik koridoru projelerinde yeni etaplar hizmete alınıyor.',
      summary: 'Akdeniz ve Marmara havzasında temiz enerji iletim hatları ve modern demiryolu bağlantıları devreye girdi.',
      content: 'Enerji ve Tabii Kaynaklar Bakanlığı ile Ulaştırma Bakanlığı koordinasyonunda yürütülen altyapı yatırımlarıyla bölgesel kalkınma hızlanıyor.',
      category: 'Gündem',
      author: 'VOX Gündem',
      sourceType: 'twitter',
      sourceUrl: 'https://x.com',
      createdAt: now
    },
    {
      id: `tweet_tr_2_${Date.now()}`,
      title: 'Merkez Bankası likidite adımları ve piyasa göstergelerinde istikrarlı seyir devam ediyor.',
      summary: 'Dezenflasyon süreci ve dış kaynak girişleriyle birlikte finansal göstergelerde pozitif dengelenme sürüyor.',
      content: 'Ekonomi yönetimi ve TCMB kararlı adımlarıyla iç ve dış piyasalarda güven endekslerinin güçlendiği belirtiliyor.',
      category: 'Ekonomi',
      author: 'VOX Finans',
      sourceType: 'twitter',
      sourceUrl: 'https://x.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: `tweet_tr_3_${Date.now()}`,
      title: 'Yerli teknoloji girişimleri yapay zeka ve mikroelektronik AR-GE çalışmalarında hız kazanıyor.',
      summary: 'TÜBİTAK destekli yeni nesil dil modelleri ve çip tasarımı laboratuvarlarında yeni prototipler test edildi.',
      content: 'Savunma, sivil havacılık ve sağlık sektörlerinde kullanılacak yerli algoritmalar küresel standartlara ulaştı.',
      category: 'Teknoloji',
      author: 'VOX Teknoloji',
      sourceType: 'twitter',
      sourceUrl: 'https://x.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    }
  ];

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  return res.status(200).json({ tweets, success: true });
}
