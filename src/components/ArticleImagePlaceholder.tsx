import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { getTopicContextualImage, DEFAULT_VOX_FALLBACK_IMAGE, sanitizeImageUrl } from '../lib/newsService';

export interface ArticleImagePlaceholderProps {
  src: string;
  alt: string;
  category?: string;
  title?: string;
  author?: string;
  className?: string;
  aspectRatioClass?: string;
}

// Fast string hash generator to yield consistent, bespoke hue nuances
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Map categories to sophisticated base color tones
interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

function deriveContextualPalette(category: string = '', title: string = ''): Palette {
  const c = category.toLowerCase();
  const hash = hashString(title + category);
  const hueShift = (hash % 40) - 20; // -20 to +20 degree variance

  if (c.includes('ekonomi') || c.includes('finans') || c.includes('para') || c.includes('piyasa')) {
    const baseHue = 160 + hueShift;
    return {
      primary: `hsl(${baseHue}, 58%, 20%)`,
      secondary: `hsl(${baseHue + 25}, 65%, 12%)`,
      accent: `hsl(${baseHue}, 75%, 45%)`
    };
  }

  if (c.includes('teknoloji') || c.includes('bilim') || c.includes('yapay') || c.includes('dijital')) {
    const baseHue = 230 + hueShift;
    return {
      primary: `hsl(${baseHue}, 60%, 22%)`,
      secondary: `hsl(${baseHue + 30}, 70%, 12%)`,
      accent: `hsl(${baseHue}, 80%, 60%)`
    };
  }

  if (c.includes('spor') || c.includes('futbol') || c.includes('basket')) {
    const baseHue = 28 + hueShift;
    return {
      primary: `hsl(${baseHue}, 75%, 22%)`,
      secondary: `hsl(${baseHue - 15}, 80%, 13%)`,
      accent: `hsl(${baseHue}, 85%, 52%)`
    };
  }

  if (c.includes('dünya') || c.includes('dış haber') || c.includes('diplomasi')) {
    const baseHue = 210 + hueShift;
    return {
      primary: `hsl(${baseHue}, 65%, 20%)`,
      secondary: `hsl(${baseHue + 20}, 75%, 10%)`,
      accent: `hsl(${baseHue}, 80%, 55%)`
    };
  }

  if (c.includes('kültür') || c.includes('sanat') || c.includes('sinema') || c.includes('edebiyat')) {
    const baseHue = 280 + hueShift;
    return {
      primary: `hsl(${baseHue}, 55%, 22%)`,
      secondary: `hsl(${baseHue + 35}, 65%, 12%)`,
      accent: `hsl(${baseHue}, 75%, 58%)`
    };
  }

  if (c.includes('sağlık') || c.includes('yaşam') || c.includes('çevre')) {
    const baseHue = 175 + hueShift;
    return {
      primary: `hsl(${baseHue}, 55%, 19%)`,
      secondary: `hsl(${baseHue + 20}, 65%, 11%)`,
      accent: `hsl(${baseHue}, 70%, 48%)`
    };
  }

  if (c.includes('otomobil') || c.includes('araba') || c.includes('motor')) {
    const baseHue = 345 + hueShift;
    return {
      primary: `hsl(${baseHue}, 60%, 20%)`,
      secondary: `hsl(${baseHue - 25}, 65%, 11%)`,
      accent: `hsl(${baseHue}, 75%, 50%)`
    };
  }

  // Default / Gündem / Türkiye: Deep refined crimson-slate
  const defaultHue = 355 + hueShift;
  return {
    primary: `hsl(${defaultHue}, 62%, 22%)`,
    secondary: `hsl(${defaultHue + 30}, 65%, 12%)`,
    accent: `hsl(${defaultHue}, 75%, 52%)`
  };
}

