// Checkout maths and request validation: the rules the order APIs and the checkout page share.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getEffectivePrice, getSavings, roundMoney } from "@/lib/pricing";
import { computeCouponDiscount, parseOrderRequest } from "@/lib/orders";

const PRODUCT_ID = "69d813b8a0d2634e66625019";
const ADDRESS = { street: " House 1, Road 2 ", city: "Dhaka", zipCode: "1207", phone: "01700000000" };

test("a sale price applies only when it is lower than the regular price", () => {
  assert.equal(getEffectivePrice({ price: 120, discountPrice: 100 }), 100);
  assert.equal(getEffectivePrice({ price: 120, discountPrice: 0 }), 120);
  assert.equal(getEffectivePrice({ price: 120, discountPrice: null }), 120);
  assert.equal(getEffectivePrice({ price: 120, discountPrice: 150 }), 120);
  assert.equal(getSavings({ price: 120, discountPrice: 100 }), 20);
  assert.equal(getSavings({ price: 120 }), 0);
});

test("money is rounded to two decimals", () => {
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(99.999), 100);
});

test("percentage coupons respect their maximum discount", () => {
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 10 }, 500), 50);
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 50, maxDiscount: 200 }, 1000), 200);
  assert.equal(computeCouponDiscount({ discountType: "percentage", discountValue: 10, maxDiscount: null }, 3000), 300);
});

test("fixed coupons never make the goods cost less than zero", () => {
  assert.equal(computeCouponDiscount({ discountType: "fixed", discountValue: 100 }, 500), 100);
  assert.equal(computeCouponDiscount({ discountType: "fixed", discountValue: 600 }, 500), 500);
  assert.equal(computeCouponDiscount({ discountType: "fixed", discountValue: -50 }, 500), 0);
});

test("a valid checkout request is normalised", () => {
  const result = parseOrderRequest({
    items: [{ productId: PRODUCT_ID, quantity: 2 }, { productId: PRODUCT_ID.toUpperCase(), quantity: 1 }],
    shippingAddress: ADDRESS,
    couponCode: " welcome10 ",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.items, [{ productId: PRODUCT_ID, quantity: 3 }]); // same product merged
  assert.equal(result.value.shippingAddress.street, "House 1, Road 2");
  assert.equal(result.value.couponCode, "WELCOME10");
  assert.equal(result.value.useWallet, false);
});

test("invalid checkout requests are rejected", () => {
  const item = { productId: PRODUCT_ID, quantity: 1 };
  const bad = [
    {},
    { items: [], shippingAddress: ADDRESS },
    { items: [{ productId: "not-an-id", quantity: 1 }], shippingAddress: ADDRESS },
    { items: [{ ...item, quantity: 0 }], shippingAddress: ADDRESS },
    { items: [{ ...item, quantity: 1.5 }], shippingAddress: ADDRESS },
    { items: [{ ...item, quantity: 101 }], shippingAddress: ADDRESS },
    { items: [item], shippingAddress: { ...ADDRESS, phone: "" } },
    { items: [item], shippingAddress: ADDRESS, couponCode: "X".repeat(41) },
    { items: [item], shippingAddress: ADDRESS, deliveryNote: "x".repeat(501) },
  ];
  for (const body of bad) assert.equal(parseOrderRequest(body).ok, false, JSON.stringify(body).slice(0, 80));
});
