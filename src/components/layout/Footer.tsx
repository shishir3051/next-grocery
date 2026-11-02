import Link from "next/link";
import { PhoneCall, Mail, Smartphone, ShieldCheck } from "lucide-react";
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
} from "@tabler/icons-react";

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const footerLinkGroups = [
  {
    title: "Information",
    links: [
      { name: "About FreshBasket", href: "/about" },
      { name: "Store locations", href: "/locations" },
      { name: "Latest news", href: "/news" },
    ],
  },
  {
    title: "Customer service",
    links: [
      { name: "Contact us", href: "/contact" },
      { name: "FAQ", href: "/faq" },
      { name: "Shipping & returns", href: "/shipping-policy" },
      { name: "Terms & conditions", href: "/terms" },
      { name: "Privacy policy", href: "/privacy" },
    ],
  },
  {
    title: "My account",
    links: [
      { name: "My profile", href: "/profile" },
      { name: "Order history", href: "/orders" },
      { name: "My wishlist", href: "/wishlist" },
    ],
  },
];

const paymentMethods = ["bKash", "Nagad", "Visa", "Mastercard"];

const socialLinks = [
  { label: "Facebook", Icon: IconBrandFacebook },
  { label: "Twitter", Icon: IconBrandTwitter },
  { label: "Instagram", Icon: IconBrandInstagram },
  { label: "YouTube", Icon: IconBrandYoutube },
];

/* Shared style for the small column headings */
const headingClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface FooterProps {
  showSidebarOffset?: boolean;
}

/* ─────────────────────────────────────────────
   Footer
   Content is always visible: there is no scroll-reveal animation,
   so the footer never renders blank (screenshots, slow devices, reduced motion).
───────────────────────────────────────────── */
export default function Footer({ showSidebarOffset }: FooterProps) {
  return (
    <footer
      className={`border-t border-slate-200 bg-slate-50 pt-12 pb-8 transition-[margin] duration-300 sm:pt-16 ${
        showSidebarOffset ? "md:ml-[var(--sidebar-width)]" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand & contact */}
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="flex w-fit items-center gap-2 rounded-xl" aria-label="FreshBasket home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-xl font-black text-white">
                F
              </span>
              <span className="text-xl font-black tracking-tight text-slate-900">FreshBasket</span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-600">
              Always here for you. Fresh groceries delivered to your doorstep with care.
            </p>

            <div className="space-y-3">
              <a href="tel:16469" className="group flex items-center gap-3 rounded-xl text-slate-800 hover:text-brand-700">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-brand-200">
                  <PhoneCall size={18} className="text-brand-600" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs text-slate-500">Hotline</span>
                  <span className="block text-base font-bold">16469</span>
                </span>
              </a>

              <a href="mailto:support@freshbasket.com" className="group flex items-center gap-3 rounded-xl text-slate-800 hover:text-brand-700">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-brand-200">
                  <Mail size={18} className="text-brand-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-slate-500">Email</span>
                  <span className="block truncate text-sm font-semibold">support@freshbasket.com</span>
                </span>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerLinkGroups.map(group => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className={headingClass}>{group.title}</h2>
              <ul className="mt-3">
                {group.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center rounded-lg text-sm text-slate-600 transition-colors hover:text-brand-700"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Payment / social / app */}
          <div className="space-y-8">
            <div>
              <h2 className={headingClass}>Pay with</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {paymentMethods.map(method => (
                  <li
                    key={method}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {method}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className={headingClass}>Follow us</h2>
              <div className="mt-4 flex items-center gap-2">
                {socialLinks.map(({ label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`FreshBasket on ${label}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-700"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className={headingClass}>Download the app</h2>
              <button
                type="button"
                className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
              >
                <Smartphone size={20} aria-hidden="true" />
                <span className="text-left leading-tight">
                  <span className="block text-xs text-slate-300">Get it on</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-center md:flex-row md:text-left">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} <span className="font-medium text-slate-700">FreshBasket Ltd.</span> All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-brand-600" aria-hidden="true" />
            100% secure shopping
          </p>
        </div>
      </div>
    </footer>
  );
}
