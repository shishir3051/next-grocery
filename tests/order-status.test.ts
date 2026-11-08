// Order status rules: pending → processing → shipped → delivered; cancel any time before delivery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, isOrderStatus } from "@/lib/orderStatus";

test("orders move forward through the delivery flow", () => {
  assert.equal(canTransition("pending", "processing"), true);
  assert.equal(canTransition("pending", "shipped"), true);
  assert.equal(canTransition("processing", "shipped"), true);
  assert.equal(canTransition("shipped", "delivered"), true);
});

test("orders can be cancelled until they are delivered", () => {
  for (const from of ["pending", "processing", "shipped"] as const) assert.equal(canTransition(from, "cancelled"), true);
  assert.equal(canTransition("delivered", "cancelled"), false);
});

test("delivered and cancelled are final, and steps never go backwards", () => {
  assert.equal(canTransition("delivered", "pending"), false);
  assert.equal(canTransition("cancelled", "processing"), false);
  assert.equal(canTransition("shipped", "processing"), false);
  assert.equal(canTransition("pending", "delivered"), false);
});

test("only known statuses are accepted", () => {
  assert.equal(isOrderStatus("shipped"), true);
  assert.equal(isOrderStatus("refunded"), false);
  assert.equal(isOrderStatus(undefined), false);
});
