'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Zap, 
  Loader2, 
  Image as ImageIcon,
  Tag,
  Copy,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface HeroSlide {
  _id: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  gradient: string;
  accentColor: string;
  decorColor: string;
  emoji: string;
  tag: string;
  tagColor: string;
  isActive: boolean;
  order: number;
  type?: 'coupon'; // Added to distinguish special slides
}

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
}

interface HeroBannerProps {
  onSelectCategory?: (slug: string) => void;
}

export default function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHeroData = useCallback(async () => {
    try {
      // Parallel fetch for Hero Slides and Public Coupons
      const [heroRes, couponRes] = await Promise.all([
        fetch("/api/public/hero"),
        fetch("/api/public/coupons")
      ]);

      const heroData = await heroRes.json();
      const couponData = await couponRes.json();

      let finalSlides = heroData.success ? [...heroData.slides] : [];

      // If coupons exist, inject a "Bonus Coupon Slide"
      if (couponData.success && couponData.coupons.length > 0) {
        const topCoupon = couponData.coupons[0];
        const couponSlide: HeroSlide = {
          _id: 'coupon-special-slide',
          title: "Extra Savings For",
          highlight: "Your First Order",
          subtitle: `Get ${topCoupon.discountType === 'percentage' ? topCoupon.discountValue + '%' : '৳' + topCoupon.discountValue} OFF using code: ${topCoupon.code}`,
          ctaLabel: "Copy Code",
          ctaLink: topCoupon.code,
          image: "",
          gradient: "from-violet-600 via-purple-600 to-indigo-800",
          accentColor: "text-violet-200",
          decorColor: "bg-violet-400/20",
          emoji: "🎁",
          tag: "SPECIAL OFFER",
          tagColor: "bg-violet-500/30 text-violet-100",
          isActive: true,
          order: -1, // Make it appear near the front
          type: 'coupon'
        };
        finalSlides.unshift(couponSlide);
      }

      if (finalSlides.length > 0) {
        setSlides(finalSlides);
      }
    } catch (e) {
      console.error("Hero data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, slides.length]);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length, 'next');
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current - 1 + slides.length) % slides.length, 'prev');
  }, [current, goTo, slides.length]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`, {
      icon: '🔥',
      style: { borderRadius: '1rem', background: '#333', color: '#fff' }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-[320px] md:h-[380px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center mb-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 select-none w-full h-[320px] md:h-[380px] shadow-sm">
      {/* Background Layer */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-colors duration-700`}>
        {slide.image && (
          <Image 
            src={slide.image} 
            alt={slide.title} 
            fill 
            className="object-cover mix-blend-overlay opacity-40 transition-opacity duration-700" 
            priority
          />
        )}
      </div>

      {/* Decorative Assets */}
      <div className={`absolute top-0 right-0 w-72 h-72 ${slide.decorColor} rounded-full -translate-y-1/3 translate-x-1/4 transition-all duration-700`} />
      <div className={`absolute bottom-0 left-1/3 w-48 h-48 ${slide.decorColor} rounded-full translate-y-1/2 transition-all duration-700`} />
      
      {!slide.image && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 text-[140px] md:text-[200px] leading-none opacity-20 transition-all duration-700 hidden md:block select-none" aria-hidden>
          {slide.emoji}
        </div>
      )}

      {/* Main Content Area */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0, x: direction === 'next' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'next' ? -40 : 40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            {/* Badge System */}
            {(slide.tag || slide.emoji) && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {slide.emoji && (
                  <span className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl ${slide.tagColor} backdrop-blur-md shadow-lg border border-white/10`}>
                    {slide.emoji}
                  </span>
                )}
                {slide.tag && (
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg ${slide.tagColor} uppercase tracking-[0.15em] backdrop-blur-md border border-white/10`}>
                    {slide.tag}
                  </span>
                )}
              </div>
            )}

            {/* Typography */}
            <h1 className="text-3xl md:text-5xl font-black leading-[1.1] mb-4 text-white drop-shadow-sm">
              {slide.title}{' '}
              <span className={slide.accentColor}>{slide.highlight}</span>
            </h1>

            <p className="text-sm md:text-lg text-white/90 leading-relaxed mb-8 max-w-md font-medium">
              {slide.subtitle}
            </p>

            {/* Call to Action */}
            <div className="flex flex-wrap gap-4 items-center">
              {slide.type === 'coupon' ? (
                <button
                  onClick={() => handleCopy(slide.ctaLink)}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-violet-700 font-black rounded-2xl text-base hover:bg-violet-50 transition-all shadow-2xl shadow-indigo-900/40 hover:scale-[1.03] active:scale-95 group"
                >
                  <Copy size={18} className="group-hover:rotate-12 transition-transform" />
                  {slide.ctaLabel}: {slide.ctaLink}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (slide.ctaLink.startsWith('http')) {
                      window.open(slide.ctaLink, '_blank');
                    } else if (onSelectCategory) {
                      onSelectCategory(slide.ctaLink);
                    }
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-slate-800 font-black rounded-2xl text-base hover:bg-slate-50 transition-all shadow-2xl shadow-black/20 hover:scale-[1.03] active:scale-95 group"
                >
                  {slide.ctaLabel}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              <div className="hidden sm:flex items-center gap-2 px-5 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl text-xs border border-white/20">
                <CheckCircle2 size={16} className="text-emerald-300" />
                Verified Active Deals
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <div className="absolute right-6 bottom-6 z-20 flex gap-2">
            <button
              onClick={prev}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/20 group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={next}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/20 group"
            >
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s._id}
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                className={`transition-all duration-500 rounded-full ${
                  i === current
                    ? 'w-10 h-2 bg-white shadow-lg'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-8 right-8 z-20 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] tabular-nums">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>
        </>
      )}
    </section>
  );
}
