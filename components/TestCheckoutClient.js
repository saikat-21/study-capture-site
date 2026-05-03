"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

const DEFAULT_TEST_EMAIL = "saikat.a@icloud.com";

export default function TestCheckoutClient() {
  const [email, setEmail] = useState(DEFAULT_TEST_EMAIL);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const paymentCompletedRef = useRef(false);

  const canPay = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  async function startPayment(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    paymentCompletedRef.current = false;

    try {
      if (!canPay) {
        throw new Error("Enter a valid email address.");
      }

      await loadRazorpayCheckout();

      const order = await postJson("/api/razorpay/create-test-order", {
        email
      });

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Study Capture",
        description: "Temporary Pro flow test",
        order_id: order.order_id,
        prefill: {
          email
        },
        notes: {
          email,
          source: "temporary_test_checkout",
          product: "Study Capture Pro Lifetime"
        },
        theme: {
          color: "#5FE0B7"
        },
        handler: (response) => {
          paymentCompletedRef.current = true;
          setMessage(
            `Payment completed. Razorpay payment ${response.razorpay_payment_id} will be finalized by the webhook. Check Vercel logs for pro_welcome_email_attempted.`
          );
          setLoading(false);
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
      setError(err.message || "Could not start test checkout.");
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-line bg-panel p-6 shadow-panel sm:p-8">
      <p className="text-sm font-semibold text-mint">Temporary internal test</p>
      <h1 className="mt-4 text-4xl font-semibold text-mist">Study Capture Pro test checkout</h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-mist/65">
        Use this page to run a ₹10 Razorpay payment through the production webhook,
        license activation, and Pro welcome email path.
      </p>

      <div className="mt-6 rounded-2xl border border-amber/25 bg-amber/10 p-4 text-sm leading-6 text-amber">
        This page is not linked from the public site. Public Pro pricing remains unchanged.
      </div>

      <form className="mt-8 space-y-5" onSubmit={startPayment}>
        <label className="block">
          <span className="text-sm font-semibold text-mist/75">Test license email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-14 w-full rounded-2xl border border-line bg-ink/35 px-4 text-base text-mist outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
            <div>
              <p className="font-semibold text-mist">Pay ₹10 with Razorpay</p>
              <p className="mt-1 text-sm leading-6 text-mist/65">
                The server creates a Razorpay order for ₹10 and writes
                <span className="font-semibold text-mist"> notes.email</span> so the webhook can
                create the license and send the welcome email.
              </p>
            </div>
          </div>
        </div>

        {message ? (
          <p className="rounded-2xl border border-mint/20 bg-mint/10 p-4 text-sm leading-6 text-mint">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-coral/10 p-4 text-sm leading-6 text-coral">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canPay || loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong transition hover:-translate-y-0.5 hover:bg-mint/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Pay ₹10
        </button>
      </form>
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
    throw new Error(result.message || "Request failed.");
  }

  return result;
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
