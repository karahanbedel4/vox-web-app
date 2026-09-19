import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, Sparkles, Tv, BrainCircuit, Newspaper, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { 
  AI_KNOWLEDGE_BASE, 
  TARGET_KEYWORDS_GUNDEM, 
  TARGET_KEYWORDS_ODAKLAN, 
  TARGET_KEYWORDS_SPOR,
  SeoKnowledgeItem 
} from '../data/seoKeywordsData';

interface AiSeoKnowledgeSectionProps {
  pageContext?: 'gundem' | 'odaklan' | 'spor' | 'genel';
}

export const AiSeoKnowledgeSection: React.FC<AiSeoKnowledgeSectionProps> = ({
  pageContext = 'gundem'
}) => {
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Filter items or show all with priority to current context
  const sortedItems = [...AI_KNOWLEDGE_BASE].sort((a, b) => {
    if (a.category === pageContext) return -1;
    if (b.category === pageContext) return 1;
    return 0;
  });

  // Inject Schema.org FAQPage for search engines and AI bots
  useEffect(() => {
    const jsonLdId = 'vox-faq-ai-schema';
    let existing = document.getElementById(jsonLdId);
    if (!existing) {
      existing = document.createElement('script');
      existing.id = jsonLdId;
      existing.setAttribute('type', 'application/ld+json');
      document.head.appendChild(existing);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': AI_KNOWLEDGE_BASE.map(item => ({
        '@type': 'Question',
        'name': item.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `${item.shortAnswer} ${item.detailedAnswer}`
        }
      }))
    };

    existing.textContent = JSON.stringify(schemaData);

    return () => {
      const el = document.getElementById(jsonLdId);
      if (el) el.remove();
    };
  }, []);

  return (
    <section 
      id="bilgi-merkezi-ai-rehber"
      aria-labelledby="ai-knowledge-heading"
      className={`p-5 sm:p-7 rounded-2xl border transition-all my-6 ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
          : 'bg-[#12181f] border-white/10 text-gray-200 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google & Gemini AI Bilgi Merkezi</span>
          </div>
          <h2 id="ai-knowledge-heading" className="text-lg sm:text-xl font-black mt-1">
            {pageContext === 'odaklan' 
              ? 'Pomodoro Çalışması & Odaklanma Rehberi'
              : 'Gündem, Son Dakika Haber & Canlı Yayın Rehberi'}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
            theme === 'light' ? 'text-slate-600' : 'text-gray-400'
          }`}>
            Google, Gemini ve ChatGPT gibi yapay zeka arama sistemlerinin sorulara en hızlı ve teyitli yanıt vermesi için hazırlanan bilgi bankası:
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 whitespace-nowrap">
            Doğrulanmış İçerik
          </span>
        </div>
      </div>

      {/* Target Keywords Clouds */}
      <div className="pt-4 pb-2">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Öne Çıkan Gündem, Haber & Arama Terimleri:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TARGET_KEYWORDS_GUNDEM.map((kw, i) => (
            <Link
              key={`g-${i}`}
              to="/gundem"
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200'
                  : 'bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 text-zinc-300 border border-white/5'
              }`}
            >
              #{kw}
            </Link>
          ))}

          {TARGET_KEYWORDS_ODAKLAN.slice(0, 5).map((kw, i) => (
            <Link
              key={`o-${i}`}
              to="/odaklan"
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white hover:bg-purple-50 hover:text-purple-700 text-slate-700 border border-slate-200'
                  : 'bg-white/5 hover:bg-purple-500/10 hover:text-purple-400 text-zinc-300 border border-white/5'
              }`}
            >
              #{kw}
            </Link>
          ))}

          <Link
            to="/canli-tv"
            className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all flex items-center gap-1"
          >
            <Tv className="w-3 h-3" />
            <span>#tüm kanalları canlı izle</span>
          </Link>

          <Link
            to="/ayarlar"
            className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>#akıllı odaklanma (smart focus)</span>
          </Link>
        </div>
      </div>

      {/* FAQ & AI Structured Questions */}
      <div className="mt-4 divide-y divide-white/10">
        {sortedItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={item.id} className="py-3.5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base gap-3 cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="group-hover:text-emerald-500 transition-colors">
                    {item.question}
                  </span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-500' : 'text-gray-400'
                  }`} 
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2.5 pl-4 space-y-2">
                      <p className={`text-xs sm:text-sm leading-relaxed font-semibold ${
                        theme === 'light' ? 'text-emerald-800' : 'text-emerald-400'
                      }`}>
                        {item.shortAnswer}
                      </p>
                      <p className={`text-xs sm:text-sm leading-relaxed ${
                        theme === 'light' ? 'text-slate-600' : 'text-gray-300'
                      }`}>
                        {item.detailedAnswer}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <Link
                          to={item.canonicalUrl.replace('https://voxozet.com', '')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          <span>Sayfayı Ziyaret Et</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
