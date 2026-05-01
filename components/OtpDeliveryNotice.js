"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck, RotateCw } from "lucide-react";

const RESEND_DELAY_SECONDS = 30;

export default function OtpDeliveryNotice({ email, loading, onResend }) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    setSecondsLeft(RESEND_DELAY_SECONDS);
  }, [email]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function resendCode() {
    if (loading || secondsLeft > 0) return;
    const sent = await onResend();
    if (sent) setSecondsLeft(RESEND_DELAY_SECONDS);
  }

  return (
    <div className="rounded-2xl border border-mint/20 bg-mint/10 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint/14 text-mint">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-mist">Code sent to your email.</p>
            <p className="mt-1 text-sm leading-6 text-mist/68">
              Check Inbox or Spam/Junk folders if it {"doesn't"} arrive shortly.
            </p>
            <p className="mt-2 break-all text-xs font-medium text-mist/45">{email}</p>
          </div>
        </div>

        {secondsLeft > 0 ? (
          <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-line px-3 text-xs font-semibold text-mist/58">
            Resend in {secondsLeft}s
          </span>
        ) : (
          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-mint/30 px-3 text-xs font-semibold text-mint transition hover:bg-mint/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />}
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
