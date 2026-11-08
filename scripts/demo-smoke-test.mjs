// API smoke test of the live-demo flow and its role rules, against a running server.
//
//   npm run test:demo -- https://your-demo.example.com     (default: http://localhost:3000)
//
// Needs DEMO_MODE=true on that server and the demo accounts (npm run db:seed -- --demo-users).
// It places one demo order as the demo customer. Demo orders never touch real stock, coupons
// or wallets, and are deleted automatically after 3 days. Exits with code 1 if a check fails.
const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const DEMO_DOMAIN = "@demo.freshbasket.app";
const results = [];

function check(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

/** Minimal cookie jar, so each demo role keeps its own session. */
class Session {
  cookies = {};
  store(response) {
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(";")[0];
      const i = pair.indexOf("=");
      const name = pair.slice(0, i);
      const value = pair.slice(i + 1);
      if (!value || /max-age=0/i.test(header)) delete this.cookies[name];
      else this.cookies[name] = value;
    }
  }
  async request(path, options = {}) {
    const cookie = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    const response = await fetch(BASE + path, { ...options, redirect: "manual", headers: { ...options.headers, cookie } });
    this.store(response);
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return { status: response.status, headers: response.headers, body };
  }
  json(method, path, data) {
    return this.request(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
  }
}

async function demoLogin(role) {
  const session = new Session();
  const { body: csrf } = await session.request("/api/auth/csrf");
  await session.request("/api/auth/callback/demo", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, role, json: "true" }),
  });
  const { body } = await session.request("/api/auth/session");
  return { session, user: body?.user };
}

const list = (body, key) => (Array.isArray(body) ? body : body?.[key] || []);
const isInitials = name => typeof name === "string" && /^.•••( .\.)?$/u.test(name);
const readOnly = r => r.status === 403 && Boolean(r.headers.get("x-demo-read-only"));

console.log(`Demo smoke test against ${BASE}\n`);
const customer = await demoLogin("customer");
const admin = await demoLogin("admin");
const rider = await demoLogin("rider");
check("one-click demo logins (customer, admin, rider)", Boolean(customer.user?.isDemo && admin.user?.isDemo && rider.user?.isDemo));
if (!customer.user || !admin.user || !rider.user) {
  console.log("\nDemo logins failed: is DEMO_MODE=true set and were the demo accounts seeded?");
  process.exit(1);
}

const guest = new Session();
const { body: catalogue } = await guest.request("/api/products?search=apple");
const product = list(catalogue, "products").find(p => p.stock > 5);
check("catalogue is available", Boolean(product));
if (!product) process.exit(1);

const placed = await customer.session.json("POST", "/api/orders", {
  items: [{ productId: product._id, quantity: 1 }],
  shippingAddress: { street: "Flat 9, Private Road", city: "Chattogram", zipCode: "4000", phone: "01911111111" },
  deliveryNote: "Ring the bell twice",
});
const orderId = placed.body?.orderId;
check("customer places a cash-on-delivery order", placed.status === 201 && Boolean(orderId), `status ${placed.status}`);

const after = list((await guest.request("/api/products?search=apple")).body, "products").find(p => p._id === product._id);
check("real stock is unchanged by a demo order", after?.stock === product.stock, `${product.stock} -> ${after?.stock}`);

const mine = list((await customer.session.request("/api/orders")).body, "orders").find(o => o._id === orderId);
check("typed address and note are not stored on demo orders",
  Boolean(mine) && mine.shippingAddress?.phone !== "01911111111" && !/Private Road/.test(mine.shippingAddress?.street || "") && !mine.deliveryNote);

const orders = list((await admin.session.request("/api/admin/orders")).body, "orders");
check("demo admin never receives payment transaction ids", orders.length > 0 && orders.every(o => !o.paymentProviderId));
check("real customers' names are initials only", orders.filter(o => !o.isDemo && o.user?.name).every(o => isInitials(o.user.name)));

const users = list((await admin.session.request("/api/admin/users")).body, "users");
const riderUser = users.find(u => u.email === `rider${DEMO_DOMAIN}`);
const adminUser = users.find(u => u.email === `admin${DEMO_DOMAIN}`);
check("real users are masked in the users list", users.filter(u => !String(u.email).endsWith(DEMO_DOMAIN)).every(u => isInitials(u.name) || u.name === "Customer"));

const selfAssign = await admin.session.json("PATCH", "/api/admin/orders", { orderId, assignedTo: adminUser?._id });
check("demo admin can't assign an order to itself", selfAssign.status === 403, `status ${selfAssign.status}`);
const markPaid = await admin.session.json("PATCH", "/api/admin/orders", { orderId, paymentStatus: "paid" });
check("demo admin can't change payment status", readOnly(markPaid), `status ${markPaid.status}`);
const realOrder = orders.find(o => !o.isDemo);
if (realOrder) {
  const touchReal = await admin.session.json("PATCH", "/api/admin/orders", { orderId: realOrder._id, status: "cancelled" });
  check("demo admin can't change a real order", readOnly(touchReal), `status ${touchReal.status}`);
}
const settings = await admin.session.json("POST", "/api/admin/settings", { storeName: "Hacked" });
check("demo admin can't change store settings", readOnly(settings), `status ${settings.status}`);
const assign = await admin.session.json("PATCH", "/api/admin/orders", { orderId, assignedTo: riderUser?._id });
check("demo admin assigns the demo order to the Demo Rider", assign.status === 200, `status ${assign.status}`);

const assigned = list((await rider.session.request("/api/delivery/orders")).body, "orders");
check("rider sees the assigned order", assigned.some(o => o._id === orderId));
const delivered = await rider.session.json("PATCH", "/api/delivery/orders", { orderId, status: "delivered" });
check("rider marks it delivered", delivered.status === 200, `status ${delivered.status}`);

const final = list((await customer.session.request("/api/orders")).body, "orders").find(o => o._id === orderId);
check("customer sees it delivered and paid", final?.status === "delivered" && final?.paymentStatus === "paid", `${final?.status}/${final?.paymentStatus}`);

const contact = await customer.session.json("POST", "/api/contact", {
  name: "Demo Customer", email: `customer${DEMO_DOMAIN}`, subject: "Delivery delay", message: "Testing the demo account.",
});
check("demo accounts can't send contact messages", readOnly(contact), `status ${contact.status}`);

const noSession = await new Session().request("/api/admin/orders");
check("admin API refuses visitors without a session", noSession.status === 401 || noSession.status === 403, `status ${noSession.status}`);

const cancel = await fetch(`${BASE}/api/payments/ssl-status?status=cancel`, { method: "POST", body: new URLSearchParams({ tran_id: "SSLC_unknown" }), redirect: "manual" });
check("unsigned payment-cancel callback changes nothing", cancel.status >= 300 && cancel.status < 400, `status ${cancel.status}`);

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
