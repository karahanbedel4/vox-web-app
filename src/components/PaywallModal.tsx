import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Zap, ShieldCheck, RefreshCw, X, Volume2, FileText, Bell, Award, CheckCircle2, AlertCircle, Infinity as InfinityIcon, UserCheck } from 'lucide-react';
import { isCapacitorNative } from '../lib/revenuecat';
import { VoxLogo } from './VoxLogo';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (tier: 'monthly' | 'yearly' | 'lifetime') => Promise<{ success: boolean; message: string }>;
  onRestore: () => Promise<{ success: boolean; message: string }>;
  onOpenNativePaywall?: () => Promise<boolean>;
  onOpenCustomerCenter?: () => Promise<boolean>;
  isLoading?: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  onRestore,
  onOpenNativePaywall,
  onOpenCustomerCenter,
  isLoading = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeLegalDoc, setActiveLegalDoc] = useState<'eula' | 'privacy' | null>(null);

  if (!isOpen) return null;

  const handleBuy = async () => {
    const res = await onPurchase(selectedPlan);
    setToastMessage({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success) {
      setTimeout(() => {
        onClose();
        setToastMessage(null);
      }, 2000);
    }
  };

  const handleRestorePurchases = async () => {
    const res = await onRestore();
    setToastMessage({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success) {
      setTimeout(() => {
        onClose();
        setToastMessage(null);
      }, 2000);
    }
  };

  const handleNativePaywall = async () => {
    if (onOpenNativePaywall) {
      const success = await onOpenNativePaywall();
      if (success) {
        setToastMessage({ type: 'success', text: 'Vox - Bulten Ozetleyici Pro aktif edildi!' });
        setTimeout(() => {
          onClose();
          setToastMessage(null);
        }, 1500);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        {/* Animated Toast Message */}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl text-xs font-bold max-w-xs text-center ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-[0_0_30px_rgba(78,222,163,0.3)]'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-surface-container/95 border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(78,222,163,0.15)] flex flex-col max-h-[92vh] text-on-surface"
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-b from-primary/20 via-surface-container to-surface-container text-center border-b border-white/10 space-y-3">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-2">
              <VoxLogo size="md" textColor="light" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-black text-primary uppercase tracking-widest shadow-[0_0_15px_rgba(78,222,163,0.3)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BÜLTEN & HABER PRO</span>
              </div>
            </div>

            <h2 className="font-display text-2xl font-black tracking-tight text-white leading-tight">
              Sınırsız Zekaya & Sesli İçeriğe Erişin
            </h2>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Sınırsız YouTube video, Web ve PDF özetleme hakkı. RevenueCat ile 100% güvenli ödeme.
            </p>
          </div>

          {/* Features Checklist */}
          <div className="p-5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 text-xs">
            <div className="space-y-2.5 bg-black/30 p-4 rounded-2xl border border-white/5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Sınırsız Gemini 3.6 Özetleme</h4>
                  <p className="text-[11px] text-on-surface-variant">Web bağlantıları, YouTube videoları ve PDF dosyalarını kota engeli olmadan özetleyin.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-emerald-400/10 text-emerald-400 shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">HD Studio Seslendirme (TTS)</h4>
                  <p className="text-[11px] text-on-surface-variant">Doğal vurgulu Türkçe ve İngilizce stüdyo kalitesinde sesli anlatım.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-blue-400/10 text-blue-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">PDF Belge Analizi & OCR</h4>
                  <p className="text-[11px] text-on-surface-variant">Akademik raporları ve taranmış belgeleri hızlıca sesli bültene dönüştürün.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-purple-400/10 text-purple-400 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">YouTube Bildirim Senkronizasyonu</h4>
                  <p className="text-[11px] text-on-surface-variant">Takip ettiğiniz kanallar yeni video yayınladığında otomatik özet alın.</p>
                </div>
              </div>
            </div>

            {/* Plan Selection Cards: Lifetime, Yearly, Monthly */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">Abonelik Paketini Seçin</span>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Monthly Plan */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedPlan === 'monthly'
                      ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(78,222,163,0.2)]'
                      : 'bg-surface-container-high/40 border-white/10 text-on-surface-variant hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider block">Aylık</span>
                    <div className="font-display text-sm font-bold text-white mt-1">149.99 ₺</div>
                  </div>
                  <span className="text-[9px] text-on-surface-variant mt-2 block">Aylık yenilenir</span>
                </button>

                {/* Yearly Plan (Best Value) */}
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedPlan === 'yearly'
                      ? 'bg-primary/25 border-primary text-white shadow-[0_0_25px_rgba(78,222,163,0.35)] ring-1 ring-primary'
                      : 'bg-surface-container-high/40 border-white/10 text-on-surface-variant hover:border-white/20'
                  }`}
                >
                  <div className="absolute -top-2 right-1 bg-gradient-to-r from-emerald-400 to-primary text-on-primary text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    POPÜLER
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-primary tracking-wider block">Yıllık</span>
                    <div className="font-display text-sm font-bold text-white mt-1">999.99 ₺</div>
                    <span className="text-[9px] text-emerald-400 font-semibold block">%45 İndirim</span>
                  </div>
                  <span className="text-[9px] text-emerald-300 font-bold mt-1 block">7 Gün Ücretsiz</span>
                </button>

                {/* Lifetime Plan */}
                <button
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedPlan === 'lifetime'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                      : 'bg-surface-container-high/40 border-white/10 text-on-surface-variant hover:border-white/20'
                  }`}
                >
                  <div className="absolute -top-2 right-1 bg-amber-400 text-neutral-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-0.5">
                    <InfinityIcon className="w-2.5 h-2.5" />
                    <span>ÖMÜR BOYU</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-300 tracking-wider block">Ömür Boyu</span>
                    <div className="font-display text-sm font-bold text-white mt-1">2.499 ₺</div>
                  </div>
                  <span className="text-[9px] text-amber-300 font-bold mt-2 block">Tek seferlik ödeme</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-white/10 bg-surface-container space-y-3">
            <button
              onClick={handleBuy}
              disabled={isLoading}
              className="w-full py-4 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-[0_0_25px_rgba(78,222,163,0.35)] active:scale-95 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>RevenueCat SDK İşleniyor...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 fill-current" />
                  <span>
                    {selectedPlan === 'lifetime'
                      ? 'Ömür Boyu Pro Satın Al (Tek Seferlik)'
                      : selectedPlan === 'yearly'
                      ? '7 Gün Ücretsiz Dene & Yıllık Başlat'
                      : 'Aylık Vox Pro Aboneliği Başlat'}
                  </span>
                </>
              )}
            </button>

            {/* Present RevenueCat Native Paywall UI option */}
            {onOpenNativePaywall && (
              <button
                onClick={handleNativePaywall}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-on-surface border border-white/10 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>RevenueCat Native Paywall Ekranını Aç</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
              <button
                onClick={handleRestorePurchases}
                disabled={isLoading}
                className="hover:text-white underline font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Satın Almaları Geri Yükle</span>
              </button>

              {onOpenCustomerCenter && (
                <button
                  onClick={() => onOpenCustomerCenter()}
                  className="hover:text-white underline font-medium flex items-center gap-1 text-primary"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Abonelik Yönetimi</span>
                </button>
              )}
            </div>

            {/* Apple Guideline 3.1.2 Mandatory EULA & Privacy Policy Links */}
            <div className="pt-2 border-t border-white/10 text-center space-y-1.5">
              <p className="text-[9px] leading-relaxed text-on-surface-variant/80">
                Abonelikler, cari dönemin bitiminden 24 saat önce App Store Ayarlarınızdan kapatılmadığı sürece otomatik yenilenir. Ödeme iTunes Hesabınızdan tahsil edilir.
              </p>
              <div className="flex items-center justify-center gap-3 text-[10px] text-primary">
                <button
                  type="button"
                  onClick={() => setActiveLegalDoc('eula')}
                  className="hover:underline font-semibold"
                >
                  Kullanım Koşulları (EULA)
                </button>
                <span className="text-white/20">•</span>
                <button
                  type="button"
                  onClick={() => setActiveLegalDoc('privacy')}
                  className="hover:underline font-semibold"
                >
                  Gizlilik Politikası
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400/80">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RevenueCat & StoreKit 2 Güvenli Altyapı</span>
            </div>
          </div>
        </motion.div>

        {/* Legal Terms & EULA Viewer Modal */}
        {activeLegalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-surface-container border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-on-surface text-xs leading-relaxed">
              <button
                onClick={() => setActiveLegalDoc(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-display text-lg font-bold text-white">
                {activeLegalDoc === 'eula' ? 'Kullanım Koşulları & EULA (Apple Standard)' : 'Gizlilik Politikası'}
              </h3>

              {activeLegalDoc === 'eula' ? (
                <div className="space-y-3 text-on-surface-variant">
                  <p className="font-semibold text-white">1. Abonelik Şartları ve Otomatik Yenileme</p>
                  <p>VOX Pro aboneliğiniz, seçilen paket süresi (Aylık veya Yıllık) sonunda otomatik olarak yenilenir. Ücret, satın alma onayının ardından Apple ID iTunes Hesabınızdan tahsil edilir.</p>
                  
                  <p className="font-semibold text-white">2. İptal ve Yönetim</p>
                  <p>Aboneliğinizi ve otomatik yenilemeyi istediğiniz zaman iOS Cihazınızın Ayarlar &gt; Apple ID &gt; Abonelikler bölümünden yönetebilir veya iptal edebilirsiniz. İptal işlemi cari fatura döneminin sonundan itibaren geçerli olur.</p>

                  <p className="font-semibold text-white">3. Ücretsiz Deneme Süreci</p>
                  <p>Sunulan 7 günlük ücretsiz deneme süresi sona ermeden en geç 24 saat önce iptal edilmediği takdirde, standart abonelik ücreti hesabınıza yansıtılır.</p>

                  <p className="font-semibold text-white">4. Lisans ve Kullanım</p>
                  <p>Uygulama üzerinden erişilen AI özetleri, seslendirmeler ve içerikler kişisel kullanımınız içindir. Apple Standard End User License Agreement (EULA) kuralları geçerlidir.</p>
                </div>
              ) : (
                <div className="space-y-3 text-on-surface-variant">
                  <p className="font-semibold text-white">1. Veri Gizliliği Güvencesi</p>
                  <p>VOX, kişisel bilgilerinizi veya haber kaydetme tercihlerinizi asla üçüncü taraflarla paylaşmaz ve satmaz.</p>

                  <p className="font-semibold text-white">2. Toplanan Bilgiler</p>
                  <p>Yalnızca anonimleştirilmiş analizler, hesap e-posta adresiniz (giriş yapıldıysa) ve kayıtlı bülten tercihleriniz cihazınızda ve emniyetli Firebase altyapısında saklanır.</p>

                  <p className="font-semibold text-white">3. Ödeme Güvenliği</p>
                  <p>Kredi kartı ve ödeme bilgileriniz doğrudan Apple App Store / RevenueCat tarafından işlenir; VOX sunucularında hiçbir finansal bilgi tutulmaz.</p>
                </div>
              )}

              <button
                onClick={() => setActiveLegalDoc(null)}
                className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl mt-4"
              >
                Anladım ve Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
