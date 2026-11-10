// Route-by-route access check. Every API route handler and every HTTP method it exports
// must be listed in ROUTES below, with who may call it and the checks that enforce it, and
// each check must actually appear in that handler. The same table is published in
// docs/SECURITY.md ("Route access matrix"); this test fails when the two drift apart.
// After changing a route: update ROUTES, then run `UPDATE_DOCS=1 npm test` to refresh the doc.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const APP = join(ROOT, "src", "app");
const DOC = join(ROOT, "docs", "SECURITY.md");
const START = "<!-- route-access:start -->";
const END = "<!-- route-access:end -->";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const WRITES = new Set<Method>(["POST", "PUT", "PATCH", "DELETE"]);

interface Rule {
  /** Who may call it, in plain words (shown in docs/SECURITY.md). */
  who: string;
  /** Code that must appear in the handler (single quotes are read as double quotes). */
  checks: string[];
}

// --- Shared rules ---------------------------------------------------------------------
const ADMIN_READ: Rule = { who: "Admin", checks: ['requireRole("admin")'] };
const ADMIN_READ_MASKED: Rule = { who: "Admin (demo admin sees customer data masked)", checks: ['requireRole("admin")', "isDemoRestricted("] };
const ADMIN_WRITE: Rule = { who: "Admin (demo admin: read-only)", checks: ['requireRoleForWrite("admin")'] };
const PUBLIC_READ: Rule = { who: "Public (read-only store content)", checks: [] };
const PUBLIC_LIMITED: Rule = { who: "Public, rate-limited", checks: ["checkRateLimit("] };

