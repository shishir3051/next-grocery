'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Truck, Leaf, Tag, Zap } from 'lucide-react';
import Link from 'next/link';

const SLIDES = [
  {
    id: 1,
    badge: { icon: '🌿', text: 'Fresh & Organic' },
    title: 'Groceries at your door,',
    highlight: 'fresh every day',
    subtitle: 'From crisp vegetables to premium meats — delivered in under 60 minutes across Dhaka.',
    cta: { label: 'Shop Now', action: 'all' },
    features: ['60-min delivery', 'Farm fresh', 'Free over ৳500'],
    gradient: 'from-teal-600 via-emerald-600 to-teal-800',
    accentColor: 'text-emerald-300',
    decorColor: 'bg-emerald-400/20',
    emoji: '🥦',
    tag: 'FREE DELIVERY OVER ৳500',
    tagColor: 'bg-emerald-500/30 text-emerald-100',
  },
  {
    id: 2,
    badge: { icon: '🔥', text: 'Hot Deals Today' },
    title: 'Up to 30% off on',
    highlight: 'fresh fruits & dairy',
    subtitle: 'Limited-time offers on your favourite daily essentials. Order now before stock runs out.',
    cta: { label: 'See Deals', action: 'fresh-fruits' },
    features: ['Limited time', 'Best prices', 'Top quality'],
    gradient: 'from-orange-500 via-amber-500 to-orange-700',
    accentColor: 'text-amber-200',
    decorColor: 'bg-amber-300/20',
    emoji: '🍓',
    tag: 'TODAY ONLY',
    tagColor: 'bg-orange-400/30 text-orange-100',
  },
  {
    id: 3,
    badge: { icon: '☪', text: 'Halal Certified' },
    title: 'Premium quality',
    highlight: 'meat & poultry',
    subtitle: 'Freshly sourced halal-certified chicken, beef and fish — delivered chilled to your door.',
    cta: { label: 'Order Meat', action: 'meat-fish' },
    features: ['Halal certified', 'Chilled delivery', 'Farm sourced'],
    gradient: 'from-rose-600 via-red-600 to-rose-800',
    accentColor: 'text-rose-200',
    decorColor: 'bg-rose-300/20',
    emoji: '🍗',
    tag: 'PREMIUM QUALITY',
    tagColor: 'bg-rose-400/30 text-rose-100',
  },
  {
    id: 4,
    badge: { icon: '🥛', text: 'Dairy & Eggs' },
    title: 'Start your morning',
    highlight: 'the fresh way',
    subtitle: 'Farm-fresh milk, eggs, cheese and yoghurt — everything you need for a perfect start.',
    cta: { label: 'Shop Dairy', action: 'dairy-eggs' },
    features: ['Farm fresh', 'Daily restocked', 'Best brands'],
    gradient: 'from-sky-500 via-blue-500 to-sky-700',
    accentColor: 'text-sky-200',
    decorColor: 'bg-sky-300/20',
    emoji: '🥚',
    tag: 'NEW ARRIVALS',
    tagColor: 'bg-sky-400/30 text-sky-100',
  },
];

interface HeroBannerProps {
  onSelectCategory?: (slug: string) => void;
}

export default function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 'next');
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, 'prev');
  }, [current, goTo]);

  // Auto-play every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 select-none w-full h-[320px] md:h-[380px]">
      {/* Slide background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-colors duration-700`}
      />

      {/* Decorative circles */}
      <div className={`absolute top-0 right-0 w-72 h-72 ${slide.decorColor} rounded-full -translate-y-1/3 translate-x-1/4 transition-all duration-700`} />
      <div className={`absolute bottom-0 left-1/3 w-48 h-48 ${slide.decorColor} rounded-full translate-y-1/2 transition-all duration-700`} />
      <div className={`absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 transition-all duration-700`} />

      {/* Big decorative emoji */}
      <div
        className="absolute right-12 top-1/2 -translate-y-1/2 text-[120px] md:text-[160px] leading-none opacity-20 select-none transition-all duration-700 hidden md:block"
        aria-hidden
      >
        {slide.emoji}
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-center">
        {SLIDES.map((s, index) => {
          const isActive = index === current;
          return (
            <div
              key={s.id}
              className={`absolute transition-all duration-500 ease-in-out w-full max-w-xl ${
                isActive
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 -translate-x-8 pointer-events-none'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${s.tagColor} backdrop-blur-sm w-fit`}>
                  <span>{s.badge.icon}</span>
                  {s.badge.text}
                </span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${s.tagColor} uppercase tracking-widest`}>
                  {s.tag}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-white">
                {s.title}{' '}
                <span className={s.accentColor}>{s.highlight}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-white/90 leading-relaxed mb-6 max-w-sm">
                {s.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectCategory && onSelectCategory(s.cta.action)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-800 font-black rounded-xl text-sm hover:bg-white/90 transition-all shadow-xl shadow-black/20 hover:scale-105"
                >
                  {s.cta.label}
                  <ArrowRight size={15} />
                </button>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl text-xs border border-white/25 hover:bg-white/25 transition-all cursor-pointer">
                  <Truck size={13} />
                  Free delivery over ৳500
                </div>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 mt-5 hidden sm:flex">
                {s.features.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1 text-[10px] font-bold text-white/90 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm"
                  >
                    <Zap size={9} className="text-yellow-300" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Left Arrow */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 border border-white/30"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 border border-white/30"
      >
        <ChevronRight size={18} />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-6 h-2.5 bg-white shadow-lg'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 z-20 text-xs font-bold text-white/60 tabular-nums">
        {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
      </div>
    </section>
  );
}
