"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Monitor,
  ReceiptText,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { handleOtpPaste, normalizeOtpInput, OTP_MAX_LENGTH, OTP_PATTERN } from "../lib/otp-input";

export default function AdminDebugClient() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState(null);
  const [step, setStep] = useState("email");
  const [debugData, setDebugData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(event) {
    event.preventDefault();
    await run(async () => {
      const result = await postJson("/api/auth/send-otp", { email });
      setStep("otp");
      setMessage(result.message);
    });
  }

  async function verifyOtp(event) {
    event.preventDefault();
    await run(async () => {
      const result = await postJson("/api/auth/verify-otp", { email, otp });
      setSession(result.session);
      const data = await loadDebug(result.session.access_token);
      setDebugData(data);
      setStep("debug");
      setMessage("Founder debug access verified.");
    });
  }

  async function refreshDebug() {
    await run(async () => {
      const data = await loadDebug(session?.access_token);
      setDebugData(data);
      setMessage("Debug data refreshed.");
    });
  }

  async function loadDebug(token) {
    const response = await fetch("/api/admin/debug", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not load debug data.");
    return result;
  }

  async function run(action) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-mint">Study Capture Admin</Link>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Founder Debug</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">
            Founder-only view for recent payments, generated licenses, and browser/device activations.
          </p>
        </div>
        {step === "debug" ? (
          <button
            type="button"
            onClick={refreshDebug}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold text-white transition hover:border-mint/50 hover:bg-white/[0.06] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </button>
        ) : null}
      </div>

      {step === "email" ? (
        <AuthPanel title="Founder email" icon={Mail} onSubmit={sendOtp} loading={loading} buttonText="Send code">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-base text-white outline-none focus:border-mint/60"
            placeholder="founder@studycapture.co"
          />
        </AuthPanel>
      ) : null}

      {step === "otp" ? (
        <AuthPanel title="Verify code" icon={KeyRound} onSubmit={verifyOtp} loading={loading} buttonText="Open debug">
          <p className="text-sm text-mist/58">
            Verification code sent to <span className="font-semibold text-white">{email}</span>
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={OTP_PATTERN}
            value={otp}
            onChange={(event) => setOtp(normalizeOtpInput(event.target.value))}
            onPaste={(event) => handleOtpPaste(event, setOtp)}
            required
            maxLength={OTP_MAX_LENGTH}
            className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-base tracking-[0.22em] text-white outline-none focus:border-mint/60"
            placeholder="12345678"
            title="Enter the verification code from your email."
          />
        </AuthPanel>
      ) : null}

      {step === "debug" && debugData ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Payments" value={debugData.recentPayments.length} icon={ReceiptText} />
            <Metric label="Licenses" value={debugData.recentLicenses.length} icon={ShieldCheck} />
            <Metric label="Devices" value={debugData.recentDeviceActivations.length} icon={Monitor} />
            <Metric label="Events" value={debugData.recentActivationEvents.length} icon={Activity} />
          </div>

          <DebugPanel title="Recent payments" icon={ReceiptText}>
            {debugData.recentPayments.map((payment) => (
              <DebugRow
                key={payment.id}
                title={payment.email}
                badge={payment.status}
                meta={`${formatMoney(payment.amount)} · ${payment.provider_order_id || "no order"} · ${formatDate(payment.paid_at || payment.created_at)}`}
                detail={`license=${payment.licenses?.license_ref || "-"} payment=${payment.provider_payment_id || "-"}`}
              />
            ))}
            {!debugData.recentPayments.length ? <EmptyState /> : null}
          </DebugPanel>

          <DebugPanel title="Recent licenses" icon={ShieldCheck}>
            {debugData.recentLicenses.map((license) => (
              <DebugRow
                key={license.id}
                title={license.email}
                badge={license.state}
                meta={`${license.license_ref || "no ref"} · max ${license.max_devices} devices · ${formatDate(license.updated_at)}`}
                detail={`subscription=${license.subscriptions?.[0]?.status || "none"} activated=${formatDate(license.activated_at)}`}
              />
            ))}
            {!debugData.recentLicenses.length ? <EmptyState /> : null}
          </DebugPanel>

          <DebugPanel title="Recent device activations" icon={Monitor}>
            {debugData.recentDeviceActivations.map((device) => (
              <DebugRow
                key={device.id}
                title={device.licenses?.email || "Unknown email"}
                badge={device.deactivated_at ? "inactive" : "active"}
                meta={`${device.browser_name || "browser"} · ${device.os || "os"} · v${device.extension_version || "-"} · ${formatDate(device.last_seen_at)}`}
                detail={`license=${device.licenses?.license_ref || "-"} firstSeen=${formatDate(device.first_seen_at)}`}
              />
            ))}
            {!debugData.recentDeviceActivations.length ? <EmptyState /> : null}
          </DebugPanel>

          <DebugPanel title="Activation events" icon={Activity}>
            {debugData.recentActivationEvents.map((event) => (
              <DebugRow
                key={event.id}
                title={event.email || "No email"}
                badge={event.success ? "success" : "failed"}
                meta={`${event.event_type} · ${formatDate(event.created_at)}`}
                detail={event.metadata ? JSON.stringify(event.metadata) : "-"}
              />
            ))}
            {!debugData.recentActivationEvents.length ? <EmptyState /> : null}
          </DebugPanel>
        </div>
      ) : null}

      {message ? <p className="mt-6 rounded-2xl bg-mint/10 p-4 text-sm text-mint">{message}</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p> : null}
    </section>
  );
}

function AuthPanel({ title, icon: Icon, onSubmit, loading, buttonText, children }) {
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

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
      <Icon className="h-5 w-5 text-mint" aria-hidden="true" />
      <p className="mt-4 text-sm text-mist/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DebugPanel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-mint">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function DebugRow({ title, badge, meta, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-mist/60">{meta}</p>
        </div>
        <span className="w-fit rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
          {badge}
        </span>
      </div>
      <p className="mt-2 break-words font-mono text-xs text-mist/42">{detail}</p>
    </div>
  );
}

function EmptyState() {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-mist/55">No records yet.</p>;
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