const ROUTES: Record<string, Partial<Record<Method, Rule>>> = {
  "/api/admin/categories": { GET: ADMIN_READ, POST: ADMIN_WRITE, PUT: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/admin/coupons": { GET: ADMIN_READ, POST: ADMIN_WRITE, PUT: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/admin/hero": { GET: ADMIN_READ, POST: ADMIN_WRITE, PUT: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/admin/messages": { GET: ADMIN_READ_MASKED },
  "/api/admin/messages/[id]": {
    PATCH: { who: "Admin (demo admin can't send replies)", checks: ['requireRole("admin")', "isDemoRestricted(", "demoReadOnly("] },
    DELETE: ADMIN_WRITE,
  },
  "/api/admin/orders": {
    GET: ADMIN_READ_MASKED,
    PATCH: { who: "Admin (demo admin: demo orders only)", checks: ['requireRole("admin")', "isDemoRestricted(", "demoReadOnly("] },
  },
  "/api/admin/products": { GET: ADMIN_READ, POST: ADMIN_WRITE, PUT: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/admin/settings": { GET: ADMIN_READ, POST: ADMIN_WRITE },
  "/api/admin/stats": { GET: ADMIN_READ_MASKED },
  "/api/admin/users": { GET: ADMIN_READ_MASKED, POST: ADMIN_WRITE, PUT: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/ai/recipes": { POST: PUBLIC_LIMITED },
  "/api/ai/smart-search": { POST: PUBLIC_LIMITED },
  "/api/auth/[...nextauth]": {
    GET: { who: "Public (NextAuth sign-in, session and CSRF endpoints)", checks: [] },
    POST: { who: "Public (NextAuth sign-in, session and CSRF endpoints)", checks: [] },
  },
  "/api/auth/forgot-password": { POST: PUBLIC_LIMITED },
  "/api/auth/register": { POST: PUBLIC_LIMITED },
  "/api/auth/reset-password": { POST: PUBLIC_LIMITED },
  "/api/auth/verify-otp": { POST: PUBLIC_LIMITED },
  "/api/categories": { GET: PUBLIC_READ },
  "/api/contact": { POST: { who: "Public contact form, rate-limited (demo accounts: read-only)", checks: ["checkRateLimit(", "demoReadOnly("] } },
  "/api/coupons/validate": { POST: { who: "Signed-in account, rate-limited", checks: ["requireUser()", "checkRateLimit("] } },
  "/api/delivery/orders": {
    GET: { who: "Rider or admin: only orders assigned to them", checks: ['requireRole("delivery", "admin")', "assignedTo: auth.user.id"] },
    PATCH: { who: "Rider or admin: only orders assigned to them (demo rider: demo orders only)", checks: ['requireRole("delivery", "admin")', "assignedTo: auth.user.id", "isDemoRestricted("] },
  },
  "/api/geocode": { GET: PUBLIC_LIMITED },
  "/api/news": { GET: { who: "Public (published articles)", checks: [] } },
  "/api/news/[id]": { GET: { who: "Public (published articles; drafts only for admins)", checks: ["requireAdmin()"] } },
  "/api/news/admin": { POST: ADMIN_WRITE },
  "/api/news/admin/[id]": { PATCH: ADMIN_WRITE, DELETE: ADMIN_WRITE },
  "/api/orders": {
    GET: { who: "Signed-in account: only their own orders", checks: ["requireUser()", "user: auth.user.id"] },
    POST: { who: "Signed-in account, rate-limited (order is saved for that account)", checks: ["requireUser()", "checkRateLimit(", "user: userId"] },
  },
  "/api/payments/ssl-init": { POST: { who: "Signed-in account, rate-limited (order is saved for that account)", checks: ["requireUser()", "checkRateLimit(", "user: user.id"] } },
  "/api/payments/ssl-status": {
    POST: { who: "SSLCommerz callback: paid only after SSLCommerz confirms; cancel needs the signed link", checks: ["validateSslPayment(", "timingSafeEqual("] },
  },
  "/api/products": { GET: PUBLIC_READ },
  "/api/public/coupons": { GET: { who: "Public (active coupons shown in the cart)", checks: [] } },
  "/api/public/hero": { GET: PUBLIC_READ },
  "/api/seed": { POST: ADMIN_WRITE },
  "/api/settings": { GET: { who: "Public (store name, delivery fees, maintenance flag)", checks: [] } },
  "/api/stats/public": { GET: PUBLIC_READ },
  "/api/user/profile": {
    GET: { who: "Signed-in account: only their own profile", checks: ["requireUser()", "auth.user.id"] },
    PUT: { who: "Signed-in account: only their own profile (demo accounts: read-only)", checks: ["requireRoleForWrite()", "auth.user.id"] },
  },
  "/media/products/[id]/[version]": { GET: { who: "Public (product photos)", checks: [] } },
};

// --- Reading the route handlers --------------------------------------------------------
function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

/** Each exported method of a route file, with the source from its export to the next one. */
function handlers(): Map<string, Map<Method, string>> {
  const found = new Map<string, Map<Method, string>>();
  for (const file of routeFiles(APP)) {
    const route = "/" + relative(APP, join(file, "..")).split(sep).join("/");
    const source = readFileSync(file, "utf8").replaceAll("'", '"');
    const methods = new Map<Method, string>();
    const exports = [...source.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)];
    exports.forEach((match, i) => {
      methods.set(match[1] as Method, source.slice(match.index, exports[i + 1]?.index ?? source.length));
    });
    // export { handler as GET, handler as POST }
    for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const name of match[1].matchAll(/\bas\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) methods.set(name[1] as Method, source);
    }
    found.set(route, methods);
  }
  return found;
}

const code = (text: string) => "`" + text.replace(/\|/g, "\\|") + "`";

function matrix(): string {
  const rows = ["| Route | Method | Who can call it | Enforced in the handler by |", "| --- | --- | --- | --- |"];
  for (const route of Object.keys(ROUTES).sort()) {
    for (const method of METHODS) {
      const rule = ROUTES[route][method];
      if (!rule) continue;
      const checks = rule.checks.length ? rule.checks.map(code).join(", ") : "nothing: public by design";
      rows.push(`| ${code(route)} | ${method} | ${rule.who} | ${checks} |`);
    }
  }
  return rows.join("\n");
}

// --- Tests -----------------------------------------------------------------------------
const found = handlers();

test("every route handler and method is listed in the access table, and nothing else is", () => {
  const actual = [...found].flatMap(([route, methods]) => [...methods.keys()].map((m) => `${m} ${route}`)).sort();
  const expected = Object.entries(ROUTES).flatMap(([route, rules]) => Object.keys(rules).map((m) => `${m} ${route}`)).sort();
  assert.deepEqual(actual, expected, "Add new routes or methods to ROUTES in tests/route-access.test.ts");
});

test("every handler contains the checks its access rule names", () => {
  for (const [route, rules] of Object.entries(ROUTES)) {
    for (const [method, rule] of Object.entries(rules) as [Method, Rule][]) {
      const body = found.get(route)?.get(method) ?? "";
      for (const check of rule.checks) {
        assert.ok(body.includes(check), `${method} ${route} must contain ${check}`);
      }
    }
  }
});

test("every admin API method requires the admin role", () => {
  for (const [route, methods] of found) {
    if (!/^\/api\/(admin|news\/admin)(\/|$)/.test(route)) continue;
    for (const [method, body] of methods) {
      assert.ok(
        body.includes('requireRole("admin")') || body.includes('requireRoleForWrite("admin")'),
        `${method} ${route} must call requireRole("admin") or requireRoleForWrite("admin")`
      );
    }
  }
});

test("every data-changing method is guarded, rate-limited or verified", () => {
  const protections = ["requireRoleForWrite(", "requireRole(", "requireUser(", "checkRateLimit(", "validateSslPayment("];
  for (const [route, methods] of found) {
    if (route === "/api/auth/[...nextauth]") continue; // NextAuth's own handler
    for (const [method, body] of methods) {
      if (!WRITES.has(method)) continue;
      assert.ok(protections.some((p) => body.includes(p)), `${method} ${route} changes data without a guard`);
    }
  }
});

test("docs/SECURITY.md shows the current route access matrix", () => {
  // Line endings don't matter: a Windows checkout may turn LF into CRLF.
  const doc = readFileSync(DOC, "utf8").replace(/\r\n/g, "\n");
  const start = doc.indexOf(START);
  const end = doc.indexOf(END);
  assert.ok(start !== -1 && end > start, `docs/SECURITY.md needs the ${START} / ${END} markers`);
  const table = matrix();
  if (process.env.UPDATE_DOCS === "1") {
    writeFileSync(DOC, `${doc.slice(0, start + START.length)}\n${table}\n${doc.slice(end)}`);
    return;
  }
  assert.equal(doc.slice(start + START.length, end).trim(), table, "Run `UPDATE_DOCS=1 npm test` to refresh docs/SECURITY.md");
});
