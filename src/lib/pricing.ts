/**
 * Single source of truth for product pricing, shared by the UI and the order APIs.
 *
 * `discountPrice` is the SALE PRICE (what the customer pays), not an amount off.
 * Example: price 120, discountPrice 100 → customer pays ৳100 and saves ৳20.
 * A missing, zero, or not-lower discountPrice means no discount.
 */
export function getEffectivePrice(product: { price: number; discountPrice?: number | null }): number {
  const price = Number(product.price) || 0;
  const sale = Number(product.discountPrice) || 0;
  return sale > 0 && sale < price ? sale : price;
}

/** Amount saved per unit (0 when there is no discount). */
export function getSavings(product: { price: number; discountPrice?: number | null }): number {
  return (Number(product.price) || 0) - getEffectivePrice(product);
}

/** Round money to 2 decimals to avoid float drift (e.g. 0.1 + 0.2). */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
