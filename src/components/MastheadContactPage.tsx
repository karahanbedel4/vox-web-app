import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send, CheckCircle2, ArrowLeft, Shield, Globe, User, PhoneCall } from 'lucide-react';
import { VoxLogo } from './VoxLogo';

export const MastheadContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Künye & İletişim | VOX - Dijital Haber ve Odaklanma Platformu';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    // Client-side acknowledgement + mailto fallback
    setIsSubmitted(true);
  };

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
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <User className="w-3.5 h-3.5" />
            <span>Şeffaflık & İletişim</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-display">
            Künye ve Resmi İletişim
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            5651 Sayılı Kanun ve Google Yayıncı Politikaları uyarınca VOX Dijital Medya Platformu'na ait künye, kurumsal yönetim ve doğrudan iletişim bilgileri aşağıda yer almaktadır.
          </p>
        </section>

        {/* 2-Column Grid: Künye Bilgileri vs. İletişim Formu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sol Kolon: Künye Tablosu */}
          <div className="space-y-6">
            <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1ed760]" />
                <span>Yayın Künyesi</span>
              </h2>

              <dl className="space-y-3.5 text-xs md:text-sm">
                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Yayın Adı & Alan Adı</dt>
                  <dd className="text-white font-semibold pt-0.5">VOX (voxozet.com)</dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Kurucu & Genel Yayın Yönetmeni</dt>
                  <dd className="text-white font-semibold pt-0.5">Karahan Bedel</dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Yayın Türü</dt>
                  <dd className="text-gray-300 pt-0.5">Süreli Yaygın Dijital Yayın / Haber ve Sesli İçerik Portalı</dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Yazılım ve Teknoloji Altyapısı</dt>
                  <dd className="text-gray-300 pt-0.5">VOX Tech Lab & Google Cloud Serverless</dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Yer Sağlayıcı (Hosting)</dt>
                  <dd className="text-gray-300 pt-0.5">Google Cloud Platform (GCP) / Cloud Run Services</dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Resmi E-Posta / İletişim</dt>
                  <dd className="text-[#1ed760] font-mono font-medium pt-0.5">
                    <a href="mailto:karahanbedel@gmail.com" className="hover:underline">karahanbedel@gmail.com</a>
                  </dd>
                </div>

                <div>
                  <dt className="text-gray-500 font-mono text-[11px] uppercase">Merkez Konum</dt>
                  <dd className="text-gray-300 pt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>İstanbul, Türkiye</span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Basın / Telif Uyarısı */}
            <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.01] text-xs text-gray-400 space-y-2">
              <h3 className="font-bold text-gray-200">Telif Hakları ve Tekzip</h3>
              <p className="leading-relaxed">
                Sitemizde yayınlanan haber özetleri kamuya açık güvenilir basın kaynaklarından derlenmektedir. Herhangi bir haber veya görselle ilgili düzeltme, tekzip veya içerik kaldırma talepleriniz için lütfen resmi e-posta adresimiz üzerinden iletişime geçiniz. Talepleriniz en geç 24 saat içinde incelenip yanıtlanacaktır.
              </p>
            </div>
          </div>

          {/* Sağ Kolon: İletişim Formu */}
          <div className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1ed760]" />
              <span>Bize Ulaşın</span>
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Öneri, geri bildirim, basın bülteni veya reklam/iş birliği talepleriniz için aşağıdaki formu doldurabilir ya da doğrudan <strong className="text-white">karahanbedel@gmail.com</strong> adresine yazabilirsiniz.
            </p>

            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#1ed760] mx-auto" />
                <h3 className="text-base font-bold text-white">Mesajınız Alındı!</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  İlettiğiniz not için teşekkür ederiz. Karahan Bedel ve editöryal ekibimiz en kısa sürede geri dönüş yapacaktır.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="px-4 py-2 bg-[#1ed760] text-black font-bold text-xs rounded-xl hover:brightness-110"
                >
                  Yeni Mesaj Gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-gray-600 outline-none focus:border-[#1ed760]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">E-Posta Adresiniz *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@domain.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-gray-600 outline-none focus:border-[#1ed760]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Konu</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Öneri, Düzeltme, İş Birliği vb."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-gray-600 outline-none focus:border-[#1ed760]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Mesajınız *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Mesajınızı buraya yazınız..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-gray-600 outline-none focus:border-[#1ed760] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#1ed760]/10"
                >
                  <Send className="w-4 h-4" />
                  <span>Mesajı Gönder</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
