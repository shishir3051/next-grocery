import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Subtle vertical gradient + inner top highlight give the main action depth (white text ≥ 5.5:1 throughout).
  primary:
    "bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(15_118_110/0.25),0_4px_12px_-2px_rgb(15_118_110/0.35)] hover:from-brand-700 hover:to-brand-800 active:from-brand-800 active:to-brand-800 " +
    // Disabled (but not loading) reads as neutral "not ready yet"; the gradient would otherwise hide bg colours.
    "disabled:not-aria-busy:bg-none disabled:not-aria-busy:bg-slate-200 disabled:not-aria-busy:text-slate-500 disabled:not-aria-busy:shadow-none disabled:not-aria-busy:opacity-100",
  secondary: "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/**
 * The one button style for the whole app (see docs/design/DESIGN_SYSTEM.md).
 * Pass `href` to render a Next.js <Link> that looks like a button.
 */
export default function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", fullWidth, loading, className, children, ...rest } = props;
  const classes = cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className
  );

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest as LinkProps;
    return <Link href={href} className={classes} {...anchorProps}>{children}</Link>;
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={classes}
      disabled={loading || buttonProps.disabled}
      aria-busy={loading || undefined}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
