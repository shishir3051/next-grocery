// Live-demo privacy: what demo visitors may see of real customers (lib/demo.ts, lib/demoMask.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ACCOUNTS, isDemoEmail, isDemoModeEnabled, isDemoRole, maskEmail, maskName, maskPhone } from "@/lib/demo";
import { maskMessage, maskOrder, maskUser } from "@/lib/demoMask";

test("names are reduced to initials", () => {
  assert.equal(maskName("Sudipta Akter"), "S••• A.");
  assert.equal(maskName("Sabbir"), "S•••");
  assert.equal(maskName("rahim@gmail.com"), "r•••");
  assert.equal(maskName(""), "Customer");
});

test("emails and phone numbers are masked", () => {
  assert.equal(maskEmail("salma@gmail.com"), "s•••@g•••.com");
  assert.equal(maskPhone("01711223344"), "••••••44");
});

test("demo accounts and roles are recognised", () => {
  assert.equal(isDemoEmail(DEMO_ACCOUNTS.admin.email), true);
  assert.equal(isDemoEmail("ADMIN@DEMO.FRESHBASKET.APP"), true);
  assert.equal(isDemoEmail("admin@freshbasket.app"), false);
  assert.equal(isDemoRole("rider"), true);
  assert.equal(isDemoRole("toString"), false);
});

test("demo mode is on only when DEMO_MODE is exactly 'true'", () => {
  const saved = process.env.DEMO_MODE;
  try {
    process.env.DEMO_MODE = "true";
    assert.equal(isDemoModeEnabled(), true);
    process.env.DEMO_MODE = "1";
    assert.equal(isDemoModeEnabled(), false);
    delete process.env.DEMO_MODE;
    assert.equal(isDemoModeEnabled(), false);
  } finally {
    if (saved === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = saved;
  }
});

test("real orders are masked and never carry the payment transaction id", () => {
  const real = maskOrder({
    isDemo: false,
    user: { name: "Sudipta Akter", email: "sudipta@gmail.com" },
    shippingAddress: { street: "Road 1", city: "Dhaka", zipCode: "1207", phone: "01711223344" },
    deliveryNote: "Call me at the gate",
    paymentProviderId: "SSLC_secret",
    totalAmount: 449,
  });
  assert.equal((real.user as { name: string }).name, "S••• A.");
  assert.notEqual(real.shippingAddress?.street, "Road 1");
  assert.equal(real.shippingAddress?.city, "Dhaka");
  assert.notEqual(real.deliveryNote, "Call me at the gate");
  assert.equal(real.paymentProviderId, null);
  assert.equal(real.totalAmount, 449);

  const demo = maskOrder({ isDemo: true, user: { name: "Demo Customer" }, paymentProviderId: "SSLC_demo" });
  assert.equal((demo.user as { name: string }).name, "Demo Customer");
  assert.equal(demo.paymentProviderId, null);
});

test("demo accounts are shown as they are; real users are masked", () => {
  assert.equal(maskUser({ name: "Demo Admin", email: DEMO_ACCOUNTS.admin.email })?.name, "Demo Admin");
  const real = maskUser({ name: "Golam Rahman", email: "golam@gmail.com", image: "data:image/png;base64,AAAA" });
  assert.equal(real?.name, "G••• R.");
  assert.equal(real?.image, "");
});

test("real contact messages hide their text; staff names are always hidden", () => {
  const real = maskMessage({
    name: "Rahim Uddin",
    email: "rahim@gmail.com",
    message: "My order is late",
    replies: [{ body: "Sorry!", sentByName: "Golam Rahman" }],
  });
  assert.notEqual(real.message, "My order is late");
  assert.equal(real.replies?.[0].sentByName, "Store team");
  assert.notEqual(real.replies?.[0].body, "Sorry!");

  const sample = maskMessage({
    email: DEMO_ACCOUNTS.customer.email,
    message: "Sample text",
    replies: [{ body: "Reply", sentByName: "Golam Rahman" }],
  });
  assert.equal(sample.message, "Sample text");
  assert.equal(sample.replies?.[0].sentByName, "Store team");
});
