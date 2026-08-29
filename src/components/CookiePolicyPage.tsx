import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Cookie, 
  ShieldCheck, 
  Database, 
  Lock, 
  HardDrive, 
  Sliders, 
  Trash2, 
  CheckCircle2, 
  Newspaper, 
  Headphones, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { VoxLogo } from './VoxLogo';

export const CookiePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Scroll to top on mount and set SEO Title
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Çerez Politikası ve Veri Depolama | VOX';
  }, []);

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0e1217] text-white'
    }`}>
      {/* Top Header Bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 sm:px-8 py-3.5 flex items-center justify-between ${
        theme === 'light' 
          ? 'bg-white/90 border-slate-200 shadow-sm' 
          : 'bg-[#12161f]/90 border-white/10 shadow-lg'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
            }`}
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Geri</span>
          </button>
          <Link to="/" className="flex items-center">
            <VoxLogo size="sm" />
          </Link>
        </div>

        {/* Action Buttons to continue experience */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/gundem"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Gündem Akışına Dön</span>
          </Link>

          <Link
            to="/odaklan"
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Odaklanma Alanına Geç</span>
            <span className="sm:hidden">Odaklan</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container - 100% Ad-Free */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title & Badge */}
        <div className="space-y-4 mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Cookie className="w-4 h-4" />
            <span>Şeffaf Veri ve Çerez Politikası</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Çerez Politikası ve Yerel Veri Depolama
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-300'
          }`}>
            VOX olarak gizliliğinize ve veri güvenliğinize en yüksek önceliği veriyoruz. Bu sayfada, web sitemizi ve mobil uygulamamızı kullandığınızda tarayıcınızda veya cihazınızda hangi verilerin neden tutulduğunu, çerezlerin nasıl işlendiğini ve deneyiminizi nasıl kişiselleştirdiğimizi ayrıntılı olarak bulabilirsiniz.
          </p>

          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Reklamsız ve Takipsiz İlke:</strong>
              VOX, kullanıcıların kişisel bilgilerini veya okuma alışkanlıklarını üçüncü taraflara satmaz. Tarayıcınızda saklanan verilerin ezici çoğunluğu doğrudan cihazınızda (Client-Side) kalır ve yalnızca uygulama içi deneyiminizi (ses mikseri, tema, yer imleri) korumak için kullanılır.
            </div>
          </div>
        </div>

        {/* Navigation Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            to="/gundem"
            className={`p-5 rounded-2xl border transition-all group flex items-center justify-between ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Gündem Haber Akışına Dön</h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                  Yapay zeka ile özetlenen sesli haberleri keşfedin
                </p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-400 opacity-70 group-hover:opacity-100" />
          </Link>

          <Link
            to="/odaklan"
            className={`p-5 rounded-2xl border transition-all group flex items-center justify-between ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Odaklanma Alanına Geç</h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                  Film müzikleri, doğa sesleri ve Pomodoro modu
                </p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-purple-400 opacity-70 group-hover:opacity-100" />
          </Link>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">1. Çerez ve Yerel Veri Depolama Nedir?</h2>
            </div>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              Çerezler (Cookies) ve modern web depolama teknolojileri (LocalStorage, SessionStorage ve IndexedDB), bir web sitesini ziyaret ettiğinizde tarayıcınızın cihazınızda sakladığı küçük veri parçacıklarıdır. Bu teknolojiler sayesinde site sizi tanır, tercihlerinizi hatırlar ve her sayfayı yenilediğinizde ayarlarınızı baştan yapmak zorunda kalmazsınız.
            </p>
          </section>

          {/* Section 2: Where are they stored */}
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">2. Çerezler ve Veriler Nerede Saklanır?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
              }`}>
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tarayıcınızın Yerel Belleği (LocalStorage)
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Tamamen cihazınızda, tarayıcınızın güvenli depolama havuzunda tutulur. İnternet bağlantınız olmasa bile tercihlerinizin anında yüklenmesini sağlar.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
              }`}>
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Çevrimdışı Önbellek (IndexedDB & Cache Storage)
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Son okuduğunuz veya dinlediğiniz haber özetlerini geçici olarak cihazınızda saklar; böylece metroda veya sinyal zayıfken haberleri kesintisiz okuyabilirsiniz.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
              }`}>
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Oturum Belleği (SessionStorage)
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Yalnızca aktif tarayıcı sekmeniz açık kaldığı sürece tutulan geçici durum bilgileri (örneğin akış filtreleme konumu).
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
              }`}>
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Güvenli Birinci Taraf Çerezler (First-Party Cookies)
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Güvenlik doğrulaması ve oturum devamlılığı için yalnızca voxozet.com etki alanı altında çalışan şifrelenmiş çerezlerdir.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: What is done with them */}
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">3. Saklanan Verilerle Ne Yapılır?</h2>
            </div>

            <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
              VOX'ta depolanan veriler yalnızca kullanıcı deneyimini doğrudan iyileştirmek için kullanılır:
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <strong className="font-bold">Görsel Tema Tercihi:</strong>
                  <span className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}> Koyu (Dark) veya Açık (Light) tema seçiminiz kaydedilir, her girişte gözünüzü yormayacak şekilde yüklenir.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <strong className="font-bold">Ses Mikseri & Ambiyans Kanalları:</strong>
                  <span className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}> Yağmur, şömine, kafe sesi, derin odak frekansları ve film müzikleri için ayarladığınız ses seviyeleri saklanır.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <strong className="font-bold">Sesli Okuma (TTS) Ayarları:</strong>
                  <span className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}> Seçtiğiniz ses tonu (Doğal, Derin, Enerjik, Sakin) ve okuma hızı (1.0x, 1.25x vb.) tercihleriniz saklanır.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <strong className="font-bold">Yer İmleri & Kaydedilen Haberler:</strong>
                  <span className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}> "Daha Sonra Oku" listenize eklediğiniz bültenler cihazınızda saklanır, dilediğiniz an tek tıkla erişebilirsiniz.</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <strong className="font-bold">Kimlik Doğrulama & Güvenlik:</strong>
                  <span className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}> Giriş yaptıysanız Firebase Auth oturum anahtarınız güvenle muhafaza edilir.</span>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4: Privacy & No Sale */}
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">4. Kişisel Verilerin Korunması (KVKK & GDPR)</h2>
            </div>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'}>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) uyarınca, cihazınızda tutulan veriler hiçbir şekilde üçüncü şahıslara satılmaz, kiralanmaz veya izinsiz ticari amaçlarla paylaşılmaz.
            </p>
          </section>

          {/* Section 5: How to clear */}
          <section className={`p-6 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#131720] border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">5. Çerezleri Nasıl Temizleyebilir veya Sıfırlayabilirsiniz?</h2>
            </div>
            <p className={`mb-3 ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
              Dilediğiniz zaman saklanan tüm verileri sıfırlama hakkına sahipsiniz:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-400">
              <li><strong className="text-white">VOX Profil Menüsünden:</strong> Profil sekmenizdeki <em>"Önbelleği ve Kayıtlı Verileri Temizle"</em> butonuna basarak anında sıfırlayabilirsiniz.</li>
              <li><strong className="text-white">Tarayıcı Ayarlarınızdan:</strong> Tarayıcınızın (Chrome, Safari, Firefox, Edge) <em>"Geçmişi ve Çerezleri Temizle"</em> menüsünden tek tuşla silebilirsiniz.</li>
            </ul>
          </section>
        </div>

        {/* Bottom Prominent CTA Navigation Bar */}
        <div className={`mt-12 p-6 sm:p-8 rounded-3xl border text-center space-y-4 ${
          theme === 'light'
            ? 'bg-gradient-to-b from-white to-slate-100 border-slate-200 shadow-lg'
            : 'bg-gradient-to-b from-[#161b26] to-[#0f131a] border-white/10 shadow-2xl'
        }`}>
          <div className="flex justify-center pb-1">
            <VoxLogo size="md" />
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight">
            Deneyiminize Kaldığınız Yerden Devam Edin
          </h3>

          <p className={`text-xs sm:text-sm max-w-xl mx-auto ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-400'
          }`}>
            Yapay zeka ile özetlenen haber bültenlerine göz atabilir ya da odaklanma alanında müzik eşliğinde çalışabilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/gundem"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Newspaper className="w-4 h-4" />
              <span>Gündem Akışına Dön</span>
            </Link>

            <Link
              to="/odaklan"
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 cursor-pointer ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Odaklanma Alanına Geç</span>
            </Link>
          </div>
        </div>

        {/* Footer Legal note */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} VOX Media Technologies. Tüm hakları saklıdır.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link to="/gizlilik" className="hover:underline hover:text-gray-400">Gizlilik Politikası</Link>
            <span>•</span>
            <Link to="/kullanim-kosullari" className="hover:underline hover:text-gray-400">Kullanım Koşulları</Link>
            <span>•</span>
            <Link to="/yasal-uyari" className="hover:underline hover:text-gray-400">Yasal Uyarı (5651)</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
