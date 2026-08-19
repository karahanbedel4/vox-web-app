import { Article } from '../types';

/**
 * VOX PODCAST & OKU SAYFASI - VARSAYILAN HABER / MAKALELER
 * 
 * Bu dosyayı düzenleyerek veya yeni objeler ekleyerek
 * "Oku" ve "Kitaplık" sayfalarındaki varsayılan içerikleri kolayca güncelleyebilirsiniz.
 */
export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'tr_gundem_1',
    title: 'Merkez Bankası ve Finans Sektöründe Güncel Gelişmeler',
    summary: 'Ekonomi yönetiminin kararlı adımları ve enflasyonla mücadele kapsamında para politikası tedbirleri sürüyor.',
    content: 'Türkiye Cumhuriyet Merkez Bankası (TCMB) ve ekonomi yönetimi, dezenflasyon sürecinin güçlendirilmesi ve makro finansal istikrarın korunması amacıyla koordineli adımlar atmaya devam ediyor. Piyasa analistleri, reel sektör ve tüketici güven endekslerindeki toparlanmanın altını çiziyor.',
    category: 'Gündem',
    sourceType: 'rss',
    durationSeconds: 180,
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    author: 'TRT Haber',
    keyPoints: [
      'Dezenflasyon süreci ve kararlı para politikası',
      'Piyasa likiditesi ve finansal istikrar',
      'Reel sektör yatırımları'
    ]
  },
  {
    id: 'tr_teknoloji_1',
    title: 'Yerli Yapay Zeka ve Çip Tasarımında Yeni Atılım',
    summary: 'Türkiye’nin yerli yapay zeka modelleri ve yeni nesil mikroçip AR-GE laboratuvarlarında kritik aşama geçildi.',
    content: 'TÜBİTAK ve yerli teknoloji girişimlerinin ortaklaşa yürüttüğü yüksek başarımlı yapay zeka dil modelleri ve yerli çip tasarımı projeleri hız kazandı. Savunma sanayii ve sivil havacılıkta kullanılacak yeni algoritmaların test süreçleri başarıyla tamamlandı.',
    category: 'Teknoloji',
    sourceType: 'rss',
    durationSeconds: 210,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    author: 'Webtekno',
    keyPoints: [
      'Yerli çip ve mikroelektronik AR-GE çalışmaları',
      'Türkçe tabanlı büyük dil modelleri',
      'Yüksek teknoloji ihracat hedefleri'
    ]
  },
  {
    id: 'tr_ekonomi_1',
    title: 'İhracatta Yeni Rekor ve Sanayi Üretim Rakamları',
    summary: 'Sanayi sektörü ve dış ticaret dengesinde pozitif ivme: Katma değerli ürün ihracatı arttı.',
    content: 'Ticaret Bakanlığı ve Türkiye İhracatçılar Meclisi (TİM) verilerine göre, yüksek teknolojili ve katma değerli sanayi mamulleri ihracatında artış trendi devam ediyor. Otomotiv ve kimya sektörleri liderliğini korurken yeni pazarlara erişim güçlendi.',
    category: 'Ekonomi',
    sourceType: 'rss',
    durationSeconds: 190,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    author: 'Bloomberg HT',
    keyPoints: [
      'Katma değerli ihracat artışı',
      'Sanayi kapasite kullanım oranları',
      'Dış ticaret dengesinde dengelenme'
    ]
  },
  {
    id: 'tr_dunya_1',
    title: 'Küresel İklim Zirvesi ve Enerji Koridoru Mutabakatı',
    summary: 'Akdeniz ve Avrupa enerji koridorunda stratejik işbirlikleri ve yenilenebilir enerji yatırımları.',
    content: 'Uluslararası Enerji Ajansı ve bölge ülkelerinin katılımıyla gerçekleşen toplantıda, temiz enerji iletim hatları ve sınır ötesi şebeke güvenliği konusunda ortak eylem planı imzalandı.',
    category: 'Dünya',
    sourceType: 'rss',
    durationSeconds: 240,
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    author: 'NTV Dünya',
    keyPoints: [
      'Yenilenebilir enerji iletim koridorları',
      'Sürdürülebilir şebeke altyapıları',
      'Küresel iklim hedefleri'
    ]
  },
  {
    id: 'tr_spor_1',
    title: 'Süper Lig ve Avrupa Kupalarında Haftanın Kritik Karşılaşmaları',
    summary: 'Temsilcilerimizin Avrupa kupalarındaki mücadelesi ve ligdeki zirve yarışı tüm heyecanıyla sürüyor.',
    content: 'Süper Lig ekipleri hem yerel ligde hem de UEFA müsabakalarında kritik virajlara giriyor. Teknik direktörlerin taktik hamleleri ve oyuncu performansları futbolseverlerin yakın takibinde.',
    category: 'Spor',
    sourceType: 'rss',
    durationSeconds: 160,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    author: 'NTV Spor',
    keyPoints: [
      'Avrupa kupaları hazırlıkları',
      'Ligdeki puan durumu ve derbi haftası',
      'Takımların son antrenman raporları'
    ]
  },
  {
    id: 'tr_saglik_1',
    title: 'Tıp Dünyasında Yeni Nesil Biyoteknoloji ve Tedavi Yöntemleri',
    summary: 'Hücresel tedavi ve yapay zeka destekli erken teşhis yöntemlerinde çığır açan klinik çalışmalar.',
    content: 'Dünya Sağlık Örgütü ve uluslararası tıp fakülteleri tarafından yürütülen araştırmalarda, gen düzenleme ve yapay zeka destekli teşhis sistemlerinin başarı oranları açıklandı.',
    category: 'Sağlık',
    sourceType: 'rss',
    durationSeconds: 200,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    author: 'NTV Sağlık',
    keyPoints: [
      'Biyoteknolojik tedavi yöntemleri',
      'Erken teşhiste yapay zeka algoritmaları',
      'Klinik araştırma sonuçları'
    ]
  }
];
