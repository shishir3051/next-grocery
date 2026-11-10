// Coupon rules: one rule (couponProblem) for the cart preview and for order creation,
// plus the discount maths (computeCouponDiscount) both of them charge.
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCouponDiscount, couponProblem, type CouponRules } from "@/lib/orders";

const NOW = new Date("2026-11-10T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const valid: CouponRules = {
  isActive: true,
  startDate: new Date(NOW.getTime() - DAY),
  expiryDate: new Date(NOW.getTime() + DAY),
  minOrderAmount: 500,
  usageLimit: 100,
  usedCount: 3,
};

test("an active coupon inside its dates, under its limit and above its minimum is valid", () => {
  assert.equal(couponProblem(valid, 500, NOW), null);
  assert.equal(couponProblem(valid, 2000, NOW), null);
});

test("unknown, switched-off, not-yet-started and expired coupons are rejected", () => {
  assert.equal(couponProblem(null, 1000, NOW), "Invalid or expired coupon code");
  assert.equal(couponProblem({ ...valid, isActive: false }, 1000, NOW), "Invalid or expired coupon code");
  assert.equal(couponProblem({ ...valid, startDate: new Date(NOW.getTime() + DAY) }, 1000, NOW), "Invalid or expired coupon code");
  assert.equal(couponProblem({ ...valid, expiryDate: new Date(NOW.getTime() - 1) }, 1000, NOW), "Invalid or expired coupon code");
  assert.equal(couponProblem({ ...valid, expiryDate: null }, 1000, NOW), "Invalid or expired coupon code");
});

test("a coupon stays valid up to the exact expiry moment", () => {
  assert.equal(couponProblem({ ...valid, expiryDate: NOW }, 1000, NOW), null);
});

test("a used-up coupon is rejected", () => {
  assert.equal(couponProblem({ ...valid, usageLimit: 3, usedCount: 3 }, 1000, NOW), "Coupon usage limit reached");
  assert.equal(couponProblem({ ...valid, usageLimit: 3, usedCount: 2 }, 1000, NOW), null);
});

test("no usage limit (null, missing or 0, as the admin panel saves it) means unlimited", () => {
  assert.equal(couponProblem({ ...valid, usageLimit: null, usedCount: 9999 }, 1000, NOW), null);
  assert.equal(couponProblem({ ...valid, usageLimit: undefined, usedCount: 9999 }, 1000, NOW), null);
  assert.equal(couponProblem({ ...valid, usageLimit: 0, usedCount: 9999 }, 1000, NOW), null);
});

test("orders below the coupon's minimum are rejected with the minimum in the message", () => {
  assert.equal(couponProblem(valid, 499.99, NOW), "Min order for this coupon is ৳500");
  assert.equal(couponProblem({ ...valid, minOrderAmount: null }, 1, NOW), null);
});

test("a percentage coupon is capped by its maximum discount; a fixed one never goes below zero", () => {
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 10, maxDiscount: 50 }, 1000), 50);
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 10, maxDiscount: null }, 1000), 100);
  assert.equal(computeCouponDiscount({ discountType: "fixed", discountValue: 300 }, 200), 200);
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 12.5 }, 99.99), 12.5);
});
