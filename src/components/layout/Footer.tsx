"use client";

import Link from "next/link";
import {
  PhoneCall,
  Mail,
  Smartphone,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const footerLinks = {
  company: [
    { name: "About FreshBasket", href: "/about" },
    { name: "Store Locations", href: "/locations" },
    { name: "Latest News", href: "/news" },
  ],
  customerService: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Shipping & Returns", href: "/shipping-policy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
  myAccount: [
    { name: "My Profile", href: "/profile" },
    { name: "Order History", href: "/orders" },
    { name: "My Wishlist", href: "/wishlist" },
  ],
};

/* ─────────────────────────────────────────────
   Hook — bidirectional scroll reveal
   Tracks scroll direction so elements animate
   FROM below when scrolling down and
   FROM above when scrolling back up.
───────────────────────────────────────────── */
type RevealState = "hidden-below" | "visible" | "hidden-above";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("hidden-below");
  const prevScrollY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY >= prevScrollY.current;
        prevScrollY.current = currentScrollY;

        if (entry.isIntersecting) {
          setState("visible");
        } else {
          setState(scrollingDown ? "hidden-above" : "hidden-below");
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, state };
}

/* ─────────────────────────────────────────────
   Reveal wrapper component
───────────────────────────────────────────── */
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const { ref, state } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`fb-reveal ${state} ${className}`}
      style={{ transitionDelay: state === "visible" ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface FooterProps {
  showSidebarOffset?: boolean;
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */
export default function Footer({ showSidebarOffset }: FooterProps) {
  return (
    <footer
      className={`bg-slate-50 pt-20 pb-10 border-t border-slate-200 transition-all duration-300 ${
        showSidebarOffset ? "md:ml-[var(--sidebar-width)]" : ""
      }`}
    >
      <style>{`
        /* ── Bidirectional scroll reveal ── */
        .fb-reveal {
          transition:
            opacity  0.6s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .fb-reveal.hidden-below {
          opacity: 0;
          transform: translateY(40px);
        }
        .fb-reveal.hidden-above {
          opacity: 0;
          transform: translateY(-40px);
        }
        .fb-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Per-link stagger reveal (slide from left) ── */
        .fb-link-item {
          transition:
            opacity  0.4s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .fb-link-item.hidden-below {
          opacity: 0;
          transform: translateX(0) translateY(16px);
        }
        .fb-link-item.hidden-above {
          opacity: 0;
          transform: translateX(0) translateY(-16px);
        }
        .fb-link-item.visible {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }

        /* ── Social icon hover ── */
        .fb-social-btn {
          transition:
            color        0.2s ease,
            border-color 0.2s ease,
            transform    0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow   0.22s ease;
        }
        .fb-social-btn:hover {
          transform: translateY(-4px) scale(1.1);
          box-shadow: 0 8px 22px rgba(13,148,136,0.22);
        }

        /* ── Payment badge hover ── */
        .fb-pay-badge {
          transition:
            transform  0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.22s ease;
          cursor: default;
        }
        .fb-pay-badge:hover {
          transform: translateY(-3px) scale(1.07);
          box-shadow: 0 5px 16px rgba(0,0,0,0.10);
        }

        /* ── App button hover ── */
        .fb-app-btn {
          transition:
            transform        0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            background-color 0.2s ease,
            box-shadow       0.22s ease;
        }
        .fb-app-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.20);
        }

        /* ── Contact icon hover ── */
        .fb-contact-icon {
          transition:
            transform  0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.22s ease;
        }
        .fb-contact-link:hover .fb-contact-icon {
          transform: scale(1.14);
          box-shadow: 0 5px 14px rgba(13,148,136,0.22);
        }

        /* ── Logo hover ── */
        .fb-logo {
          transition:
            opacity   0.2s ease,
            transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fb-logo:hover {
          opacity: 0.85;
          transform: scale(1.03);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

          {/* Col 1 — Brand & Contact */}
          <Reveal delay={0} className="space-y-6 lg:col-span-1">
            <Link href="/" className="fb-logo flex items-center gap-2 w-fit">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-black">F</span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight">FreshBasket</span>
            </Link>

            <p className="text-sm text-slate-500 font-bold leading-relaxed">
              "Always Here for You" — Delivering fresh groceries to your doorstep with love and care.
            </p>

            <div className="space-y-3 pt-2">
              <a href="tel:16469" className="fb-contact-link flex items-center gap-3 text-slate-700 hover:text-teal-600 transition-colors">
                <div className="fb-contact-icon w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <PhoneCall size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Hotline</p>
                  <p className="text-lg font-black tracking-tight">16469</p>
                </div>
              </a>

              <a href="mailto:support@freshbasket.com" className="fb-contact-link flex items-center gap-3 text-slate-700 hover:text-teal-600 transition-colors">
                <div className="fb-contact-icon w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Mail size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                  <p className="text-sm font-bold truncate">support@freshbasket.com</p>
                </div>
              </a>
            </div>
          </Reveal>

          {/* Col 2 — Information */}
          <Reveal delay={80}>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Information</h4>
            <AnimatedLinkList links={footerLinks.company} />
          </Reveal>

          {/* Col 3 — Customer Service */}
          <Reveal delay={160}>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Customer Service</h4>
            <AnimatedLinkList links={footerLinks.customerService} />
          </Reveal>

          {/* Col 4 — My Account */}
          <Reveal delay={240}>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">My Account</h4>
            <AnimatedLinkList links={footerLinks.myAccount} />
          </Reveal>

          {/* Col 5 — Payment / Social / App */}
          <Reveal delay={320} className="space-y-10">
            {/* Pay With */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Pay With</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "bKash",      cls: "text-[#E2136E] italic" },
                  { label: "Nagad",      cls: "text-[#F7941D] italic" },
                  { label: "VISA",       cls: "text-blue-800" },
                  { label: "MasterCard", cls: "text-red-600" },
                ].map(({ label, cls }) => (
                  <div key={label} className="fb-pay-badge px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                    <span className={`text-[10px] font-black ${cls}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow Us */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Follow Us</h4>
              <div className="flex items-center gap-3">
                {[IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandYoutube].map((Icon, i) => (
                  <button key={i} className="fb-social-btn w-10 h-10 bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 rounded-xl flex items-center justify-center shadow-sm">
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* Download App */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Download App</h4>
              <div className="flex flex-col gap-2">
                <button className="fb-app-btn flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all">
                  <Smartphone size={20} />
                  <div className="text-left">
                    <p className="text-[8px] font-bold uppercase opacity-60 leading-none">Get it on</p>
                    <p className="text-xs font-black leading-none mt-1 uppercase tracking-wider">Play Store</p>
                  </div>
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Bottom Bar ── */}
        <Reveal delay={400}>
          <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-bold text-slate-400">
              Copyright © {new Date().getFullYear()}{" "}
              <span className="text-slate-600">FreshBasket Ltd.</span> All Rights Reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest italic">
                100% Secure Shopping Environment
              </span>
            </div>
          </div>
        </Reveal>

      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   AnimatedLinkList — each <li> has its own
   IntersectionObserver + bidirectional state
───────────────────────────────────────────── */
function AnimatedLinkList({ links }: { links: { name: string; href: string }[] }) {
  return (
    <ul className="space-y-4">
      {links.map((link, i) => (
        <AnimatedLinkItem key={link.name} link={link} index={i} />
      ))}
    </ul>
  );
}

function AnimatedLinkItem({
  link,
  index,
}: {
  link: { name: string; href: string };
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [state, setState] = useState<RevealState>("hidden-below");
  const prevScrollY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY >= prevScrollY.current;
        prevScrollY.current = currentScrollY;

        if (entry.isIntersecting) {
          setState("visible");
        } else {
          setState(scrollingDown ? "hidden-above" : "hidden-below");
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={`fb-link-item ${state}`}
      style={{ transitionDelay: state === "visible" ? `${index * 60}ms` : "0ms" }}
    >
      <Link
        href={link.href}
        className="text-sm font-bold text-slate-600 hover:text-teal-600 flex items-center gap-1 group transition-all"
      >
        <ChevronRight
          size={14}
          className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500"
        />
        {link.name}
      </Link>
    </li>
  );
}