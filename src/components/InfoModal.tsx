import React from 'react';
import { X, Shield, FileText, Info, Mail, Award, CheckCircle2, Scale, ShieldAlert, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoxLogo } from './VoxLogo';

export type InfoModalType = 'about' | 'privacy' | 'terms' | 'contact' | 'ads' | 'impressum' | 'legal' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const contentMap: Record<NonNullable<InfoModalType>, { title: string; icon: React.ReactNode; body: React.ReactNode }> = {
    about: {
      title: 'Hakkımızda & Yayın İlkeleri',
      icon: <Info className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-4 text-xs leading-relaxed text-gray-300">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
            <VoxLogo size="lg" textColor="light" />
          </div>
          <p className="text-sm font-semibold text-white">
            VOX — Yapay Zeka Destekli Yeni Nesil Odak ve Haber Platformu
          </p>
          <p>
            VOX (voxozet.com), Türkiye ve dünya gündemindeki gelişmeleri sansasyondan ve bilgi kirliliğinden arındırarak okuyuculara ve dinleyicilere en yalın, tarafsız ve anlaşılır biçimde sunmak amacıyla kurulmuştur.
          </p>
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1ed760]" /> Doğruluk ve Kaynak Şeffaflığı
            </h4>
            <p className="text-gray-400">
              Yayınlanan tüm haberler Türkiye'nin ve dünyanın önde gelen saygın haber ajansları ve basın kuruluşları referans alınarak özetlenir. Her haberde orijinal kaynak açıkça belirtilir.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-white block">Teknoloji Altyapısı</span>
            <p className="text-[11px] text-gray-400">
              VOX haber işleme motoru; Google Gemini yapay zeka modelleri, anlık RSS veri akışları ve gelişmiş metin-ses (TTS) dönüştürücüler ile donatılmıştır.
            </p>
          </div>
        </div>
      ),
    },
    privacy: {
      title: 'Gizlilik Politikası & Çerezler (KVKK / GDPR)',
      icon: <Shield className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>
            VOX (voxozet.com) olarak kişisel verilerinizin güvenliğine ve gizliliğinize en üst düzeyde önem veriyoruz.
          </p>
          <div className="space-y-1.5">
            <h4 className="font-bold text-white">1. Veri Sorumlusu ve Toplanan Veriler</h4>
            <p className="text-gray-400">
              Kullanıcı deneyimini kişiselleştirmek amacıyla yalnızca oturum açma (Google Identity / E-posta), okuma geçmişi ve yer imleri bilgileri güvenli bulut veritabanında saklanır.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-white">2. Çerezler ve Reklam Ortakları (Google AdSense)</h4>
            <p className="text-gray-400">
              Sitemizde üçüncü taraf tedarikçiler (Google dahil), sitemize veya diğer web sitelerine yapılan önceki ziyaretlere dayalı olarak reklam yayınlamak için çerezleri (cookies) kullanır. Kullanıcılar Google Reklam Ayarları üzerinden kişiselleştirilmiş reklamları diledikleri zaman devre dışı bırakabilirler.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-white">3. KVKK ve Kullanıcı Hakları</h4>
            <p className="text-gray-400">
              6698 sayılı KVKK kapsamında kayıtlı tüm verilerinizi sorgulama, güncelleme veya silinmesini talep etme hakkına sahipsiniz. Başvurularınız için <strong className="text-white">iletisim@voxozet.com</strong> üzerinden bize ulaşabilirsiniz.
            </p>
          </div>
        </div>
      ),
    },
    terms: {
      title: 'Kullanım Koşulları',
      icon: <FileText className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>
            voxozet.com web sitesini ve VOX mobil uygulamasını ziyaret ederek aşağıdaki şartları kabul etmiş sayılırsınız:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-gray-400">
            <li>VOX üzerinde paylaşılan haber özetleri ve sesli içerikler yalnızca bilgilendirme ve eğitim amaçlıdır.</li>
            <li>Haber içerikleri ve fotoğrafların fikri mülkiyet hakları kaynak gösterilen ilgili basın kuruluşlarına aittir.</li>
            <li>Sitenin güvenliğini tehdit edecek otomatik tarama, veri madenciliği veya tersine mühendislik girişimleri yasaktır.</li>
          </ul>
        </div>
      ),
    },
    contact: {
      title: 'İletişim & Künye',
      icon: <Mail className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>Her türlü soru, öneri, telif hakkı bildirimi ve iş birliği talepleriniz için bize ulaşabilirsiniz:</p>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 font-mono">
            <div>
              <span className="text-gray-500 block text-[10px]">E-POSTA</span>
              <a href="mailto:karahanbedel@gmail.com" className="text-[#1ed760] font-bold hover:underline">
                karahanbedel@gmail.com
              </a>
              <span className="text-gray-400 block text-[11px]">iletisim@voxozet.com</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">WEB SİTESİ</span>
              <span className="text-white font-bold">https://voxozet.com</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">EDİTORYAL YÖNETİM</span>
              <span className="text-white">VOX Dijital Haber & Yayın Grubu</span>
            </div>
          </div>
        </div>
      ),
    },
    ads: {
      title: 'Reklam & Sponsorluk',
      icon: <Award className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>
            VOX, yüksek dikkat ve derin odak seviyesine sahip nitelikli okuyucu kitlesine ulaşmak isteyen markalar için kurumsal sponsorluk ve yerel (native) reklam alanları sunar.
          </p>
          <div className="p-3.5 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/30 space-y-1">
            <span className="font-bold text-[#1ed760] block">Reklam & İş Birlikleri</span>
            <p className="text-[11px] text-gray-300">
              Kategori sponsorlukları, sesli bülten entegrasyonları ve özel banner alanları için <strong className="text-white">iletisim@voxozet.com</strong> veya <strong className="text-white">karahanbedel@gmail.com</strong> adresinden teklif alabilirsiniz.
            </p>
          </div>
        </div>
      ),
    },
    impressum: {
      title: 'Künye & Yasal Bilgiler',
      icon: <FileText className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3 text-xs leading-relaxed text-gray-300">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">YAYIN SAHİBİ</span>
            <p className="font-bold text-white">VOX Dijital Medya (voxozet.com)</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">İMTİYAZ SAHİBİ & YÖNETİM</span>
            <p className="font-bold text-white">Bedel Karahan</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">İLETİŞİM E-POSTA</span>
            <p className="text-[#1ed760] font-mono">karahanbedel@gmail.com / iletisim@voxozet.com</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">ALTYAPI & BARINDIRMA</span>
            <p className="text-gray-300">Vercel Inc. & Google Cloud Platform</p>
          </div>
        </div>
      ),
    },
    legal: {
      title: 'Yasal Uyarı & Uyar-Kaldır (5651 Sayılı Kanun)',
      icon: <Scale className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-4 text-xs leading-relaxed text-gray-300">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <VoxLogo size="sm" textColor="light" />
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              5651 & FSEK Bildirimi
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Yasal Uyarı Metni</span>
            </div>
            <p className="text-gray-200 leading-relaxed text-xs sm:text-sm text-justify sm:text-left font-normal">
              VOX, halka açık haber kaynaklarından elde edilen içerikleri otomatik olarak derleyen ve yapay zeka aracılığıyla özetleyen bir aracı platformdur. Platformumuzda yer alan haberlerin orijinal içerikleri, doğruluğu ve hukuki sorumluluğu tamamen ilgili yayıncı kuruluşlara aittir. VOX, sağlanan metinler üzerinde herhangi bir editoryal denetim veya yönlendirme yapmaz. Telif hakları, kişilik hakları ihlali veya diğer geçerli hukuki gerekçelerle uygulamamızdan veya web sitemizden kaldırılmasını talep ettiğiniz içerikler için, ilgili haberin URL'si veya ekran görüntüsü ile birlikte <strong className="text-emerald-400 font-bold">voxozet@gmail.com</strong> adresine e-posta gönderebilirsiniz. 5651 sayılı kanun kapsamında "Uyar ve Kaldır" prensibini benimseyen platformumuz, yasal taleplerinizi değerlendirerek gerekli teknik aksiyonları en kısa sürede alacaktır.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-white text-xs">voxozet@gmail.com</span>
            </div>
            <a
              href="mailto:voxozet@gmail.com?subject=VOX%20İçerik%20Kaldırma%20Talebi%20(5651%20Sayılı%20Kanun)"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>E-posta Gönder</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ),
    },
  };

  const item = contentMap[type];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#121814] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#151d18]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1ed760]/15 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {item.body}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-white/10 bg-[#151d18] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
