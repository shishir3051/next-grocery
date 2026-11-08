import { BadgeCheck, Gauge, ImageUp, KeyRound, PackageCheck, Receipt, ShieldCheck, UserCheck } from "lucide-react";
import { RevealItem } from "./Reveal";
import { Container, DarkBackdrop, SectionHeader } from "./primitives";

const TILES = [
  { icon: Gauge, tag: "Rate limits", text: "Login, sign-up, checkout and AI are rate limited across all servers." },
  { icon: UserCheck, tag: "Role checks", text: "Every admin and rider request re-checks the role in the database." },
  { icon: Receipt, tag: "Server pricing", text: "Prices and totals are rebuilt on the server, never trusted from the browser." },
  { icon: BadgeCheck, tag: "Verified payments", text: "Orders are marked paid only after SSLCommerz confirms the payment." },
  { icon: KeyRound, tag: "Hashed codes", text: "Verification and reset codes are random, hashed and single-use." },
  { icon: ShieldCheck, tag: "CSP headers", text: "Strict Content-Security-Policy, no framing, no MIME sniffing." },
  { icon: ImageUp, tag: "Safe uploads", text: "Validated image types and sizes; downloads from private networks are blocked." },
  { icon: PackageCheck, tag: "0 vulnerabilities", text: "Production dependencies pass npm audit." },
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-title"
      className="relative isolate overflow-hidden py-20 text-white lg:py-28"
    >
      <DarkBackdrop />
      <Container>
        <SectionHeader
          titleId="security-title"
          eyebrow="Security & control"
          title="Secure by default"
          intro="The checks that are easy to forget are already built in, and every rule is written down in docs/SECURITY.md."
          tone="dark"
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map(({ icon: Icon, tag, text }, index) => (
            <RevealItem key={tag} delay={(index % 4) * 0.07} className="flex">
              <article className="flex w-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                <Icon className="size-6 text-brand-300" aria-hidden="true" />
                {/* Written in normal case and shown in capitals, so screen readers don't spell it out */}
                <h3 className="mt-5 font-mono text-xs font-semibold uppercase tracking-wider text-brand-200">{tag}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-300">{text}</p>
              </article>
            </RevealItem>
          ))}
        </ul>
      </Container>
    </section>
  );
}
