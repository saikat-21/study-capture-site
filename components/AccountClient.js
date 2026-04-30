"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, KeyRound, Loader2, Mail, Monitor, ReceiptText, ShieldCheck } from "lucide-react";
import OtpDeliveryNotice from "./OtpDeliveryNotice";
import { handleOtpPaste, normalizeOtpInput, OTP_MAX_LENGTH, OTP_PATTERN } from "../lib/otp-input";
import { billingEmail, billingMailto, supportEmail, supportMailto } from "../lib/site";

export default function AccountClient() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(event) {
    event?.preventDefault();
    return run(async () => {
      await postJson("/api/auth/send-otp", { email });
      setOtp("");
      setStep("otp");
    });
  }

  async function verifyOtp(event) {
    event.preventDefault();
    await run(async () => {
      const result = await postJson("/api/auth/verify-otp", { email, otp });
      setSession(result.session);
      const accountData = await loadAccount(result.session.access_token);
      setAccount(accountData);
      setStep("account");
      setMessage("Logged in.");
    });
  }

  async function refreshAccount() {
    await run(async () => {
      const accountData = await loadAccount(session?.access_token);
      setAccount(accountData);
      setMessage("Account refreshed.");
    });
  }

  async function loadAccount(token) {
    const response = await fetch("/api/account/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not load account.");
    return result;
  }

  async function run(action) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await action();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-mint">Account</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Account login</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">
            Login or create your account with an email verification code. No password needed.
          </p>
        </div>
        {step === "account" ? (
          <button
            type="button"
            onClick={refreshAccount}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold text-white transition hover:border-mint/50 hover:bg-white/[0.06] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </button>
        ) : null}
      </div>

      {step === "email" ? (
        <AuthCard title="Email" icon={Mail} onSubmit={sendOtp} loading={loading} buttonText="Send code">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-base text-white outline-none focus:border-mint/60"
            placeholder="you@example.com"
          />
        </AuthCard>
      ) : null}

      {step === "otp" ? (
        <AuthCard title="Enter verification code" icon={KeyRound} onSubmit={verifyOtp} loading={loading} buttonText="Login">
          <OtpDeliveryNotice email={email} loading={loading} onResend={sendOtp} />
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={OTP_PATTERN}
            value={otp}
            onChange={(event) => setOtp(normalizeOtpInput(event.target.value))}
            onPaste={(event) => handleOtpPaste(event, setOtp)}
            required
            maxLength={OTP_MAX_LENGTH}
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-base tracking-[0.22em] text-white outline-none focus:border-mint/60"
            placeholder="12345678"
            title="Enter the verification code from your email."
          />
        </AuthCard>
      ) : null}

      {step === "account" && account ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <section className="rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel sm:p-8">
            <p className="text-sm text-mist/50">Signed in as</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{account.email}</h2>
            <div className="mt-7 rounded-2xl border border-mint/20 bg-mint/10 p-5">
              <p className="text-sm text-mist/58">Plan</p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {account.plan === "pro" ? "Pro Lifetime" : "Free"}
              </p>
              <p className="mt-3 text-sm text-mist/62">
                License state: {account.licenseState}
              </p>
              <p className="mt-1 text-sm text-mist/62">
                Subscription: {account.subscription?.status || "none"}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/upgrade"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mint px-5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Upgrade Pro
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/manage-license"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 px-5 text-sm font-semibold text-white transition hover:border-mint/50 hover:bg-white/[0.06]"
              >
                Manage devices
              </Link>
            </div>
            <div className="mt-6 space-y-2 text-sm text-mist/58">
              <p>Product help: <a className="text-mint" href={supportMailto}>{supportEmail}</a></p>
              <p>Billing, refunds, invoices: <a className="text-mint" href={billingMailto}>{billingEmail}</a></p>
            </div>
          </section>

          <div className="space-y-6">
            <RecordPanel title="Active devices" icon={Monitor}>
              {account.activeDevices.length ? (
                <div className="space-y-3">
                  {account.activeDevices.map((device) => (
                    <div key={device.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="font-semibold text-white">{device.browser_name || "Browser"}</p>
                      <p className="mt-1 text-sm text-mist/58">{device.os || "Unknown OS"} · v{device.extension_version || "-"}</p>
                      <p className="mt-1 text-xs text-mist/42">Last seen {formatDate(device.last_seen_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No active devices yet.</EmptyState>
              )}
            </RecordPanel>

            <RecordPanel title="Recent payments" icon={ReceiptText}>
              {account.payments.length ? (
                <div className="space-y-3">
                  {account.payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-white">{formatMoney(payment.amount)}</p>
                        <span className="rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">{payment.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-mist/58">{payment.provider_order_id || payment.provider_payment_id || "Payment"}</p>
                      <p className="mt-1 text-xs text-mist/42">{formatDate(payment.paid_at || payment.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No payments yet.</EmptyState>
              )}
            </RecordPanel>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-6 rounded-2xl bg-mint/10 p-4 text-sm text-mint">{message}</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p> : null}
    </section>
  );
}

function AuthCard({ title, icon: Icon, onSubmit, loading, buttonText, children }) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint/12 text-mint">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-65"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        {buttonText}
      </button>
    </form>
  );
}

function RecordPanel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-mint">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({ children }) {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-mist/58">{children}</p>;
}

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Request failed.");
  return result;
}

function formatMoney(amount) {
  const paise = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(paise / 100);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
