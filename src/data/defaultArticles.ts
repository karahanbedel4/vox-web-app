import { Article } from '../types';

/**
 * VOX PODCAST & OKU SAYFASI - VARSAYILAN HABER / MAKALELER
 * 
 * Bu dosyayı düzenleyerek veya yeni objeler ekleyerek
 * "Oku" ve "Kitaplık" sayfalarındaki varsayılan içerikleri kolayca güncelleyebilirsiniz.
 */
export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'quantum-geopolitics',
    title: 'Quantum Geopolitics: The Shift',
    summary: 'Kuantum bilgisayar teknolojileri ve yapay zeka çiplerinin küresel diplomasi ve savunma dengeleri üzerindeki kritik etkileri.',
    content: 'Kuantum teknolojileri, geleneksel şifreleme yöntemlerini ve stratejik savunma sistemlerini yeniden tanımlıyor. ABD ve Çin arasındaki çip rekabeti, kuantum üstünlüğü yarışına evrilmiş durumda. Uzmanlar, önümüzdeki 5 yıl içinde güvenli veri iletişiminin tamamen kuantum dayanıklı algoritmalar ile değiştirileceğini öngörüyor.',
    category: 'Teknoloji',
    sourceType: 'web',
    durationSeconds: 380,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: 'Dr. Elias Vance',
    keyPoints: [
      'Kuantum şifreleme klasik güvenlik katmanlarını aşıyor',
      'Çip imalatında yeni tedarik zinciri stratejileri',
      'Yapay zeka ve kuantum hibrit sistemlerin yükselişi'
    ]
  },
  {
    id: 'dunya-diplomasi-2026',
    title: 'Küresel Diplomasi ve Zirve Bildirisi',
    summary: 'Dünya liderlerinin sürdürülebilir enerji ve sınır ötesi veri güvenliği hususunda imzaladığı tarihi anlaşma.',
    content: 'Küresel liderler bu yıl düzenlenen zirvede sınır ötesi veri güvenliği, siber kriz yönetimi ve yenilenebilir enerji alanlarında bağlayıcı ilkeleri kabul etti. Uzmanlar bu uzlaşının uluslararası ilişkilerde yeni bir dönemin habercisi olduğunu vurguluyor.',
    category: 'Dünya',
    sourceType: 'web',
    durationSeconds: 450,
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    author: 'VOX Dünya Editörü',
    keyPoints: [
      'Sınır ötesi veri güvenliği standartları',
      'Yenilenebilir enerjiye geçiş takvimi',
      'Uluslararası siber kriz protokolleri'
    ]
  },
  {
    id: 'ekonomi-dijital-tl',
    title: 'Ekonomide Merkez Bankaları ve Dijital Varlıklar',
    summary: 'Makroekonomik dengeler, enflasyon hedefleri ve dijital merkez bankası paralarının (CBDC) piyasalara etkisi.',
    content: 'Dünya genelinde merkez bankalarının dijital para projelerinde pilot aşamadan yaygın kullanıma geçiş adımları hızlandı. Reel sektör ve finans analistleri, dijital para birimlerinin ticari nakit akışını ve enflasyon dinamiklerini doğrudan etkileyeceğini ifade ediyor.',
    category: 'Ekonomi',
    sourceType: 'web',
    durationSeconds: 510,
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    author: 'Selin Karaca',
    keyPoints: [
      'Dijital Merkez Bankası Paraları (CBDC) analizi',
      'Küresel enflasyon beklentileri ve faiz adımları',
      'Reel sektör nakit akış yönetimi'
    ]
  },
  {
    id: 'kultur-sanat-dijital-muze',
    title: 'Yapay Zeka Müzeciliği ve Kültürel Miras',
    summary: 'Kültür ve sanat dünyasında yeni çağ: Yapay zeka ile restorasyon ve interaktif müze sergileri.',
    content: 'Tarihi yapıtların ve tahrip olmuş resimlerin yapay zeka restorasyon teknolojileriyle yeniden hayat bulması, sanat camiasında büyük heyecan uyandırıyor. Ziyaretçiler artık tarihi dönemleri 3B etkileşimli alanlarda canlı olarak tecrübe edebiliyor.',
    category: 'Kültür & Sanat',
    sourceType: 'web',
    durationSeconds: 390,
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    author: 'Caner Alpay',
    keyPoints: [
      'Yapay zeka desteğiyle tarihi eser restorasyonu',
      'İnteraktif dijital sanat galerileri',
      'Kültürel mirasın dijital arşivlenmesi'
    ]
  },
  {
    id: 'silicon-forest',
    title: 'The Architecting of Silicon Forest',
    summary: 'Pasifik Kuzeybatısında yükselen yeşil veri merkezleri ve sürdürülebilir donanım mimarileri.',
    content: 'Pasifik Kuzeybatısının ormanlık vadileri, yeni nesil hidroelektrik destekli yeşil veri merkezlerine ev sahipliği yapıyor. Silikon Ormanı olarak adlandırılan bu bölge, yapay zeka sunucularının yüksek enerji tüketimini sıfır karbonlu soğutma teknolojileriyle çözmeyi hedefliyor.',
    category: 'Sürdürülebilirlik',
    sourceType: 'web',
    durationSeconds: 765,
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    author: 'Helena Vance',
    keyPoints: [
      'Sıfır karbonlu sıvı soğutmalı sunucu blokları',
      'Doğal hidroelektrik kaynaklarının veri merkezlerinde kullanımı',
      'Geri dönüştürülebilir yarı iletken donanımları'
    ]
  },
  {
    id: 'ethics-of-ai',
    title: 'The Ethics of AI & Neural Interfaces',
    summary: 'Nöral arayüzlerin insan bilinci üzerindeki etkileri ve etik yapay zeka sınırları.',
    content: 'İnsan beyni ile bilgisayarlar arasındaki doğrudan bağlantı kuran nöral çipler, sağlık alanında devrim yaratırken etik tartışmaları da beraberinde getiriyor. Düşünce gizliliği ve yapay zeka destekli hafıza güçlendirme teknolojileri hukuki çerçevenin hızla güncellenmesini gerektiriyor.',
    category: 'Etik & Bilim',
    sourceType: 'ocr',
    durationSeconds: 420,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    author: 'Prof. Marcus Thorne',
    keyPoints: [
      'Nöral veri mahremiyeti hakkı',
      'Bilişsel güçlendirmede adalet ve erişim',
      'İnsan-makine ortak yaşamının geleceği'
    ]
  },
  {
    id: 'modern-stoicism',
    title: 'Modern Stoicism in High-Tech Era',
    summary: 'Hızlı dijital bilgi çağında zihinsel odaklanma ve Stoacı felsefenin güncel yorumu.',
    content: 'Günün her anında bildirimler ve veri akışına maruz kalan modern insan için Stoacılık bir zihinsel kalkan işlevi görüyor. Marcus Aurelius ve Seneca’nın öğretileri, dijital detoks ve bilinçli dinleme alışkanlıklarıyla yeniden hayat buluyor.',
    category: 'Felsefe',
    sourceType: 'pdf',
    durationSeconds: 310,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    author: 'Elena Rostova',
    keyPoints: [
      'Dijital gürültüden arınma rehberi',
      'Kontrol edilebilir ve edilemez durumların ayrımı',
      'Derin odaklanma ve mikro meditasyon'
    ]
  },
  {
    id: 'global-markets-briefing',
    title: 'Global Markets: The Morning Intelligence',
    summary: 'Küresel finans piyasaları, makroekonomik eğilimler ve faiz kararlarının piyasa dinamiklerine yansıması.',
    content: 'Merkez bankalarının faiz kararları ve küresel enflasyon verileri piyasalarda yeni bir denge noktası arayışına neden oluyor. Teknoloji hisselerindeki hareketlilik ve kripto varlık düzenlemeleri yatırımcıların odağında kalmaya devam ediyor.',
    category: 'Finans',
    sourceType: 'web',
    durationSeconds: 520,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    author: 'Financial Times Analyst',
    keyPoints: [
      'Merkez bankalarının para politikası sinyalleri',
      'Teknoloji ve çip hisselerinde borsa hareketliliği',
      'Küresel emtia ve enerji fiyat analizleri'
    ]
  }
];
