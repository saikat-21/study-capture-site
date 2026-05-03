"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  EXTENSION_HANDOFF_KEY,
  getExtensionHandoff,
  sendExtensionActivation
} from "../lib/extension-handoff";
import { billingEmail } from "../lib/site";

const CHECKOUT_KEY = "studyCaptureCheckout";
const SUCCESS_KEY = "studyCapturePaymentSuccess";
const DEFAULT_PRICING = {
  amount: 49900,
  currency: "INR",
  public_price_inr: 499,
  strike_price_inr: 799
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const paymentCompletedRef = useRef(false);

  const source = searchParams.get("src") || "website";
  const reason = searchParams.get("reason") || "direct";
  const handoff = useMemo(() => getExtensionHandoff(searchParams), [searchParams]);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(CHECKOUT_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setEmail(parsed.email || "");
    } catch {
      setEmail("");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPricing() {
      setPricingLoading(true);
      try {
        const response = await fetch("/api/checkout/price", {
          signal: controller.signal
        });
        const result = await response.json();
        if (response.ok) {
          setPricing(result);
        } else {
          setPricing(DEFAULT_PRICING);
        }
      } catch (err) {
        if (err.name !== "AbortError") setPricing(DEFAULT_PRICING);
      } finally {
        if (!controller.signal.aborted) setPricingLoading(false);
      }
    }

    loadPricing();
    return () => controller.abort();
  }, []);

  const canPay = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const canStartPayment = canPay && !pricingLoading;
  const displayPrice =
    pricing.public_price_inr || DEFAULT_PRICING.public_price_inr;
  const originalPrice =
    pricing.strike_price_inr || DEFAULT_PRICING.strike_price_inr;

  async function startPayment() {
    setError("");
    setLoading(true);
    paymentCompletedRef.current = false;

    try {
      if (!canPay) {
        throw new Error("Start from the upgrade page with a valid email address.");
      }

      await loadRazorpayCheckout();

      const order = await postJson("/api/razorpay/create-order", {
        email,
        source,
        reason
      });

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Study Capture",
        description: "Study Capture Pro Lifetime",
        order_id: order.order_id,
        prefill: {
          email
        },
        notes: {
          email,
          source,
          reason,
          product: "Study Capture Pro Lifetime"
        },
        theme: {
          color: "#5FE0B7"
        },
        handler: async (response) => {
          paymentCompletedRef.current = true;
          try {
            const verification = await postJson("/api/razorpay/verify-payment", {
              email,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            let extensionHandoff = null;

            if (handoff.isExtensionSource) {
              extensionHandoff = await sendExtensionActivation({
                extensionId: handoff.extensionId,
                email: verification.email,
                activationGrant: verification.activationGrant
              });
              window.sessionStorage.setItem(
                EXTENSION_HANDOFF_KEY,
                JSON.stringify({
                  ...extensionHandoff,
                  attemptedAt: new Date().toISOString()
                })
              );
            }

            window.sessionStorage.setItem(
              SUCCESS_KEY,
              JSON.stringify({
                email: verification.email,
                activationGrant: verification.activationGrant,
                activationGrantExpiresAt: verification.activationGrantExpiresAt,
                source,
                extensionId: handoff.extensionId,
                extensionHandoff,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                paidAt: new Date().toISOString()
              })
            );

            const successQuery = new URLSearchParams();
            if (source) successQuery.set("src", source);
            if (handoff.extensionId) successQuery.set("extId", handoff.extensionId);
            router.push(`/success${successQuery.toString() ? `?${successQuery.toString()}` : ""}`);
          } catch (err) {
            const detail = err.message ? ` ${err.message}` : "";
            setError(
              `Payment completed, but license activation did not finish.${detail} Contact ${billingEmail} with payment ID ${response.razorpay_payment_id}.`
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!paymentCompletedRef.current) {
              setError("Payment cancelled. You have not been charged.");
            }
            setLoading(false);
          }
        }
      });

      checkout.on("payment.failed", (response) => {
        paymentCompletedRef.current = false;
        setError(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      checkout.open();
    } catch (err) {
      setError(buildCheckoutError(err));
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-3xl border border-line bg-panel/80 p-6 shadow-panel sm:p-8">
        <p className="text-sm font-semibold text-mint">Checkout</p>
        <div className="mt-5 inline-flex rounded-full border border-amber/25 bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
          Introductory offer
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-mist">Study Capture Pro Lifetime</h1>
        <div className="mt-7 flex flex-wrap items-end gap-3">
          <span className="text-5xl font-semibold text-mist">₹{displayPrice}</span>
          <span className="pb-2 text-2xl font-semibold text-mist/38 line-through">₹{originalPrice}</span>
          <span className="pb-2 text-sm text-mist/55">
            payable today · one-time payment · lifetime Pro access
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-mint">
          Limited-time introductory price for early users.
        </p>
        <div className="mt-8 rounded-2xl border border-mint/20 bg-mint/10 p-4">
          <div className="flex gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
            <div>
              <p className="font-semibold text-mist">License email</p>
              <p className="mt-1 text-sm text-mist/65">{email || "No email found."}</p>
            </div>
          </div>
        </div>
        {!canPay ? (
          <Link
            href={buildUpgradeReturnHref({ source, reason, extensionId: handoff.extensionId })}
            className="mt-6 inline-flex text-sm font-semibold text-mint transition hover:text-mist"
          >
            Enter email on upgrade page
          </Link>
        ) : null}
      </div>

      <div className="rounded-3xl border border-line bg-panel p-6 shadow-panel sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/12 text-mint">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-7 text-3xl font-semibold text-mist">Pay securely with Razorpay</h2>
        <p className="mt-4 max-w-xl text-base leading-8 text-mist/65">
          Razorpay Checkout supports UPI, credit card, debit card, and netbanking. Your payment order is created on the server and verified after checkout.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-panel/80 p-4 text-sm leading-6 text-mist/70">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
          <span>Secure payment powered by Razorpay. Your license will be linked to this email.</span>
        </div>
        {error ? <p className="mt-5 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p> : null}
        <button
          type="button"
          onClick={startPayment}
          disabled={!canStartPayment || loading}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong transition hover:-translate-y-0.5 hover:bg-mint/85 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {pricingLoading ? "Preparing secure checkout" : `Pay ₹${displayPrice} securely`}
        </button>
      </div>
    </section>
  );
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "Request failed.");
    error.code = result.code;
    error.details = result.details;
    throw error;
  }
  return result;
}

function buildCheckoutError(error) {
  if (error?.code === "already_pro") {
    return "This email already has Study Capture Pro. Open Activate Pro and verify the same email to restore access.";
  }

  return error.message || "Request failed.";
}

function buildUpgradeReturnHref({ source, reason, extensionId }) {
  const params = new URLSearchParams();
  params.set("src", source || "website");
  if (reason && reason !== "direct") params.set("reason", reason);
  if (extensionId) params.set("extId", extensionId);
  return `/upgrade?${params.toString()}`;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}
