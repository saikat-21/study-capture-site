import { Suspense } from "react";
import CheckoutClient from "../../components/CheckoutClient";

export const metadata = {
  title: "Checkout",
  description: "Study Capture Pro Lifetime checkout."
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <Suspense fallback={<div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-mist/65">Loading checkout...</div>}>
        <CheckoutClient />
      </Suspense>
    </main>
  );
}
