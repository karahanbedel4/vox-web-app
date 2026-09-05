import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Headphones, Compass, ShieldCheck, Mail, Globe, Award, BookOpen } from 'lucide-react';
import { VoxLogo } from './VoxLogo';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Hakkımızda | VOX - Dijital Haber ve Odaklanma Platformu';
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
            <Link to="/kunye" className="text-gray-400 hover:text-white transition-colors">Künye & İletişim</Link>
            <Link to="/yayin-ilkeleri" className="text-gray-400 hover:text-white transition-colors">Yayın İlkeleri</Link>
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
        {/* Hero Section */}
        <section className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biz Kimiz & Ne Yapıyoruz?</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-display">
            Gürültüden Arındırılmış Bilgi ve Derin Odaklanma Alanı
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            VOX, modern çağın en büyük problemi olan <strong className="text-white font-semibold">dijital bilgi kirliliği</strong> ve <strong className="text-white font-semibold">dikkat dağınıklığına</strong> karşı geliştirilmiş bağımsız bir dijital medya ve üretkenlik platformudur.
          </p>
        </section>

        {/* Kurucu Bölümü (E-E-A-T için çok kritik) */}
        <section className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1ed760]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:md:h-24 rounded-2xl bg-gradient-to-br from-[#1ed760] to-teal-700 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#141c17] flex items-center justify-center text-white font-black text-2xl font-display">
                KB
              </div>
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black text-white font-display">Karahan Bedel</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1ed760]/20 border border-[#1ed760]/30 text-[#1ed760] text-xs font-bold">
                  Kurucu & Genel Yayın Yönetmeni
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Yazılım geliştirici, bağımsız dijital yayıncı ve içerik üreticisi. VOX projesi; haber tüketiminde tık avcısı (clickbait) başlıkların ve dikkat sömürüsünün yerine, nitelikli özetler ve derin çalışma (deep work) ortamları sunma vizyonuyla hayata geçirildi.
              </p>
              <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 font-mono">
                <a href="mailto:karahanbedel@gmail.com" className="flex items-center gap-1.5 hover:text-[#1ed760] transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>karahanbedel@gmail.com</span>
                </a>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <span>İstanbul, Türkiye</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Misyon & Değerlerimiz */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#1ed760]">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Daha Az Oku, Daha Çok Dinle</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Uzun ve tekrarlarla dolu haber metinlerini yapay zeka ile 50-80 kelimelik hap özetlere dönüştürüyor ve stüdyo kalitesinde Türkçe seslendirme ile kulaklığınıza getiriyoruz.
            </p>
          </div>

          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Derin Odaklanma Alanı</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Pomodoro tekniği, efsanevi film müzikleri (Hans Zimmer, Interstellar) ve ambient ses mikseri ile bölünmeyen bir çalışma deneyimi sunuyoruz.
            </p>
          </div>

          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Şeffaflık & Teyit</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Her haberin kaynak ajansı açıkça belirtilir. Sansasyonel ve yanıltıcı içeriklere yer verilmez; editöryal süzgeçten geçirilmiş güvenilir bilgi aktarılır.
            </p>
          </div>
        </section>

        {/* Teknolojik Altyapı */}
        <section className="space-y-4 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold text-white font-display">Teknolojik Altyapı ve İnovasyon</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            VOX, modern web standartları olan React, TypeScript ve Vite üzerinde Progressive Web App (PWA) mimarisiyle inşa edilmiştir. Google Cloud ve Firebase bulut altyapısı üzerinde çalışan sistemimiz, Google DeepMind tarafından geliştirilen gelişmiş yapay zeka modelleriyle güçlendirilmektedir.
          </p>
          <p className="text-gray-400 leading-relaxed text-sm">
            Haberlerimiz otomatik olarak derlenirken, doğal dil işleme algoritmaları tarafsızlık ve doğruluk testlerinden geçer. Kullanıcılarımızın kişisel gizliliği en üst düzeyde korunur; çerez ve veri politikalarımız GDPR ve KVKK ile tam uyumludur.
          </p>
        </section>

        {/* Hızlı Bağlantılar */}
        <section className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <Link to="/kunye" className="hover:text-white font-medium underline">Künye ve Yönetim</Link>
            <Link to="/yayin-ilkeleri" className="hover:text-white font-medium underline">Yayın ve Doğruluk İlkeleri</Link>
            <Link to="/rehberler" className="hover:text-white font-medium underline">Özgün Rehber Makaleleri</Link>
            <Link to="/gizlilik" className="hover:text-white font-medium underline">Gizlilik Politikası</Link>
          </div>
          <p>© 2026 VOX (voxozet.com) - Tüm hakları saklıdır.</p>
        </section>
      </main>
    </div>
  );
};
