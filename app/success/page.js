import { Suspense } from "react";
import SuccessClient from "../../components/SuccessClient";

export const metadata = {
  title: "Welcome to Pro",
  description: "Study Capture Pro activation next steps."
};

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <Suspense fallback={<div className="mx-auto max-w-3xl rounded-3xl border border-line bg-panel/80 p-8 text-mist/65">Loading success...</div>}>
        <SuccessClient />
      </Suspense>
    </main>
  );
}
