import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Scale, Cpu, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { VoxLogo } from './VoxLogo';

export const EditorialGuidelinesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Yayın İlkeleri & Doğruluk Beyanı | VOX';
  }, []);

  return (
    <div className="min-h-screen bg-[#0d120f] text-gray-200 selection:bg-[#1ed760] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0d120f]/90 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <VoxLogo size="sm" showText={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/hakkimizda" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</Link>
            <Link to="/kunye" className="text-gray-400 hover:text-white transition-colors">Künye & İletişim</Link>
            <Link to="/rehberler" className="text-gray-400 hover:text-white transition-colors">Rehberler</Link>
            <Link to="/" className="flex items-center gap-1 text-[#1ed760] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Etik & Gazetecilik Standartları</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-display">
            Yayın İlkeleri ve Doğruluk Beyanı
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            VOX, okuyucularına hızlı, tarafsız ve katma değeri yüksek haber sunarken uluslararası basın meslek ilkelerine ve Google Yayıncı Politikaları'na sıkı sıkıya bağlıdır.
          </p>
        </section>

        {/* 1. Doğruluk ve Teyit */}
        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#1ed760]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">1. Doğruluk ve Kaynak Teyidi (Fact-Checking)</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            VOX platformunda yayınlanan tüm haberler, teyit edilmiş kamu kurumları, ulusal/uluslararası haber ajansları (Anadolu Ajansı, Reuters, Bloomberg vb.) ve resmi bültenlerden derlenir. Sosyal medyadaki doğrulanmamış söylentiler, spekülasyonlar veya şüpheli iddialar kesinlikle haberleştirilmez.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 pl-2">
            <li>Her haberin orijinal kaynağı açıkça belirtilir.</li>
            <li>En az iki bağımsız kaynak tarafından teyit edilmemiş kritik gelişmeler yayına alınmaz.</li>
            <li>Tık avcısı (clickbait) başlıklar, manipülatif görseller ve abartılı ifadeler kullanılmaz.</li>
          </ul>
        </section>

        {/* 2. Yapay Zeka ve Şeffaflık Politikası */}
        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">2. Yapay Zeka Kullanımı ve Şeffaflık</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            VOX, haberlerin anlaşılır ve kısa özetler haline getirilmesinde ve sesli dinleme deneyiminde yapay zeka (LLM ve TTS) modellerinden yararlanır. Ancak yapay zeka hiçbir zaman tek başına yayın kararı vermez.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Tüm içerikler, Kurucu ve Genel Yayın Yönetmeni <strong>Karahan Bedel</strong> denetimindeki editöryal kurallara göre işlenir. Halüsinasyon (uydurma bilgi) riskine karşı haber metinleri orijinal basın bültenine sadık kalacak şekilde kısıtlanır.
          </p>
        </section>

        {/* 3. Düzeltme ve Tekzip Politikası */}
        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">3. Düzeltme ve Tekzip İlkeleri (Corrections Policy)</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Haber merkezimizde en yüksek doğruluk standartlarını hedeflesek de, bir haberde maddi veya olgusal bir hata tespit edildiğinde bu durum derhal düzeltilir. Düzeltilen haberin altında yapılan değişikliğin niteliği şeffafça belirtilir.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Hakkında haber yapılan kişi veya kurumların yasal tekzip haklarına saygı duyulur. İtiraz ve düzeltme bildirimleri için <a href="mailto:karahanbedel@gmail.com" className="text-[#1ed760] underline">karahanbedel@gmail.com</a> adresine e-posta gönderilmesi yeterlidir.
          </p>
        </section>

        {/* 4. Bağımsızlık ve Reklam Ayrımı */}
        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">4. Bağımsızlık ve Reklam-İçerik Ayrımı</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            VOX, herhangi bir siyasi parti, ideolojik grup veya ticari lobiye bağlı değildir. Sitemizde yer alabilecek reklam alanları (Google AdSense ve sponsorlu içerikler) haber içeriklerinden açıkça ayrıştırılır; okuyucunun yanıltılmasına asla izin verilmez.
          </p>
        </section>

        {/* Alt Bilgi */}
        <section className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <Link to="/hakkimizda" className="hover:text-white underline">Hakkımızda</Link>
            <Link to="/kunye" className="hover:text-white underline">Künye & İletişim</Link>
            <Link to="/kullanim-kosullari" className="hover:text-white underline">Kullanım Koşulları</Link>
            <Link to="/gizlilik" className="hover:text-white underline">Gizlilik Politikası</Link>
          </div>
          <p>© 2026 VOX - Tarafsız, Bağımsız ve Şeffaf Yayıncılık</p>
        </section>
      </main>
    </div>
  );
};
