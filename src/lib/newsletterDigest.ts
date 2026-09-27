// VOX News Deduplication & Daily Newsletter Digest Engine
// Implements semantic title similarity clustering, cross-source frequency ranking, and HTML newsletter generation

export interface RawNewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  author?: string;
  sourceUrl?: string;
  imageUrl?: string;
  durationSeconds?: number;
  createdAt?: string;
  keyPoints?: string[];
}

export interface NewsCluster {
  clusterId: string;
  topicKeyword: string;
  primaryArticle: RawNewsItem;
  allArticles: RawNewsItem[];
  sources: string[];
  coverageCount: number;
  voxUrl: string;
}

export interface DeduplicationResult {
  totalScannedCount: number;
  uniqueTopicCount: number;
  reductionPercentage: number;
  clusters: NewsCluster[];
  top10Articles: {
    article: RawNewsItem;
    voxUrl: string;
    sources: string[];
    coverageCount: number;
  }[];
}

// Turkish Stopwords & Noise Prefixes to strip before similarity calculation
const TURKISH_STOPWORDS = new Set([
  've', 'veya', 'ile', 'bir', 'bu', 'su', 'o', 'icin', 'de', 'da', 'te', 'ta',
  'den', 'dan', 'ten', 'tan', 'nin', 'nin', 'nun', 'nun', 'ye', 'ya', 'e', 'a',
  'son', 'dakika', 'flas', 'haber', 'haberi', 'haberleri', 'sicak', 'gelisme',
  'ozel', 'duyuru', 'acikladi', 'aciklama', 'duyurdu', 'geldi', 'belli', 'oldu',
  'iste', 'yeni', 'ilk', 'kadar', 'gore', 'sonrasi', 'oncesi', 'hakkinda',
  'cok', 'daha', 'en', 'ise', 'hem', 'gibi', 'olarak', 'gun', 'yine', 'bugun',
  'resmi', 'detaylar', 'canli', 'yayin', 'ozet'
]);

// Normalizes Turkish text to clean lowercase ASCII tokens for accurate similarity comparison
export function normalizeTurkishForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extracts meaningful keyword tokens (length >= 3 and not in stopwords)
export function extractSignificantTokens(title: string): string[] {
  const norm = normalizeTurkishForComparison(title);
  const words = norm.split(' ');
  const tokens: string[] = [];
  
  for (const w of words) {
    if (w.length >= 3 && !TURKISH_STOPWORDS.has(w)) {
      tokens.push(w);
    }
  }
  return Array.from(new Set(tokens));
}

// Calculates Jaccard Token Similarity between two titles (0.0 to 1.0)
export function calculateTitleSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }
  
  const unionSize = setA.size + setB.size - intersectionCount;
  if (unionSize <= 0) return 0;
  
  return intersectionCount / unionSize;
}

// Checks if two titles describe the SAME news event
export function areNewsItemsSimilar(a: RawNewsItem, b: RawNewsItem): boolean {
  if (a.id === b.id) return true;
  
  const tokensA = extractSignificantTokens(a.title);
  const tokensB = extractSignificantTokens(b.title);
  
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  
  // Calculate standard Jaccard token overlap
  const jaccard = calculateTitleSimilarity(tokensA, tokensB);
  if (jaccard >= 0.35) return true;
  
  // Check common significant keywords count
  let commonCount = 0;
  const setB = new Set(tokensB);
  for (const token of tokensA) {
    if (setB.has(token)) commonCount++;
  }
  
  // If they share 3 or more distinctive keywords, they are almost certainly the same news story
  if (commonCount >= 3) return true;
  
  // If they share 2 long words (e.g. "enflasyon" + "eylul" or "merkez" + "faiz")
  if (commonCount >= 2 && tokensA.some(t => t.length >= 5 && setB.has(t))) {
    return true;
  }
  
  // Substring match on normalized string
  const normA = normalizeTurkishForComparison(a.title);
  const normB = normalizeTurkishForComparison(b.title);
  if (normA.length > 20 && normB.length > 20) {
    if (normA.includes(normB.slice(0, 25)) || normB.includes(normA.slice(0, 25))) {
      return true;
    }
  }
  
  return false;
}

