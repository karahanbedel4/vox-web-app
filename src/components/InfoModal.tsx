import React from 'react';
import { X, Shield, FileText, Info, Mail, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type InfoModalType = 'about' | 'privacy' | 'terms' | 'contact' | 'ads' | 'impressum' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const contentMap: Record<NonNullable<InfoModalType>, { title: string; icon: React.ReactNode; body: React.ReactNode }> = {
    about: {
      title: 'Hakkımızda',
      icon: <Info className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-4 text-xs leading-relaxed text-gray-300">
          <p className="text-sm font-semibold text-white">
            VOX — Yapay Zeka Destekli Yeni Nesil Haber ve Odak Platformu
          </p>
          <p>
            VOX, bilgi kirliliğinden arındırılmış, yapay zeka tarafından özetlenen ve tarafsız kaynaklardan anlık olarak derlenen haberleri kullanıcılarına sunar.
          </p>
          <p>
            Hedefimiz; okuma alışkanlığını sesli içerikler ve doğa sesleriyle zenginleştirerek, derin odaklanma ve yüksek verimlilik sağlayan modern bir haber deneyimi oluşturmaktır.
          </p>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="font-bold text-white block">Teknoloji Altyapısı</span>
            <p className="text-[11px] text-gray-400">
              VOX haber işleme ve özetleme motoru, Google AI Studio ve Gemini LLM modelleri üzerinde yüksek performans ve doğruluk ile çalışmaktadır.
            </p>
          </div>
        </div>
      ),
    },
    privacy: {
      title: 'Gizlilik Politikası',
      icon: <Shield className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>
            Gizliliğiniz VOX için en yüksek önceliğe sahiptir. Bu metin, verilerinizin nasıl korunduğunu açıklamaktadır.
          </p>
          <div className="space-y-2">
            <h4 className="font-bold text-white">1. Veri Toplama</h4>
            <p className="text-gray-400">
              VOX yalnızca oturum açma (Google Auth veya E-posta) bilgilerinizi, okuma geçmişinizi ve yer imlerinizi güvenle saklar. Kişisel verileriniz 3. taraflarla paylaşılmaz.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">2. Çerezler ve Yerel Depolama</h4>
            <p className="text-gray-400">
              Tercihleriniz (açık/koyu tema, ses ayarları vb.) yerel tarayıcı hafızasında saklanır ve izinsiz pazarlama amacıyla kullanılmaz.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">3. Güvenlik</h4>
            <p className="text-gray-400">
              Verileriniz endüstri standardı şifreleme protokolleri ve Firebase Firestore Cloud güvenlik kuralları ile korunur.
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
            VOX uygulamasını kullanarak aşağıdaki şartları kabul etmiş sayılırsınız:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-gray-400">
            <li>Sunulan haber özetleri ve içerikler bilgilendirme amaçlıdır.</li>
            <li>Haber kaynaklarının telif hakları ilgili orijinal yayıncılara aittir.</li>
            <li>Otomatik tarama veya tersine mühendislik girişimleri platform kullanım kurallarına aykırıdır.</li>
          </ul>
        </div>
      ),
    },
    contact: {
      title: 'İletişim & Destek',
      icon: <Mail className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3.5 text-xs leading-relaxed text-gray-300">
          <p>Her türlü soru, öneri ve iş birliği talepleriniz için bize ulaşabilirsiniz:</p>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 font-mono">
            <div>
              <span className="text-gray-500 block text-[10px]">E-POSTA</span>
              <a href="mailto:destek@voxmedya.com" className="text-[#1ed760] font-bold hover:underline">
                destek@voxmedya.com
              </a>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px]">SOSYAL MEDYA</span>
              <span className="text-white font-bold">@voxozet</span>
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
            VOX, yüksek dikkat ve odak seviyesine sahip bilinçli kitlelere ulaşmak isteyen markalar için özel sponsorluk ve native içerik alanları sunar.
          </p>
          <div className="p-3.5 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/30 space-y-1">
            <span className="font-bold text-[#1ed760] block">Reklam Çözümleri</span>
            <p className="text-[11px] text-gray-300">
              Kategori sponsorluğu, sesli haber bülteni sponsorlukları ve bülten entegrasyonları için <strong className="text-white">reklam@voxmedya.com</strong> adresinden bilgi alabilirsiniz.
            </p>
          </div>
        </div>
      ),
    },
    impressum: {
      title: 'Künye',
      icon: <FileText className="w-5 h-5 text-[#1ed760]" />,
      body: (
        <div className="space-y-3 text-xs leading-relaxed text-gray-300">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">YAYIN</span>
            <p className="font-bold text-white">VOX Dijital Haber & Odak Platformu</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">YAPAY ZEKA VE EDİTORYAL DİREKTÖRÜ</span>
            <p className="font-bold text-white">VOX AI Newsroom Engine</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">ALTYAPI & LLM MODEL SAĞLAYICI</span>
            <p className="font-bold text-[#1ed760]">Google AI Studio / Gemini</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono block">YER SAĞLAYICI</span>
            <p className="text-gray-300">Google Cloud Platform (GCP)</p>
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
