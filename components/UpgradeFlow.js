"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";

const ALLOWED_PARAMS = ["src", "reason"];
const CHECKOUT_KEY = "studyCaptureCheckout";

function preservedParams(searchParams) {
  const params = new URLSearchParams();

  ALLOWED_PARAMS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  });

  return params;
}

export default function UpgradeFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => preservedParams(searchParams), [searchParams]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function continueToCheckout(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    window.sessionStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({
        email: normalizedEmail,
        source: query.get("src") || "website",
        reason: query.get("reason") || "direct",
        enteredAt: new Date().toISOString()
      })
    );

    router.push(`/checkout${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
      <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-panel sm:p-8">
        <p className="text-sm font-semibold text-mint">Study Capture Pro Lifetime</p>
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <h1 className="text-5xl font-semibold text-white">₹799</h1>
          <p className="pb-2 text-sm font-medium text-mist/58">Founder Price · one time</p>
        </div>
        <p className="mt-6 text-lg leading-8 text-mist/72">
          Upgrade once and unlock the full study workflow across your personal browsers and devices.
        </p>
        <ul className="mt-8 space-y-4 text-sm text-mist/72">
          {[
            "Unlimited PDF exports",
            "Unlimited Study Books",
            "Reading Capture Mode",
            "Auto Scroll Capture",
            "Future Pro improvements"
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-2xl border border-mint/20 bg-mint/10 p-4 text-sm leading-7 text-mist/75">
          We use your email to deliver your Pro license, activate Study Capture across your browsers, recover purchases, and protect your license from abuse.
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint/12 text-mint">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-white">Start with your email</h2>
            <p className="mt-1 text-sm text-mist/52">Email first, secure payment next.</p>
          </div>
        </div>

        <form onSubmit={continueToCheckout} className="space-y-5">
          <label className="block text-sm font-medium text-mist/75" htmlFor="upgrade-email">
            License email
          </label>
          <input
            id="upgrade-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-base text-white outline-none transition placeholder:text-mist/30 focus:border-mint/60"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Continue to checkout
            {!loading ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
        </form>

        {error ? <p className="mt-5 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p> : null}
      </section>
    </div>
  );
}
