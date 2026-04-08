"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-100 py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Terms & <span className="text-teal-600">Conditions</span></h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">
          Please read these terms carefully before using the FreshBasket platform.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <article className="prose prose-slate max-w-none">
          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">2. Ordering Policy</h2>
              <ul className="list-disc pl-5 space-y-3 text-slate-600 font-medium">
                <li>Orders can be placed via the website or mobile application.</li>
                <li>The minimum order value for delivery is ৳100.</li>
                <li>FreshBasket reserves the right to cancel any order in case of stock unavailability or incorrect pricing.</li>
                <li>Delivery times are estimates and may vary due to traffic or weather conditions.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">3. Pricing & Payments</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                Prices for all products on the platform are in Bangladeshi Taka (BDT) and include VAT where applicable. We accept Cash on Delivery and various digital payment methods. All payments are processed through secure, 100% encrypted gateways.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">4. Modification of Service</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                FreshBasket reserves the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">5. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the People's Republic of Bangladesh.
              </p>
            </section>
          </div>
        </article>

        <div className="mt-20 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Last Updated</p>
            <p className="text-lg font-black text-slate-800 italic">April 08, 2026</p>
        </div>
      </div>
    </div>
  );
}
