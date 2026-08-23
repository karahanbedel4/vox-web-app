import { Article } from '../types';

/**
 * VOX PODCAST & OKU SAYFASI - VARSAYILAN HABER / MAKALELER
 * 
 * Bu dosyayı düzenleyerek veya yeni objeler ekleyerek
 * "Oku" ve "Kitaplık" sayfalarındaki varsayılan içerikleri kolayca güncelleyebilirsiniz.
 */
export const INITIAL_ARTICLES: Article[] = [
  // GÜNDEM
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
    id: 'tr_gundem_2',
    title: 'Marmara Bölgesi Ulaşım Ağında Yeni Otoyol ve Raylı Sistem Projeleri',
    summary: 'İstanbul, Bursa ve Kocaeli arasındaki lojistik koridoru güçlendiren hızlı tren ve metro hatlarında yeni etaplar açılıyor.',
    content: 'Ulaştırma ve Altyapı Bakanlığı tarafından yürütülen mega projeler çerçevesinde, metropollerin birbirine bağlanması ve karbon salınımının azaltılması amacıyla elektrikli hızlı tren ve banliyö hatları devreye alınıyor.',
    category: 'Gündem',
    sourceType: 'rss',
    durationSeconds: 160,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: 'NTV Gündem',
    keyPoints: [
      'Raylı sistem entegrasyonu',
      'Şehirlerarası ulaşımda seyahat süresi kısaldı',
      'Sürdürülebilir yeşil lojistik'
    ]
  },
  {
    id: 'tr_gundem_3',
    title: 'Eğitimde Yeni Müfredat ve Dijital Dönüşüm Yol Haritası Açıklandı',
    summary: 'Milli Eğitim Bakanlığı, yapay zeka okuryazarlığı ve pratik beceri odaklı yeni öğretim programını tanıttı.',
    content: 'Yeni eğitim-öğretim dönemiyle birlikte okullarda analitik düşünme, kodlama, yapay zeka etiği ve yabancı dil becerilerini güçlendiren modüler ders planları uygulanmaya başlanacak.',
    category: 'Gündem',
    sourceType: 'rss',
    durationSeconds: 190,
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    author: 'Hürriyet Gündem',
    keyPoints: [
      'Yapay zeka ve kodlama dersleri',
      'Beceri temelli müfredat yapısı',
      'Öğretmen gelişim akademileri'
    ]
  },
  {
    id: 'tr_gundem_4',
    title: 'Deprem Dirençli Şehirler Projesi Kapsamında Kentsel Dönüşüm Hızlandı',
    summary: 'Büyükşehirlerde riskli yapıların tahliyesi ve modern şehircilik ilkelerine uygun rezerv alan inşaatları sürüyor.',
    content: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafından başlatılan Yarısı Bizden kampanyası ve güvenli konut projeleriyle, afetlere karşı dirençli mahalleler oluşturuluyor.',
    category: 'Gündem',
    sourceType: 'rss',
    durationSeconds: 210,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    author: 'Anadolu Ajansı',
    keyPoints: [
      'Deprem dayanıklı akıllı yapılar',
      'Kentsel dönüşüm destek paketleri',
      'Modern peyzaj ve altyapı'
    ]
  },

  // TEKNOLOJİ
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
    id: 'tr_teknoloji_2',
    title: 'Kuantum Bilişim ve Yeni Nesil Kriptografi Dünyayı Değiştiriyor',
    summary: 'Süper iletken kuantum işlemciler, karmaşık moleküler simülasyonları ve şifreleme protokollerini dönüştürüyor.',
    content: 'Önde gelen teknoloji laboratuvarları, 1000 kübit bariyerini aşan işlemcilerle veri merkezlerindeki enerji tüketimini azaltırken hesaplama hızını katlayarak yeni bir çağın kapılarını aralıyor.',
    category: 'Teknoloji',
    sourceType: 'rss',
    durationSeconds: 180,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    author: 'ShiftDelete',
    keyPoints: [
      'Kuantum üstünlüğü ve yeni algoritmalar',
      'Post-kuantum şifreleme standartları',
      'Veri merkezlerinde kuantum entegrasyonu'
    ]
  },
  {
    id: 'tr_teknoloji_3',
    title: 'Elektrikli Araç Bataryalarında Katı Hal Devrimi',
    summary: '10 dakikada şarj olan ve 1000 km menzil sunan katı hal lityum piller seri üretim bandına giriyor.',
    content: 'Otomotiv devleri ve pil üreticileri, yangın riski sıfıra indirilen ve aşırı soğuk hava koşullarında performans kaybı yaşamayan yeni nesil katı elektrolit teknolojisini araçlara entegre ediyor.',
    category: 'Teknoloji',
    sourceType: 'rss',
    durationSeconds: 175,
    imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c634a10?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    author: 'DonanımHaber',
    keyPoints: [
      'Katı hal batarya kimyası',
      'Ultra hızlı şarj istasyonları',
      'Elektrikli mobilitede menzil artışı'
    ]
  },

  // EKONOMİ
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
    id: 'tr_ekonomi_2',
    title: 'Küresel Borsalar ve Emtia Piyasalarında Faiz İndirimi Rüzgarı',
    summary: 'Merkez bankalarının gevşeme döngüsüne girmesiyle altın, gümüş ve hisse senedi piyasalarında yükseliş hızlandı.',
    content: 'Uluslararası yatırım bankaları, gelişmekte olan piyasalara sermaye girişinin hızlandığını ve tahvil getirilerindeki normalleşmenin şirket bilançolarına olumlu yansıyacağını öngörüyor.',
    category: 'Ekonomi',
    sourceType: 'rss',
    durationSeconds: 200,
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    author: 'Dünya Gazetesi',
    keyPoints: [
      'Küresel faiz indirim döngüsü',
      'Altın ve değerli metallerde rekor',
      'Portföy yatırımlarında pozitif akış'
    ]
  },

  // DÜNYA
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
    id: 'tr_dunya_2',
    title: 'Yapay Zeka Güvenliği Zirvesinde Ortak Standartlar Belirlendi',
    summary: '50’den fazla ülkenin liderleri, otonom sistemler ve veri gizliliği konusunda bağlayıcı çerçeve oluşturdu.',
    content: 'İsviçre’de toplanan küresel inovasyon forumunda, sınır ötesi yapay zeka denetimleri, açık kaynak modellerin şeffaflığı ve telif hakları konusunda küresel tüzük kabul edildi.',
    category: 'Dünya',
    sourceType: 'rss',
    durationSeconds: 185,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    author: 'BBC Türkçe',
    keyPoints: [
      'Küresel yapay zeka tüzüğü',
      'Veri gizliliği ve algoritma güvenliği',
      'Uluslararası denetim mekanizması'
    ]
  },

  // SPOR
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
    id: 'tr_spor_2',
    title: 'Milli Yüzücülerimiz ve Atletlerimizden Dünya Şampiyonasında Madalya Yağmuru',
    summary: 'Olimpiyat kotası alan genç sporcularımız uluslararası arenada üst üste rekorlar kırıyor.',
    content: 'Gençlik ve Spor Bakanlığı destekli olimpik hazırlık merkezlerinde yetişen milli sporcularımız, serbest stil yüzme ve engelli koşuda yeni Türkiye ve şampiyona rekorlarına imza attı.',
    category: 'Spor',
    sourceType: 'rss',
    durationSeconds: 150,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    author: 'Fanatik',
    keyPoints: [
      'Yeni ulusal rekorlar',
      'Olimpiyat hazırlık kampları',
      'Genç yeteneklerin yükselişi'
    ]
  },

  // SAĞLIK
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
  },
  {
    id: 'tr_saglik_2',
    title: 'Uyku Kalitesi ve Beyin Sağlığı Arasındaki Kritik Bağlantı',
    summary: 'Nöroloji uzmanları, derin uyku evresinde beynin toksinleri temizleme mekanizmasını detaylandırdı.',
    content: 'Glimfatik sistemin gece boyunca aktif çalışmasının hafıza konsolidasyonu, stres regülasyonu ve uzun ömürlülük üzerindeki hayati etkileri klinik testlerle kanıtlandı.',
    category: 'Sağlık',
    sourceType: 'rss',
    durationSeconds: 170,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    author: 'Medikal Akademi',
    keyPoints: [
      'Glimfatik sistem ve beyin detoksu',
      'Sirkadiyen ritim optimizasyonu',
      'Derin uykuyu artıran pratik alışkanlıklar'
    ]
  }
];
