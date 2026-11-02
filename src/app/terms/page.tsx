"use client";

/* Shared styles for each numbered section of the terms */
const headingClass = "text-lg font-semibold text-slate-900";
const bodyClass = "mt-2 text-base leading-relaxed text-slate-700";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Legal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Terms &amp; conditions</h1>
          <p className="mt-3 text-base text-slate-600">
            Please read these terms carefully before using the FreshBasket platform.
          </p>
          <p className="mt-2 text-sm text-slate-500">Last updated: April 08, 2026</p>
        </header>

        <article className="mt-8 max-w-3xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:mt-10 sm:p-10">
          <section>
            <h2 className={headingClass}>1. Acceptance of terms</h2>
            <p className={bodyClass}>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this website&apos;s particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>2. Ordering policy</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 marker:text-brand-600">
              <li>Orders can be placed via the website or mobile application.</li>
              <li>The minimum order value for delivery is ৳100.</li>
              <li>FreshBasket reserves the right to cancel any order in case of stock unavailability or incorrect pricing.</li>
              <li>Delivery times are estimates and may vary due to traffic or weather conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className={headingClass}>3. Pricing &amp; payments</h2>
            <p className={bodyClass}>
              Prices for all products on the platform are in Bangladeshi Taka (BDT) and include VAT where applicable. We accept Cash on Delivery and various digital payment methods. All payments are processed through secure, 100% encrypted gateways.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>4. Modification of service</h2>
            <p className={bodyClass}>
              FreshBasket reserves the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className={headingClass}>5. Governing law</h2>
            <p className={bodyClass}>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the People&apos;s Republic of Bangladesh.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
