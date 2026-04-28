"use client";

import { useState } from "react";
import { Check, Loader2, Monitor, Trash2 } from "lucide-react";
import OtpDeliveryNotice from "./OtpDeliveryNotice";
import { handleOtpPaste, normalizeOtpInput, OTP_MAX_LENGTH, OTP_PATTERN } from "../lib/otp-input";

export default function ManageLicenseClient() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);
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
      setMessage("Email verified.");
      await loadStatus(result.session.access_token);
      setStep("manage");
    });
  }

  async function loadStatus(token = session?.access_token) {
    const response = await fetch("/api/license/status", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not load license.");
    setStatus(result);
  }

  async function removeDevice(deviceRecordId) {
    await run(async () => {
      await postJson(
        "/api/license/deactivate-device",
        { deviceRecordId },
        { Authorization: `Bearer ${session.access_token}` }
      );
      await loadStatus();
      setMessage("Device removed.");
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
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-panel sm:p-8">
          <p className="text-sm font-semibold text-mint">Manage License</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Your Pro devices</h1>
          <p className="mt-5 text-base leading-8 text-mist/65">
            Sign in with an email verification code to review active browser/device activations and remove old ones.
          </p>
          <div className="mt-7 rounded-2xl border border-mint/20 bg-mint/10 p-4 text-sm leading-7 text-mist/72">
            Study Capture Pro supports up to 3 active personal browsers/devices.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101A20] p-6 shadow-panel sm:p-8">
          {step === "email" ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <label className="block text-sm font-medium text-mist/75" htmlFor="manage-email">
                License email
              </label>
              <input
                id="manage-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-base text-white outline-none focus:border-mint/60"
                placeholder="you@example.com"
              />
              <ActionButton loading={loading}>Send code</ActionButton>
            </form>
          ) : null}

          {step === "otp" ? (
            <form onSubmit={verifyOtp} className="space-y-5">
              <OtpDeliveryNotice email={email} loading={loading} onResend={sendOtp} />
              <label className="block text-sm font-medium text-mist/75" htmlFor="manage-otp">
                Verification code
              </label>
              <input
                id="manage-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={OTP_PATTERN}
                value={otp}
                onChange={(event) => setOtp(normalizeOtpInput(event.target.value))}
                onPaste={(event) => handleOtpPaste(event, setOtp)}
                required
                maxLength={OTP_MAX_LENGTH}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-base tracking-[0.22em] text-white outline-none focus:border-mint/60"
                placeholder="12345678"
                title="Enter the verification code from your email."
              />
              <ActionButton loading={loading}>Verify and manage</ActionButton>
            </form>
          ) : null}

          {step === "manage" && status ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-mist/50">Plan status</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    {status.plan === "pro" ? "Pro Lifetime" : "Free"}
                  </h2>
                  <p className="mt-1 text-sm text-mist/55">License state: {status.licenseState}</p>
                </div>
                <span className="rounded-full bg-mint/12 px-4 py-2 text-sm font-semibold text-mint">
                  {status.activeDeviceCount}/{status.maxDevices} active
                </span>
              </div>

              <div className="mt-8 space-y-3">
                {status.activeDevices.length ? (
                  status.activeDevices.map((device) => (
                    <div key={device.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-mint">
                            <Monitor className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div>
                            <h3 className="font-semibold text-white">{device.browser_name || "Browser"}</h3>
                            <p className="mt-1 text-sm text-mist/55">{device.os || "Unknown OS"}</p>
                            <p className="mt-1 text-xs text-mist/40">
                              Last seen {formatDate(device.last_seen_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDevice(device.id)}
                          disabled={loading}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-coral/30 px-4 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Remove device
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm text-mist/60">
                    No active devices yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-5 rounded-2xl bg-mint/10 p-4 text-sm text-mint">{message}</p> : null}
          {error ? <p className="mt-5 rounded-2xl bg-coral/10 p-4 text-sm text-coral">{error}</p> : null}
        </div>
      </div>
    </section>
  );
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

function ActionButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-65"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
