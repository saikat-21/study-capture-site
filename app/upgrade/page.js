import { Suspense } from "react";
import UpgradeFlow from "../../components/UpgradeFlow";

export const metadata = {
  title: "Upgrade to Pro Lifetime",
  description: "Upgrade to Study Capture Pro Lifetime for ₹499 with secure Razorpay Checkout."
};

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<div className="rounded-3xl border border-line bg-panel/80 p-8 text-mist/65">Loading upgrade...</div>}>
          <UpgradeFlow />
        </Suspense>
      </div>
    </main>
  );
}
