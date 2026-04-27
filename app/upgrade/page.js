import { Suspense } from "react";
import Link from "next/link";
import UpgradeFlow from "../../components/UpgradeFlow";

export const metadata = {
  title: "Upgrade to Pro Lifetime",
  description: "Upgrade to Study Capture Pro Lifetime for ₹799 with secure Razorpay Checkout."
};

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <div className="mx-auto mb-10 max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
      </div>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<div className="rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-mist/65">Loading upgrade...</div>}>
          <UpgradeFlow />
        </Suspense>
      </div>
    </main>
  );
}
