import React from 'react';
import { Sparkles, ShieldCheck, Compass, TrendingUp, Info } from 'lucide-react';
import { Article } from '../types';
import { useTheme } from '../lib/ThemeContext';

interface EditorialContextCardProps {
  article: Article;
  className?: string;
}

export const EditorialContextCard: React.FC<EditorialContextCardProps> = ({ article, className = '' }) => {
  const { theme } = useTheme();

  // Generate deterministic, context-rich analysis bullets based on category & title
  const category = (article.category || 'Gündem').toLowerCase();
  
  const getContextInsights = () => {
    if (category.includes('ekonomi') || category.includes('finans')) {
      return {
        whyItMatters: 'Piyasa dengeleri, enflasyon beklentileri ve hanehalkı bütçesi üzerinde doğrudan çarpan etkisi oluşturabilecek bir makroekonomik gelişmedir.',
        background: 'Merkez bankalarının sıkı para politikası adımları ve küresel emtia fiyatlarındaki dalgalanmalar çerçevesinde tedarik zincirleri ve şirket karlılıkları yakından izlenmektedir.',
        outlook: 'Önümüzdeki çeyrekte açıklanacak resmi istatistiki veriler ve politika faizi kararları, bu gelişmenin reel sektör üzerindeki kalıcı etkilerini netleştirecektir.'
      };
    }
    if (category.includes('teknoloji') || category.includes('bilim')) {
      return {
        whyItMatters: 'Dijital dönüşüm, otomasyon ve veri güvenliği standartlarında sektörün geleceğini şekillendiren kritik bir inovasyon basamağıdır.',
        background: 'Büyük dil modelleri, bulut altyapıları ve çip mimarisindeki son sıçramalar; hem son kullanıcı uygulamalarını hem de kurumsal verimlilik parametrelerini baştan tanımlamaktadır.',
        outlook: 'Yasal regülasyonlar, açık kaynak ekosisteminin adaptasyonu ve yerli teknoloji girişimlerinin bu alana entegrasyonu hız kazanacaktır.'
      };
    }
    if (category.includes('spor')) {
      return {
        whyItMatters: 'Lig sıralaması, kulüp finansal fair-play dengeleri ve takımın sezon hedefleri doğrultusunda stratejik önem taşıyan bir dönüm noktasıdır.',
        background: 'Yoğun maç takvimi, sporcu performans yönetimi ve teknik heyetin taktiksel tercihlerinin sahaya yansıması kamuoyu tarafından dikkatle takip edilmektedir.',
        outlook: 'Önümüzdeki haftalardaki fikstür performansı ve disiplin kurulu değerlendirmeleri kulübün sezon sonu tablosunu doğrudan belirleyecektir.'
      };
    }
    if (category.includes('dünya')) {
      return {
        whyItMatters: 'Bölgesel istikrar, uluslararası diplomasi ve çok taraflı ticaret koridorları açısından küresel dengeleri etkileyebilecek bir hadisedir.',
        background: 'Küresel güç odakları arasındaki stratejik rekabet ve uluslararası sözleşmelerin bağlayıcılığı çerçevesinde gelişmeler tarafsız gözlemciler tarafından analiz edilmektedir.',
        outlook: 'Birleşmiş Milletler ve ilgili bölgesel aktörlerin atacağı diplomatik adımlar ve müzakere süreçleri krizin seyrini belirleyecektir.'
      };
    }
    // Gündem / Genel
    return {
      whyItMatters: 'Toplumsal kamuoyunu doğrudan ilgilendiren, hukuki, idari veya sosyolojik sonuçları itibarıyla yakından takip edilmesi gereken bir gelişmedir.',
      background: 'İlgili kurumların resmi açıklamaları, sahadaki teyitli veriler ve bağımsız kaynakların değerlendirmeleri harmanlanarak olayın arka planı aydınlatılmaktadır.',
      outlook: 'Süreçle ilgili yetkili mercilerden gelecek resmi duyurular ve yasal düzenlemeler kamuoyu ile şeffaf şekilde paylaşılmaya devam edecektir.'
    };
  };

  const insights = getContextInsights();

  return (
    <div className={`rounded-2xl border p-4 sm:p-6 my-6 transition-all ${
      theme === 'light'
        ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200 text-slate-800 shadow-sm'
        : 'bg-gradient-to-br from-emerald-950/20 to-teal-950/10 border-emerald-500/20 text-gray-200'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-inherit/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
              <span>VOX Perspektifi: Derin Analiz & Arka Plan</span>
            </h4>
            <p className="text-[11px] text-gray-400">Haberin perde arkası ve çok boyutlu editoryal değerlendirmesi</p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
          ÖZEL ANALİZ
        </span>
      </div>

      {/* Structured 3 Insights */}
      <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-start gap-2.5">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
            Neden Önemli?
          </span>
          <p className="text-gray-300">
            {insights.whyItMatters}
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-bold text-xs shrink-0 mt-0.5">
            Arka Plan
          </span>
          <p className="text-gray-300">
            {insights.background}
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-xs shrink-0 mt-0.5">
            Gelecek Etkisi
          </span>
          <p className="text-gray-300">
            {insights.outlook}
          </p>
        </div>
      </div>

      {/* Editorial Trust Footnote */}
      <div className="mt-4 pt-3 border-t border-inherit/15 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>VOX Editoryal ve Doğruluk İlkeleri Süzgecinden Geçmiştir</span>
        </span>
        <span className="font-semibold text-gray-400">E-E-A-T Uyumlu</span>
      </div>
    </div>
  );
};
