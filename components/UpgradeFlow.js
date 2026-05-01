"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";

const CHECKOUT_KEY = "studyCaptureCheckout";
const DEFAULT_PRICING = {
  test_mode: false,
  paid_price_inr: 499,
  public_price_inr: 499,
  original_price_inr: 799
};

export default function UpgradeFlow() {
  const searchParams = useSearchParams();
  const query = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );
  const testMode = query.get("test") || "";
  const testToken = query.get("token") || "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPricing() {
      if (!testMode && !testToken) {
        setPricing(DEFAULT_PRICING);
        return;
      }

      try {
        const pricingParams = new URLSearchParams();
        if (testMode) pricingParams.set("test", testMode);
        if (testToken) pricingParams.set("token", testToken);
        const response = await fetch(
          `/api/checkout/price?${pricingParams.toString()}`,
          { signal: controller.signal }
        );
        const result = await response.json();
        if (response.ok) {
          setPricing(result);
        } else {
          setPricing(DEFAULT_PRICING);
        }
      } catch (err) {
        if (err.name !== "AbortError") setPricing(DEFAULT_PRICING);
      }
    }

    loadPricing();
    return () => controller.abort();
  }, [testMode, testToken]);

  const displayPrice = pricing.test_mode
    ? pricing.paid_price_inr
    : pricing.paid_price_inr || pricing.public_price_inr || DEFAULT_PRICING.paid_price_inr;
  const originalPrice = pricing.original_price_inr || DEFAULT_PRICING.original_price_inr;

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

    const { params: checkoutParams, search } = getCurrentUpgradeSearch(query);
    const checkoutTarget = `/checkout${search}`;

    window.sessionStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({
        email: normalizedEmail,
        source: checkoutParams.get("src") || "website",
        reason: checkoutParams.get("reason") || "direct",
        extensionId: checkoutParams.get("extId") || "",
        enteredAt: new Date().toISOString()
      })
    );

    console.log("upgrade params =", search || window.location.search);
    console.log("checkout redirect =", checkoutTarget);
    window.location.assign(checkoutTarget);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
      <section className="rounded-3xl border border-line bg-panel/80 p-6 shadow-panel sm:p-8">
        <p className="text-sm font-semibold text-mint">Study Capture Pro Lifetime</p>
        {pricing.test_mode ? (
          <div className="mt-5 rounded-2xl border border-mint/25 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint">
            Founder live test mode — ₹{pricing.paid_price_inr}
          </div>
        ) : (
          <div className="mt-5 inline-flex rounded-full border border-amber/25 bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
            Introductory offer
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <h1 className="text-5xl font-semibold text-mist">₹{displayPrice}</h1>
          {!pricing.test_mode ? (
            <span className="pb-2 text-2xl font-semibold text-mist/38 line-through">₹{originalPrice}</span>
          ) : null}
          <p className="pb-2 text-sm font-medium text-mist/58">one-time payment · lifetime Pro access</p>
        </div>
        {!pricing.test_mode ? (
          <p className="mt-3 text-sm font-medium text-mint">
            Limited-time introductory price for early users.
          </p>
        ) : null}
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

      <section className="rounded-3xl border border-line bg-panel p-6 shadow-panel sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint/12 text-mint">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-mist">Start with your email</h2>
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
            className="h-14 w-full rounded-2xl border border-line bg-panel/80 px-4 py-4 text-base text-mist outline-none transition placeholder:text-mist/30 focus:border-mint/60"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong transition hover:-translate-y-0.5 hover:bg-panel disabled:cursor-not-allowed disabled:opacity-65"
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

function getCurrentUpgradeSearch(fallbackParams) {
  if (typeof window === "undefined") {
    const params = new URLSearchParams(fallbackParams.toString());
    const search = params.toString() ? `?${params.toString()}` : "";
    return { params, search };
  }

  const liveSearch = window.location.search || "";
  const params = new URLSearchParams(liveSearch);
  if (liveSearch) return { params, search: liveSearch };

  const fallback = new URLSearchParams(fallbackParams.toString());
  const search = fallback.toString() ? `?${fallback.toString()}` : "";
  return { params: fallback, search };
}
