import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ExternalLink, 
  Eye, 
  X, 
  Flame, 
  RefreshCw 
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface NewsletterSectionProps {
  className?: string;
  defaultEmail?: string;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  className = '',
  defaultEmail = ''
}) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState(defaultEmail);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Instant Test Send State
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    previewUrl?: string;
  } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubscribeStatus({ success: false, message: 'Lütfen geçerli bir e-posta adresi girin.' });
      return;
    }

    setIsSubscribing(true);
    setSubscribeStatus(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer_form' })
      });
      const data = await res.json();
      if (data.success) {
        setSubscribeStatus({ success: true, message: data.message });
      } else {
        setSubscribeStatus({ success: false, message: data.message || 'Abonelik başlatılamadı.' });
      }
    } catch (err: any) {
      setSubscribeStatus({ success: false, message: 'Bağlantı hatası oluştu.' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleOpenPreview = async () => {
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/newsletter/preview');
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
      }
    } catch (e) {
      console.warn('Preview fetch error:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    const targetEmail = email.trim() || 'karahanbedel@gmail.com';
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/newsletter/send-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Günlük bülten (${data.deduplicationStats?.selectedTopicsCount || 10} özgün haber) ${targetEmail} adresine iletildi!`,
          previewUrl: data.previewUrl
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'E-posta gönderilemedi.'
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: 'Bağlantı hatası oluştu.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 transition-all ${
      theme === 'light'
        ? 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border-slate-200 shadow-sm'
        : 'bg-gradient-to-br from-[#121915] via-[#0f1411] to-[#0c100e] border-white/10 shadow-xl'
    } ${className}`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Info Column */}
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akıllı Günlük Haber Bülteni</span>
          </div>

          <h3 className={`text-lg sm:text-2xl font-black tracking-tight ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            Günün En Çok Paylaşılan 10 Haberi Her Sabah E-Postanızda
          </h3>

          <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-400'
          }`}>
            TRT, NTV, Habertürk ve onlarca güvenilir kaynaktaki haberler taranır. 
            Birbirine benzeyen haberler yapay zeka tarafından ayıklanarak 
            <strong> sadece en önemli 10 özgün konu</strong> derlenir. 
            Her haber doğrudan VOX sitesindeki sesli hap özete yönlendirir.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className={`px-2.5 py-1 rounded-lg border font-mono font-medium flex items-center gap-1.5 ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-gray-300'
            }`}>
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>100+ Haber Taranır &rarr; 10 Özgün Gündem Seçilir</span>
            </span>

            <span className={`px-2.5 py-1 rounded-lg border font-mono font-medium text-emerald-500 ${
              theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/40 border-emerald-500/20'
            }`}>
              %90 Tekrar Temizlenir
            </span>
          </div>
        </div>

        {/* Action Column */}
        <div className="w-full md:w-80 shrink-0 space-y-3">
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz..."
                required
                className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border focus:outline-none transition-all pr-10 ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-white/5 border-white/15 text-white placeholder-gray-500 focus:border-emerald-400'
                }`}
              />
              <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isSubscribing}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubscribing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Bültene Ücretsiz Abone Ol</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback message */}
          {subscribeStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              subscribeStatus.success 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {subscribeStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{subscribeStatus.message}</span>
            </div>
          )}

          {/* Interactive Test & Preview Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenPreview}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bülteni Önizle</span>
            </button>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/20 text-emerald-300'
              }`}
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Örnek Gönder</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-xl text-[11px] space-y-1 ${
              testResult.success 
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              <p>{testResult.message}</p>
              {testResult.previewUrl && (
                <a 
                  href={testResult.previewUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline text-emerald-400 font-bold"
                >
                  <span>Test E-posta Önizleme Bağlantısı</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DEDUPLICATED DIGEST PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[85vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#121815] border-white/10'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Günün En Çok Paylaşılan 10 Haberi (Ayıklanmış Liste)
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Benzer başlıklar tek bir haber altında birleştirilmiş ve en çok paylaşılanlar seçilmiştir.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {previewLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">100+ haber taranıyor ve başlık benzerlikleri ayıklanıyor...</p>
                </div>
              ) : previewData ? (
                <>
                  {/* Analysis Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Toplam <strong>{previewData.totalScannedCount} Haber</strong> Tarandı &rarr; 
                        Sadece <strong>{previewData.articles?.length || 10} Özgün Başlık</strong> Seçildi.
                      </span>
                    </div>
                    <span className="font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                      %{previewData.reductionPercentage} Tekrar Temizlendi
                    </span>
                  </div>

                  {/* 10 Deduplicated Stories */}
                  <div className="space-y-3">
                    {previewData.articles?.map((art: any) => (
                      <div
                        key={art.index}
                        className={`p-4 rounded-2xl border transition-all ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                            : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          {art.imageUrl && (
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-full sm:w-28 h-20 object-cover rounded-xl shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {art.category || 'Gündem'}
                              </span>

                              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-amber-400" />
                                <span>{art.coverageCount} Kaynakta Paylaşıldı:</span>
                                <span className="text-gray-400 dark:text-gray-300">
                                  {art.sources?.join(', ')}
                                </span>
                              </span>
                            </div>

                            <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {art.index}. {art.title}
                            </h5>

                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {art.summary}
                            </p>

                            <div className="pt-1">
                              <a
                                href={art.voxUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:underline"
                              >
                                <span>VOX'ta Haberi Aç & Dinle</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Önizleme verisi alınamadı.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-400">
                Her sabah saat 08:00'de otomatik olarak abonelere gönderilir.
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
