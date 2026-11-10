// Role checks: the rule behind requireRole / requireRoleForWrite / requireUser (lib/authGuard.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideAccess, type AccountForAccess } from "@/lib/access";
import { DEMO_ACCOUNTS } from "@/lib/demo";

const admin: AccountForAccess = { role: "admin", email: "owner@shop.example" };
const customer: AccountForAccess = { role: "user", email: "rahim@gmail.com" };
const rider: AccountForAccess = { role: "delivery", email: "rider@shop.example" };
const demoAdmin: AccountForAccess = { role: "admin", email: DEMO_ACCOUNTS.admin.email };

test("signed-out visitors and deleted accounts get 401", () => {
  assert.deepEqual(decideAccess(null, ["admin"]), { ok: false, status: 401, reason: "signed-out" });
  assert.deepEqual(decideAccess(undefined, []), { ok: false, status: 401, reason: "signed-out" });
});

test("an account outside the allowed roles gets 403", () => {
  assert.deepEqual(decideAccess(customer, ["admin"]), { ok: false, status: 403, reason: "wrong-role" });
  assert.deepEqual(decideAccess(rider, ["admin"]), { ok: false, status: 403, reason: "wrong-role" });
  assert.deepEqual(decideAccess(customer, ["delivery", "admin"]), { ok: false, status: 403, reason: "wrong-role" });
});

test("an account with an allowed role passes", () => {
  assert.deepEqual(decideAccess(admin, ["admin"]), { ok: true });
  assert.deepEqual(decideAccess(rider, ["delivery", "admin"]), { ok: true });
  assert.deepEqual(decideAccess(admin, ["delivery", "admin"]), { ok: true });
});

test("an empty role list means any signed-in account (requireUser)", () => {
  for (const account of [admin, customer, rider]) assert.deepEqual(decideAccess(account, []), { ok: true });
});

test("demo accounts can read but not change data while the live demo is on", () => {
  assert.deepEqual(decideAccess(demoAdmin, ["admin"], { demoMode: true }), { ok: true });
  assert.deepEqual(decideAccess(demoAdmin, ["admin"], { write: true, demoMode: true }), { ok: false, status: 403, reason: "demo-read-only" });
  const demoCustomer = { role: "user", email: DEMO_ACCOUNTS.customer.email } as const;
  assert.deepEqual(decideAccess(demoCustomer, [], { write: true, demoMode: true }), { ok: false, status: 403, reason: "demo-read-only" });
});

test("the demo read-only rule applies only in demo mode, and never to real accounts", () => {
  assert.deepEqual(decideAccess(demoAdmin, ["admin"], { write: true, demoMode: false }), { ok: true });
  assert.deepEqual(decideAccess(admin, ["admin"], { write: true, demoMode: true }), { ok: true });
});

test("the role is checked before the demo rule, so a demo customer can't reach admin writes", () => {
  const demoCustomer = { role: "user", email: DEMO_ACCOUNTS.customer.email } as const;
  assert.deepEqual(decideAccess(demoCustomer, ["admin"], { write: true, demoMode: true }), { ok: false, status: 403, reason: "wrong-role" });
});
