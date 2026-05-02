"use client";

import { useState } from "react";
import {
  Activity,
  BadgeIndianRupee,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Monitor,
  ReceiptText,
  ShieldCheck,
  Users
} from "lucide-react";
import OtpDeliveryNotice from "./OtpDeliveryNotice";
import { handleOtpPaste, normalizeOtpInput, OTP_MAX_LENGTH, OTP_PATTERN } from "../lib/otp-input";

const LICENSE_STATES = [
  "paid_lifetime",
  "free",
  "refunded",
  "chargeback",
  "banned_abuse"
];

export default function AdminDashboardClient() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState(null);
  const [step, setStep] = useState("email");
  const [dashboard, setDashboard] = useState(null);
  const [licenseForm, setLicenseForm] = useState({
    email: "",
    state: "paid_lifetime",
    maxDevices: "3",
    note: ""
  });
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
      setMessage("Admin email verified.");
      await loadDashboard(result.session.access_token);
      setStep("dashboard");
    });
  }

  async function loadDashboard(token = session?.access_token) {
    const response = await fetch("/api/admin/overview", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not load dashboard.");
    setDashboard(result);
  }

  async function updateLicense(event) {
    event.preventDefault();
    await run(async () => {
      const result = await postJson(
        "/api/admin/licenses/update",
        {
          email: licenseForm.email,
          state: licenseForm.state,
          maxDevices: Number(licenseForm.maxDevices),
          note: licenseForm.note
        },
        { Authorization: `Bearer ${session.access_token}` }
      );
      setMessage(result.message);
      setLicenseForm((current) => ({ ...current, note: "" }));
      await loadDashboard();
    });
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
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-mint">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Production backend
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-mist sm:text-5xl">
            Study Capture Admin
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">
            Verification-code protected operations dashboard for Supabase users, payments, licenses, devices, and Razorpay confirmations.
          </p>
        </div>
        {dashboard?.adminEmail ? (
          <button
            type="button"
            onClick={() => loadDashboard().catch((err) => setError(err.message))}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-mist transition hover:border-mint/50 hover:bg-mint/10 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Activity className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </button>
        ) : null}
      </div>

      {step === "email" ? (
        <AuthPanel
          title="Admin email"
          icon={Mail}
          onSubmit={sendOtp}
          loading={loading}
          buttonText="Send code"
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-14 w-full rounded-2xl border border-line bg-panel/80 px-4 py-4 text-base text-mist outline-none focus:border-mint/60"
            placeholder="admin@studycapture.co"
          />
        </AuthPanel>
      ) : null}

      {step === "otp" ? (
        <AuthPanel
          title="Verify code"
          icon={KeyRound}
          onSubmit={verifyOtp}
          loading={loading}
          buttonText="Open dashboard"
        >
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
            className="h-14 w-full rounded-2xl border border-line bg-panel/80 px-4 py-4 text-base tracking-[0.22em] text-mist outline-none focus:border-mint/60"
            placeholder="12345678"
            title="Enter the verification code from your email."
          />
        </AuthPanel>
      ) : null}

      {step === "dashboard" && dashboard ? (
        <div className="mt-8 space-y-8">
          <MetricGrid metrics={dashboard.metrics} />

          <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <LicenseUpdateForm
              value={licenseForm}
              onChange={setLicenseForm}
              onSubmit={updateLicense}
              loading={loading}
            />
            <RecentLicenses licenses={dashboard.recentLicenses} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RecentPayments payments={dashboard.recentPayments} />
            <RecentSubscriptions subscriptions={dashboard.recentSubscriptions} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RecentDevices devices={dashboard.recentDevices} />
          </div>
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
      className="mt-8 max-w-xl rounded-3xl border border-line bg-panel p-6 shadow-panel sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint/12 text-mint">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold text-mist">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong transition hover:bg-mint/85 disabled:opacity-65"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        {buttonText}
      </button>
    </form>
  );
}

function MetricGrid({ metrics }) {
  const items = [
    { label: "Users", value: metrics.users, icon: Users },
    { label: "Paid Payments", value: metrics.paidPayments, icon: ReceiptText },
    { label: "Pro Licenses", value: metrics.proLicenses, icon: ShieldCheck },
    { label: "Subscriptions", value: metrics.activeSubscriptions, icon: ShieldCheck },
    { label: "Active Devices", value: metrics.activeDevices, icon: Monitor },
    { label: "Gross Revenue", value: formatMoney(metrics.grossRevenue), icon: BadgeIndianRupee },
    { label: "Pending Payments", value: metrics.pendingPayments, icon: Activity }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-line bg-panel/80 p-5">
          <item.icon className="h-5 w-5 text-mint" aria-hidden="true" />
          <p className="mt-4 text-sm text-mist/50">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-mist">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function LicenseUpdateForm({ value, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-panel p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-mist">Update license</h2>
      <div className="mt-5 space-y-4">
        <input
          type="email"
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
          required
          className="w-full rounded-2xl border border-line bg-panel/80 px-4 py-3 text-sm text-mist outline-none focus:border-mint/60"
          placeholder="customer@example.com"
        />
        <select
          value={value.state}
          onChange={(event) => onChange({ ...value, state: event.target.value })}
          className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-mist outline-none focus:border-mint/60"
        >
          {LICENSE_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          max="20"
          value={value.maxDevices}
          onChange={(event) => onChange({ ...value, maxDevices: event.target.value })}
          className="w-full rounded-2xl border border-line bg-panel/80 px-4 py-3 text-sm text-mist outline-none focus:border-mint/60"
          placeholder="Max devices"
        />
        <textarea
          value={value.note}
          onChange={(event) => onChange({ ...value, note: event.target.value })}
          className="min-h-24 w-full rounded-2xl border border-line bg-panel/80 px-4 py-3 text-sm text-mist outline-none focus:border-mint/60"
          placeholder="Internal note"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-mint px-5 text-sm font-semibold text-strong transition hover:bg-mint/85 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Save license
      </button>
    </form>
  );
}

function RecentLicenses({ licenses }) {
  return (
    <DataPanel title="Recent licenses">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-mist/45">
            <tr>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Reference</th>
              <th className="pb-3 font-medium">State</th>
              <th className="pb-3 font-medium">Devices</th>
              <th className="pb-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {licenses.map((license) => (
              <tr key={license.id}>
                <td className="py-3 text-mist">{license.email}</td>
                <td className="py-3 text-mist/65">{license.license_ref || "-"}</td>
                <td className="py-3 text-mint">{license.state}</td>
                <td className="py-3 text-mist/65">{license.max_devices}</td>
                <td className="py-3 text-mist/50">{formatDate(license.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataPanel>
  );
}

function RecentPayments({ payments }) {
  return (
    <DataPanel title="Recent payments">
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-line bg-panel/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-mist">{payment.email}</p>
                <p className="mt-1 text-xs text-mist/45">{payment.provider_order_id}</p>
              </div>
              <span className="rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
                {payment.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-mist/70">{formatMoney(payment.amount)} · {payment.source || "website"} · {payment.reason || "direct"}</p>
            <p className="mt-1 text-xs text-mist/45">{formatDate(payment.paid_at || payment.created_at)}</p>
          </div>
        ))}
        {!payments.length ? <EmptyState /> : null}
      </div>
    </DataPanel>
  );
}

function RecentSubscriptions({ subscriptions }) {
  return (
    <DataPanel title="Recent subscriptions">
      <div className="space-y-3">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="rounded-2xl border border-line bg-panel/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-mist">{subscription.email}</p>
                <p className="mt-1 text-xs text-mist/45">{subscription.plan}</p>
              </div>
              <span className="rounded-full bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
                {subscription.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-mist/70">
              {formatMoney(subscription.amount)} · {subscription.provider || "razorpay"} · {subscription.lifetime_access ? "lifetime" : "limited"}
            </p>
            <p className="mt-1 text-xs text-mist/45">{formatDate(subscription.started_at || subscription.updated_at)}</p>
          </div>
        ))}
        {!subscriptions.length ? <EmptyState /> : null}
      </div>
    </DataPanel>
  );
}

function RecentDevices({ devices }) {
  return (
    <DataPanel title="Recent devices">
      <div className="space-y-3">
        {devices.map((device) => (
          <div key={device.id} className="rounded-2xl border border-line bg-panel/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel/70 text-mint">
                <Monitor className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-mist">{device.browser_name || "Browser"} · {device.os || "Unknown OS"}</p>
                <p className="mt-1 text-sm text-mist/58">{device.licenses?.email || "Unknown email"}</p>
                <p className="mt-1 text-xs text-mist/42">{formatDate(device.last_seen_at)}</p>
              </div>
            </div>
          </div>
        ))}
        {!devices.length ? <EmptyState /> : null}
      </div>
    </DataPanel>
  );
}

function DataPanel({ title, children }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-mist">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState() {
  return <p className="rounded-2xl border border-line bg-panel/70 p-4 text-sm text-mist/50">No records yet.</p>;
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