// Creates SEO slug for direct VOX article links
export function createVoxArticleSlug(title: string): string {
  const norm = normalizeTurkishForComparison(title);
  return norm
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/**
 * Main Clustering Algorithm:
 * 1. Takes all raw articles (e.g. 100 articles from various sources).
 * 2. Groups articles covering the same news event into clusters.
 * 3. Counts frequency across news sources (TRT, NTV, AA, Habertürk, etc.).
 * 4. Selects the BEST representative article for each topic.
 * 5. Sorts topics by cross-source coverage (most widely shared first).
 * 6. Returns exactly the top 10 unique, non-overlapping articles with direct VOX URLs.
 */
export function deduplicateNewsArticles(
  rawArticles: RawNewsItem[], 
  baseUrl: string = 'https://voxozet.com',
  targetCount: number = 10
): DeduplicationResult {
  const totalScanned = rawArticles.length;
  if (totalScanned === 0) {
    return {
      totalScannedCount: 0,
      uniqueTopicCount: 0,
      reductionPercentage: 0,
      clusters: [],
      top10Articles: []
    };
  }

  const clusters: NewsCluster[] = [];

  for (const article of rawArticles) {
    let matchedCluster: NewsCluster | null = null;
    
    for (const cluster of clusters) {
      // Check similarity against the primary article or any article in the cluster
      const isSimilar = areNewsItemsSimilar(article, cluster.primaryArticle) ||
        cluster.allArticles.some(other => areNewsItemsSimilar(article, other));
        
      if (isSimilar) {
        matchedCluster = cluster;
        break;
      }
    }

    const sourceName = article.author || 'VOX Editör';

    if (matchedCluster) {
      matchedCluster.allArticles.push(article);
      if (!matchedCluster.sources.includes(sourceName)) {
        matchedCluster.sources.push(sourceName);
      }
      matchedCluster.coverageCount++;

      // Upgrade primaryArticle if this article has an image and the current one doesn't,
      // or if this article has a longer/clearer summary
      const currentHasImage = !!matchedCluster.primaryArticle.imageUrl;
      const newHasImage = !!article.imageUrl;
      const newSummaryLength = (article.summary || article.content || '').length;
      const currentSummaryLength = (matchedCluster.primaryArticle.summary || matchedCluster.primaryArticle.content || '').length;

      if ((!currentHasImage && newHasImage) || (newHasImage && newSummaryLength > currentSummaryLength + 30)) {
        matchedCluster.primaryArticle = article;
        matchedCluster.voxUrl = `${baseUrl}/haber/${createVoxArticleSlug(article.title)}`;
      }
    } else {
      const slug = createVoxArticleSlug(article.title);
      const tokens = extractSignificantTokens(article.title);
      const topicKeyword = tokens.slice(0, 2).join(' ') || article.category;

      clusters.push({
        clusterId: `cluster_${clusters.length + 1}`,
        topicKeyword,
        primaryArticle: article,
        allArticles: [article],
        sources: [sourceName],
        coverageCount: 1,
        voxUrl: `${baseUrl}/haber/${slug}`
      });
    }
  }

  // Sort clusters:
  // 1. Prioritize topics shared by MULTIPLE news sources (e.g. TRT, NTV, AA all covered it)
  // 2. Then by coverage count
  // 3. Then by publication freshness
  clusters.sort((a, b) => {
    const sourceDiff = b.sources.length - a.sources.length;
    if (sourceDiff !== 0) return sourceDiff;
    
    const countDiff = b.coverageCount - a.coverageCount;
    if (countDiff !== 0) return countDiff;
    
    const timeA = new Date(a.primaryArticle.createdAt || 0).getTime();
    const timeB = new Date(b.primaryArticle.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Pick top 10 unique topics
  const selectedClusters = clusters.slice(0, targetCount);
  const top10Articles = selectedClusters.map(c => ({
    article: c.primaryArticle,
    voxUrl: c.voxUrl,
    sources: c.sources,
    coverageCount: c.coverageCount
  }));

  const uniqueTopicCount = clusters.length;
  const reductionPercentage = totalScanned > 0 
    ? Math.round(((totalScanned - top10Articles.length) / totalScanned) * 100)
    : 0;

  return {
    totalScannedCount: totalScanned,
    uniqueTopicCount,
    reductionPercentage,
    clusters,
    top10Articles
  };
}

/**
 * Builds HTML Email for Daily News Digest
 */
export function generateDailyDigestHtml(
  digestData: DeduplicationResult,
  options: {
    dateStr?: string;
    baseUrl?: string;
    unsubscribeUrl?: string;
  } = {}
): { subject: string; html: string } {
  const {
    dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    baseUrl = 'https://voxozet.com',
    unsubscribeUrl = `${baseUrl}/ayarlar?tab=bildirimler`
  } = options;

  const topItems = digestData.top10Articles;
  const subject = `VOX Günlük Özet: Günün En Çok Paylaşılan 10 Haberi (${dateStr})`;

  const articlesHtml = topItems.map((item, idx) => {
    const art = item.article;
    const sourcesLabel = item.sources.slice(0, 3).join(', ') + 
      (item.sources.length > 3 ? ` ve ${item.sources.length - 3} diğer kaynak` : '');
    const cleanImg = art.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';
    const categoryBadge = art.category || 'Gündem';
    const readMinutes = Math.max(1, Math.round((art.durationSeconds || 90) / 60));

    return `
      <!-- News Item Card ${idx + 1} -->
      <tr>
        <td style="padding: 0 0 20px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; overflow: hidden;">
            <tr>
              <td style="padding: 0;">
                <a href="${item.voxUrl}" target="_blank" style="text-decoration: none; display: block;">
                  <img src="${cleanImg}" alt="${art.title.replace(/"/g, '&quot;')}" width="100%" height="220" style="display: block; width: 100%; height: 220px; object-fit: cover; border: 0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px;">
                <!-- Badges -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                  <tr>
                    <td style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 700; color: #10b981; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-transform: uppercase;">
                      ${categoryBadge}
                    </td>
                    <td style="width: 8px;"></td>
                    <td style="background-color: #21262d; border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #8b949e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      🔥 ${item.coverageCount} Kaynakta Paylaşıldı: <strong style="color: #c9d1d9;">${sourcesLabel}</strong>
                    </td>
                  </tr>
                </table>

                <!-- Title -->
                <h2 style="margin: 0 0 10px 0; font-size: 18px; line-height: 24px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  <a href="${item.voxUrl}" target="_blank" style="color: #f0f6fc; text-decoration: none;">
                    ${idx + 1}. ${art.title}
                  </a>
                </h2>

                <!-- AI Summary -->
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #8b949e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  ${art.summary || (art.content ? art.content.slice(0, 180) + '...' : '')}
                </p>

                <!-- Action Button -->
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius: 10px; background-color: #10b981;">
                      <a href="${item.voxUrl}" target="_blank" style="display: inline-block; padding: 10px 18px; font-size: 13px; font-weight: 700; color: #000000; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border-radius: 10px;">
                        🔊 VOX'ta Oku ve Dinle (${readMinutes} dk) &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    img { max-width: 100%; height: auto; }
    a { color: #10b981; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; -webkit-font-smoothing: antialiased;">
  <center style="width: 100%; table-layout: fixed; background-color: #0d1117; padding-bottom: 40px;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
      
      <!-- Top Brand Header -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td>
            <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 34px; height: 34px; line-height: 34px; text-align: center; background-color: #10b981; color: #000000; font-weight: 900; font-size: 20px; border-radius: 10px; font-family: sans-serif;">V</span>
              <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin-left: 8px;">VOX <span style="color: #10b981;">ÖZET</span></span>
            </a>
          </td>
          <td align="right" style="font-size: 12px; color: #8b949e; font-family: sans-serif;">
            ${dateStr}
          </td>
        </tr>
      </table>

      <!-- Hero Banner & Deduplication Stats -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #10b981; margin-bottom: 6px;">
              GÜNLÜK HAP BÜLTEN
            </div>
            <h1 style="margin: 0 0 10px 0; font-size: 24px; line-height: 30px; font-weight: 900; color: #ffffff;">
              Günün En Çok Paylaşılan 10 Haberi
            </h1>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #8b949e;">
              Türkiye'nin önde gelen haber kaynakları tarandı. Birbirine benzeyen tekrarlar yapay zeka ile ayıklandı; tek ekranda sadece en önemli 10 özgün konu derlendi.
            </p>

            <!-- Stats Pills -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color: #21262d; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #c9d1d9;">
                  🎯 <strong>${digestData.totalScannedCount} Haber</strong> Tarandı &rarr; 
                  Sadece <strong>${topItems.length} Özgün Konu</strong> Seçildi 
                  <span style="color: #10b981; font-weight: 700;">(%${digestData.reductionPercentage} Tekrar Temizlendi)</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- 10 Deduplicated Articles List -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${articlesHtml}
      </table>

      <!-- Bottom Audio Feature Promo -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; margin-top: 12px; margin-bottom: 28px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">
              🎧 Vaktiniz Yok mu? Sesli Bülteni Dinleyin
            </div>
            <p style="margin: 0 0 14px 0; font-size: 13px; color: #8b949e; line-height: 18px;">
              VOX'un yapay zeka ses motoru ile tüm bülteni 5 dakikada stüdyo kalitesinde arka planda dinleyebilirsiniz.
            </p>
            <a href="${baseUrl}/gundem" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #238636; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 8px;">
              VOX Web Uygulamasını Aç &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Footer & Unsubscribe -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #21262d; padding-top: 20px; text-align: center;">
        <tr>
          <td style="font-size: 12px; line-height: 18px; color: #6e7681;">
            Bu e-posta, VOX Günlük Haber Bülteni aboneliğiniz kapsamında gönderilmiştir.<br />
            Kurucu & Genel Yayın Yönetmeni: <strong>Karahan Bedel</strong> &bull; <a href="mailto:karahanbedel@gmail.com" style="color: #8b949e;">karahanbedel@gmail.com</a><br /><br />
            <a href="${baseUrl}" target="_blank" style="color: #10b981; text-decoration: none;">voxozet.com</a> &bull; 
            <a href="${unsubscribeUrl}" target="_blank" style="color: #8b949e; text-decoration: underline;">Bülten Tercihlerini Düzenle / Abonelikten Ayrıl</a>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>
  `;

  return { subject, html };
}
