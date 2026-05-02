"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  EXTENSION_HANDOFF_KEY,
  getExtensionHandoff,
  sendExtensionActivation
} from "../lib/extension-handoff";
import { contactMailto } from "../lib/site";

const SUCCESS_KEY = "studyCapturePaymentSuccess";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState(null);
  const [handoffStatus, setHandoffStatus] = useState(null);
  const handoffAttemptedRef = useRef(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SUCCESS_KEY);
    const handoffStored = window.sessionStorage.getItem(EXTENSION_HANDOFF_KEY);
    if (handoffStored) {
      try {
        setHandoffStatus(JSON.parse(handoffStored));
      } catch {
        setHandoffStatus(null);
      }
    }
    if (!stored) return;

    try {
      setPayment(JSON.parse(stored));
    } catch {
      setPayment(null);
    }
  }, []);

  useEffect(() => {
    if (!payment?.email || !payment?.activationGrant) return;
    const handoff = getExtensionHandoff(searchParams);
    const extensionId = handoff.extensionId || payment.extensionId;
    if (payment.source !== "extension" && !handoff.isExtensionSource) return;
    if (!extensionId) {
      handoffAttemptedRef.current = true;
      setHandoffStatus({
        ok: false,
        skipped: true,
        message: "Open Study Capture and click Activate Pro to finish activation."
      });
      return;
    }
    if (handoffStatus?.ok || handoffAttemptedRef.current) return;

    let cancelled = false;
    handoffAttemptedRef.current = true;
    setHandoffStatus({ ok: false, pending: true, message: "Activating Study Capture extension..." });
    sendExtensionActivation({
      extensionId,
      email: payment.email,
      activationGrant: payment.activationGrant
    }).then((result) => {
      if (cancelled) return;
      const next = {
        ...result,
        attemptedAt: new Date().toISOString()
      };
      setHandoffStatus(next);
      window.sessionStorage.setItem(EXTENSION_HANDOFF_KEY, JSON.stringify(next));
    });

    return () => {
      cancelled = true;
    };
  }, [handoffStatus?.ok, payment, searchParams]);

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-line bg-panel p-7 shadow-panel sm:p-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/12 text-mint">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-8 text-4xl font-semibold leading-tight text-mist sm:text-5xl">
        Excellent choice — welcome to Study Capture Pro.
      </h1>
      <div className="mt-6 rounded-2xl border border-mint/20 bg-mint/10 p-5">
        <p className="text-sm text-mist/58">Pro active for</p>
        <p className="mt-1 font-semibold text-mist">{payment?.email || "your license email"}</p>
      </div>
      <div className="mt-8 rounded-2xl border border-line bg-panel/80 p-5">
        <h2 className="font-semibold text-mist">Next steps</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-mist/70">
          {payment?.source === "extension" ? (
            <>
              <li>1. Return to the Study Capture extension</li>
              <li>2. Your Pro access should refresh automatically</li>
              <li>3. If needed, click Activate Pro and use the same email</li>
            </>
          ) : (
            <>
              <li>1. Install extension</li>
              <li>2. Open extension</li>
              <li>3. Click Activate Pro</li>
              <li>4. Use the same email</li>
            </>
          )}
        </ol>
      </div>
      {payment?.source === "extension" || handoffStatus ? (
        <div className="mt-6 rounded-2xl border border-line bg-panel/80 p-5">
          <h2 className="font-semibold text-mist">Extension activation</h2>
          <p className={`mt-2 text-sm leading-6 ${handoffStatus?.ok ? "text-mint" : "text-mist/68"}`}>
            {handoffStatus?.pending
              ? "Activating Study Capture extension..."
              : handoffStatus?.ok
                ? "Study Capture Pro is active in your extension."
                : handoffStatus?.message || "Open Study Capture and click Activate Pro to finish activation."}
          </p>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/install"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong transition hover:-translate-y-0.5 hover:bg-mint/85"
        >
          Install extension
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={contactMailto}
          className="inline-flex h-12 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-mist transition hover:border-mint/50 hover:bg-mint/10"
        >
          Contact support
        </a>
      </div>
    </section>
  );
}
