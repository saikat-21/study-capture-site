import { Suspense } from "react";
import Link from "next/link";
import SuccessClient from "../../components/SuccessClient";

export const metadata = {
  title: "Welcome to Pro",
  description: "Study Capture Pro activation next steps."
};

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <div className="mx-auto mb-10 max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
      </div>
      <Suspense fallback={<div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-mist/65">Loading success...</div>}>
        <SuccessClient />
      </Suspense>
    </main>
  );
}
