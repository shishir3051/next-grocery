import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Display face for the /showcase landing page: headings and the wordmark.
 * next/font self-hosts it, so the Content-Security-Policy needs no font hosts.
 */
export const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});
