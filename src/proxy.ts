import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDemoModeEnabled } from "@/lib/demo";

/**
 * Route protection (Next.js 16 "proxy", formerly middleware).
 *
 * This is an optimistic check based on the JWT so protected pages never render
 * for the wrong user. It is NOT the security boundary: every admin/delivery API
 * route still re-checks the user's role in the database.
 */
const ROLE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/delivery", roles: ["delivery", "admin"] },
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rule = ROLE_RULES.find(r => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // getToken skips the jwt callback, so a one-click demo session (revoked there once the
  // live demo is off, see lib/auth.ts) is treated as signed out here too.
  if (!token || (token.demoLogin && !isDemoModeEnabled())) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!rule.roles.includes(token.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/delivery/:path*"],
};
