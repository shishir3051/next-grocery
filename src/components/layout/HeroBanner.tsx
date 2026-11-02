'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Pause,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';

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

interface HeroBannerProps {
  onSelectCategory?: (slug: string) => void;
}

const AUTOPLAY_MS = 6000;

// Round, translucent control used for prev / next / pause on top of the banner.
const CONTROL_BUTTON =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white backdrop-blur-md transition-colors hover:bg-black/30';

export default function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isLoading, setIsLoading] = useState(true);
  // Autoplay pauses while the pointer/keyboard focus is inside the banner,
  // when the user presses pause, and never runs for reduced-motion users.
  const [isHovered, setIsHovered] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const isAutoplaying = !isHovered && !isUserPaused && !reduceMotion;

  const fetchHeroData = useCallback(async () => {
    try {
      // Parallel fetch for Hero Slides and Public Coupons
      const [heroRes, couponRes] = await Promise.all([
        fetch("/api/public/hero"),
        fetch("/api/public/coupons")
      ]);

      const heroData = await heroRes.json();
      const couponData = await couponRes.json();

      const finalSlides: HeroSlide[] = heroData.success ? [...heroData.slides] : [];

      // If coupons exist, inject a "Bonus Coupon Slide"
      if (couponData.success && couponData.coupons.length > 0) {
        const topCoupon = couponData.coupons[0];
        const couponSlide: HeroSlide = {
          _id: 'coupon-special-slide',
          title: "Extra savings for",
          highlight: "your first order",
          subtitle: `Get ${topCoupon.discountType === 'percentage' ? topCoupon.discountValue + '%' : '৳' + topCoupon.discountValue} off with code ${topCoupon.code}`,
          ctaLabel: "Copy code",
          ctaLink: topCoupon.code,
          image: "",
          // Brand colours (teal) with an accent highlight, like the rest of the store
          gradient: "from-brand-600 via-brand-700 to-brand-900",
          accentColor: "text-accent-300",
          decorColor: "bg-white/10",
          emoji: "🎁",
          tag: "Special offer",
          tagColor: "bg-white/15 text-white",
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

  // Auto-play (paused on hover/focus, by the pause button, or reduced motion)
  useEffect(() => {
    if (slides.length <= 1 || !isAutoplaying) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next, slides.length, isAutoplaying]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied`);
  };

  if (isLoading) {
    return (
      <div
        className="mb-8 h-[340px] w-full animate-pulse rounded-2xl bg-slate-200/70 md:h-[380px]"
        aria-busy="true"
        aria-label="Loading offers"
      />
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];
  const slideOffset = reduceMotion ? 0 : 40;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsHovered(false);
      }}
      className="relative mb-8 w-full select-none overflow-hidden rounded-2xl shadow-sm"
    >
      {/* Background Layer */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-colors duration-700`}>
        {slide.image && (
          <Image
            src={slide.image}
            alt=""
            fill
            className="object-cover opacity-40 mix-blend-overlay transition-opacity duration-700"
            priority
          />
        )}
      </div>

      {/* Decorative shapes */}
      <div aria-hidden="true" className={`absolute right-0 top-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rounded-full ${slide.decorColor} transition-all duration-700`} />
      <div aria-hidden="true" className={`absolute bottom-0 left-1/3 h-48 w-48 translate-y-1/2 rounded-full ${slide.decorColor} transition-all duration-700`} />

      {!slide.image && (
        <div className="pointer-events-none absolute right-12 top-1/2 hidden -translate-y-1/2 select-none text-[200px] leading-none opacity-20 xl:block" aria-hidden="true">
          {slide.emoji}
        </div>
      )}

      {/* Main content. The bottom padding always reserves a band for the controls
          row, and min-height (not a fixed height) lets long copy grow instead of
          being clipped or sliding under the controls on narrow tablet widths. */}
      <div
        className={cn(
          'relative z-10 flex min-h-[340px] flex-col justify-center px-6 pt-8 md:min-h-[380px] md:px-12 md:pt-12',
          slides.length > 1 ? 'pb-20' : 'pb-8 md:pb-12'
        )}
        aria-live={isAutoplaying ? 'off' : 'polite'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide._id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${current + 1} of ${slides.length}`}
            initial={{ opacity: 0, x: direction === 'next' ? slideOffset : -slideOffset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'next' ? -slideOffset : slideOffset }}
            transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            {/* Tag */}
            {(slide.tag || slide.emoji) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {slide.emoji && (
                  <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-lg backdrop-blur-md ${slide.tagColor}`}>
                    {slide.emoji}
                  </span>
                )}
                {slide.tag && (
                  <span className={`rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-md ${slide.tagColor}`}>
                    {slide.tag}
                  </span>
                )}
              </div>
            )}

            {/* Display heading: font-black is reserved for hero display text */}
            <h1 className="mb-3 text-3xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm md:text-4xl xl:text-5xl">
              {slide.title}{' '}
              <span className={slide.accentColor}>{slide.highlight}</span>
            </h1>

            <p className="mb-6 max-w-md text-base font-medium leading-relaxed text-white/90 md:mb-8 md:text-lg">
              {slide.subtitle}
            </p>

            {/* Call to Action */}
            <div className="flex flex-wrap items-center gap-3">
              {slide.type === 'coupon' ? (
                <button
                  type="button"
                  onClick={() => handleCopy(slide.ctaLink)}
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
                >
                  <Copy size={18} aria-hidden="true" />
                  {slide.ctaLabel}: <span className="font-bold tracking-wide">{slide.ctaLink}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (slide.ctaLink.startsWith('http')) {
                      window.open(slide.ctaLink, '_blank');
                    } else if (onSelectCategory) {
                      onSelectCategory(slide.ctaLink);
                    }
                  }}
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {slide.ctaLabel}
                  <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </button>
              )}

              <span className="hidden h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-md sm:inline-flex">
                <CheckCircle2 size={16} className="text-success-100" aria-hidden="true" />
                Verified active deals
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls: one row (dots + pause + prev/next). Full-width row on mobile,
          bottom-right cluster on desktop, so nothing overlaps the CTA. */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between gap-3 md:bottom-6 md:left-auto md:right-6 md:justify-end">
          <div className="flex items-center">
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                aria-current={i === current ? 'true' : undefined}
                // 40px-tall hit area around a small visual dot
                className="flex h-10 items-center justify-center px-1.5"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'block h-2 rounded-full transition-all duration-300',
                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setIsUserPaused(p => !p)}
                aria-label={isUserPaused ? 'Play slideshow' : 'Pause slideshow'}
                aria-pressed={isUserPaused}
                className={CONTROL_BUTTON}
              >
                {isUserPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
              </button>
            )}
            <button type="button" onClick={prev} aria-label="Previous slide" className={CONTROL_BUTTON}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" onClick={next} aria-label="Next slide" className={CONTROL_BUTTON}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {slides.length > 1 && (
        <p className="absolute right-6 top-6 z-20 hidden text-xs font-semibold tabular-nums tracking-wider text-white/80 md:block" aria-hidden="true">
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </p>
      )}
    </section>
  );
}
