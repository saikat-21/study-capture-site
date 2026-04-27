"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { contactMailto } from "../lib/site";

const SUCCESS_KEY = "studyCapturePaymentSuccess";

export default function SuccessClient() {
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SUCCESS_KEY);
    if (!stored) return;

    try {
      setPayment(JSON.parse(stored));
    } catch {
      setPayment(null);
    }
  }, []);

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#101A20] p-7 shadow-panel sm:p-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/12 text-mint">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-8 text-4xl font-semibold leading-tight text-white sm:text-5xl">
        Excellent choice — welcome to Study Capture Pro.
      </h1>
      <div className="mt-6 rounded-2xl border border-mint/20 bg-mint/10 p-5">
        <p className="text-sm text-mist/58">Pro active for</p>
        <p className="mt-1 font-semibold text-white">{payment?.email || "your license email"}</p>
        <p className="mt-4 text-sm text-mist/58">License reference</p>
        <p className="mt-1 font-semibold text-white">{payment?.licenseRef || "Check your email for your license reference."}</p>
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
        <h2 className="font-semibold text-white">Next steps</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-mist/70">
          <li>1. Install extension</li>
          <li>2. Open extension</li>
          <li>3. Click Activate Pro</li>
          <li>4. Use the same email and license reference</li>
        </ol>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/install"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
        >
          Install extension
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={contactMailto}
          className="inline-flex h-12 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-semibold text-white transition hover:border-mint/50 hover:bg-white/[0.06]"
        >
          Contact support
        </a>
      </div>
    </section>
  );
}
