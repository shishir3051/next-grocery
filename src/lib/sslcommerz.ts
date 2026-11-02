/**
 * Minimal SSLCommerz helpers.
 *
 * Security rule: the browser redirect (success_url) and even the IPN body are
 * untrusted. A payment is only real once SSLCommerz's Order Validation API
 * confirms it for our store credentials.
 */

const isLive = () => process.env.IS_LIVE === "true";

const baseUrl = () => (isLive() ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

export const SSLCOMMERZ_INIT_URL = () => `${baseUrl()}/gwprocess/v4/api.php`;

export interface ValidatedPayment {
  tranId: string;
  amount: number;
  currency: string;
}

/**
 * Calls the SSLCommerz validation API for a `val_id`.
 * Returns the confirmed transaction, or null if it is not a valid, completed payment.
 */
export async function validateSslPayment(valId: string): Promise<ValidatedPayment | null> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) {
    console.error("SSLCommerz credentials are not configured");
    return null;
  }

  const params = new URLSearchParams({ val_id: valId, store_id: storeId, store_passwd: storePassword, format: "json" });
  const response = await fetch(`${baseUrl()}/validator/api/validationserverAPI.php?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;

  const data = await response.json();
  if (data?.status !== "VALID" && data?.status !== "VALIDATED") return null;
  if (typeof data.tran_id !== "string") return null;

  return { tranId: data.tran_id, amount: Number(data.amount), currency: String(data.currency) };
}