export const ArticleImagePlaceholder: React.FC<ArticleImagePlaceholderProps> = ({
  src,
  alt,
  category = 'Gündem',
  title = '',
  author = '',
  className = '',
  aspectRatioClass = 'aspect-video'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<Palette | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronous contextual palette derived instantly from category and title
  const contextualPalette = useMemo(() => {
    return deriveContextualPalette(category, title);
  }, [category, title]);

  const activePalette = extractedPalette || contextualPalette;

  // Normalized image source
  const initialImg = useMemo(() => {
    const sanitized = sanitizeImageUrl(src);
    return sanitized || getTopicContextualImage(title, category) || DEFAULT_VOX_FALLBACK_IMAGE;
  }, [src, title, category]);

  const [currentSrc, setCurrentSrc] = useState(initialImg);

  // Reset states when source changes
  useEffect(() => {
    const sanitized = sanitizeImageUrl(src);
    const newSrc = sanitized || getTopicContextualImage(title, category) || DEFAULT_VOX_FALLBACK_IMAGE;
    setCurrentSrc(newSrc);
    setIsLoaded(false);
    setHasError(false);
    setExtractedPalette(null);
  }, [src, title, category]);

  // Attempt client-side dominant color extraction from the image using an offscreen canvas
  useEffect(() => {
    if (!currentSrc || typeof window === 'undefined') return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentSrc;

    img.onload = () => {
      if (!isMounted) return;
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 16, 16);
        const imgData = ctx.getImageData(0, 0, 16, 16).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Filter out near-pure-black and near-pure-white pixels
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness > 240 || brightness < 15) continue;

          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }

        if (count > 0 && isMounted) {
          const avgR = Math.round(rSum / count);
          const avgG = Math.round(gSum / count);
          const avgB = Math.round(bSum / count);

          // Deepen tones for a rich, aesthetic backdrop
          const darkR = Math.round(avgR * 0.45);
          const darkG = Math.round(avgG * 0.45);
          const darkB = Math.round(avgB * 0.45);

          const brightR = Math.min(255, Math.round(avgR * 1.3));
          const brightG = Math.min(255, Math.round(avgG * 1.3));
          const brightB = Math.min(255, Math.round(avgB * 1.3));

          setExtractedPalette({
            primary: `rgb(${avgR}, ${avgG}, ${avgB})`,
            secondary: `rgb(${darkR}, ${darkG}, ${darkB})`,
            accent: `rgb(${brightR}, ${brightG}, ${brightB})`
          });
        }
      } catch {
        // Cross-origin restriction (CORS) fallback gracefully keeps contextualPalette
      }
    };

    return () => {
      isMounted = false;
    };
  }, [currentSrc]);

  const handleImageError = () => {
    const fallback = getTopicContextualImage(title, category) || DEFAULT_VOX_FALLBACK_IMAGE;
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div
      className={`relative w-full ${aspectRatioClass} rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg select-none ${className}`}
      style={{
        background: `linear-gradient(145deg, ${activePalette.primary} 0%, ${activePalette.secondary} 100%)`
      }}
    >
      {/* Dynamic Color Placeholder / Shimmer Canvas */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none flex flex-col items-center justify-center p-6 ${
          isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: `radial-gradient(circle at 50% 40%, ${activePalette.primary} 0%, ${activePalette.secondary} 85%)`
        }}
      >
        {/* Soft Animated Shimmer Wave */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />

        {/* Ambient Center Glow */}
        <div
          className="w-28 h-28 rounded-full blur-2xl opacity-40 absolute pointer-events-none transition-transform duration-1000 scale-110"
          style={{ backgroundColor: activePalette.accent }}
        />

        {/* Central Frosted Glass Placeholder Badge */}
        <div className="relative z-10 flex flex-col items-center gap-2.5 px-4 py-3 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 shadow-xl text-center max-w-[85%]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner"
            style={{ backgroundColor: activePalette.accent }}
          >
            <ImageIcon className="w-5 h-5 drop-shadow-sm animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 block">
              {category || 'Haber Görseli'}
            </span>
            <span className="text-[10px] text-white/70 block line-clamp-1 max-w-[220px]">
              {author || 'VOX Akıllı Haber'}
            </span>
          </div>
        </div>
      </div>

      {/* Actual Article Image */}
      {!hasError && (
        <img
          src={currentSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Publisher Watermark Chip */}
      <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md">
        {author || 'VOX Akıllı Haber'}
      </div>
    </div>
  );
};
