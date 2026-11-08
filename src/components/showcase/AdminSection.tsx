import {
  BadgePercent,
  ChartColumn,
  FolderTree,
  LayoutDashboard,
  MessagesSquare,
  Newspaper,
  PanelsTopLeft,
  Settings,
  Truck,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import AdminTabs from "./AdminTabs";
import { DemoButton, DemoLoginStatus } from "./DemoLogin";
import { Reveal } from "./Reveal";
import { Container, SectionHeader, buttonStyles } from "./primitives";

const MODULES = [
  { icon: ChartColumn, label: "Dashboard & 7-day sales" },
  { icon: FolderTree, label: "Products & 3-level categories" },
  { icon: Truck, label: "Orders & rider assignment" },
  { icon: BadgePercent, label: "Coupons" },
  { icon: PanelsTopLeft, label: "Hero banners" },
  { icon: Newspaper, label: "News" },
  { icon: UserCog, label: "Users & roles" },
  { icon: MessagesSquare, label: "Customer messages with email replies" },
  { icon: Settings, label: "Store settings & maintenance mode" },
];

export default function AdminSection() {
  return (
    <section id="admin" aria-labelledby="admin-title" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="admin-title"
          eyebrow="Admin panel"
          title="Run the whole store from one dashboard"
          intro="Catalogue, orders, marketing, users and customer messages in one panel, and every admin request re-checks the role in the database."
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-8">
            <AdminTabs />
          </Reveal>

          <div className="lg:col-span-4">
            <h3 className={cn(display.className, "text-lg font-bold tracking-tight text-slate-900")}>Every module included</h3>
            <ul className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
              {MODULES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 py-2 text-base text-slate-700">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-background p-5">
              <DemoButton
                role="admin"
                source="admin"
                className={cn(buttonStyles.primary, "w-full")}
                icon={<LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />}
              >
                Open the admin demo
              </DemoButton>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Every page opens. Changes are switched off, except for demo orders, so you can ship one to the demo
                rider.
              </p>
              <DemoLoginStatus source="admin" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
