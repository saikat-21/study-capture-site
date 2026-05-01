import Link from "next/link";
import { CheckCircle2, CreditCard, Download, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supportEmail, supportMailto } from "../../lib/site";

const lastUpdated = "April 28, 2026";

const trustBadges = [
  "No selling of data",
  "Local-first processing",
  "Secure payments",
  "User-controlled exports"
];

const policySections = [
  {
    title: "1. Information We May Collect",
    body: "Depending on features used, we may collect:",
    items: [
      "Email address for Pro purchases, restore access, support, and account verification",
      "Authentication data such as OTP verification status",
      "Support messages you voluntarily send us",
      "Purchase or subscription status"
    ],
    note: "We do not collect unnecessary personal information."
  },
  {
    title: "2. Local Device Storage",
    body: "Study Capture stores the following locally on your device or browser when required for functionality:",
    items: [
      "Saved pages",
      "Generated PDFs",
      "Capture history",
      "Preferences and settings",
      "Pro activation state"
    ],
    note: "Your saved study material is primarily processed locally unless a cloud or account feature explicitly requires server verification."
  },
  {
    title: "3. Website Content Access",
    body: "When you use capture features, the extension accesses webpage content only to generate screenshots, PNG exports, PDF exports, or reading capture results requested by you.",
    note: "We do not browse pages on your behalf."
  },
  {
    title: "4. Payments",
    body: "Pro purchases may be processed through trusted third-party payment providers such as Razorpay or equivalent processors.",
    note: "We do not store your card or banking details."
  },
  {
    title: "5. How We Use Data",
    body: "We use data only to:",
    items: [
      "Deliver extension features",
      "Verify Pro purchases",
      "Restore Pro access across your devices",
      "Improve reliability",
      "Provide customer support",
      "Prevent fraud or abuse"
    ]
  },
  {
    title: "6. Data Sharing",
    body: "We do not sell personal data.",
    items: [
      "Payment processing",
      "Authentication",
      "Hosting infrastructure",
      "Legal compliance"
    ],
    note: "We do not transfer user data to third parties except where required for the purposes above."
  },
  {
    title: "7. Security",
    body: "We use reasonable technical and administrative safeguards to protect account and purchase-related information."
  },
  {
    title: "8. Your Choices",
    body: "You stay in control of Study Capture on your browser.",
    items: [
      "You may uninstall the extension anytime.",
      "You may clear locally stored extension data from your browser settings.",
      "You may contact us for account or privacy assistance."
    ]
  }
];

export const metadata = {
  title: {
    absolute: "Privacy Policy | Study Capture"
  },
  description:
    "Study Capture Privacy Policy covering local storage, Pro accounts, payments, and user data handling."
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-10 text-mist sm:py-14">
      <article className="mx-auto max-w-5xl">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Privacy Policy
            </p>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-tight text-mist sm:text-5xl">
              Study Capture keeps your study workflow personal, practical, and under your control.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-mist/68">
              Study Capture helps users save webpage content for personal study, research, note-taking, and offline reading.
            </p>
            <p className="mt-5 text-sm text-mist/50">Last updated: {lastUpdated}</p>
          </div>

          <div className="rounded-3xl border border-line bg-panel/80 p-5 shadow-panel sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex min-h-20 items-start gap-3 rounded-2xl border border-line bg-ink/45 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                  <span className="text-sm font-semibold leading-6 text-mist">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <PrivacySignal
            icon={<Download className="h-5 w-5" aria-hidden="true" />}
            title="Local-first"
            text="Saved study material stays primarily on your browser unless server verification is needed."
          />
          <PrivacySignal
            icon={<LockKeyhole className="h-5 w-5" aria-hidden="true" />}
            title="Account light"
            text="Email OTP and purchase status are used to restore Pro access without passwords."
          />
          <PrivacySignal
            icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
            title="Payment safe"
            text="Banking and card details are handled by trusted payment processors."
          />
        </section>

        <section className="mt-12 space-y-4">
          {policySections.map((section) => (
            <PolicySection key={section.title} section={section} />
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-mint/20 bg-mint/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-mint">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-mist">9. Contact</h2>
              <p className="mt-3 max-w-2xl text-base leading-8 text-mist/70">
                For privacy or support questions, contact{" "}
                <a className="font-semibold text-mint" href={supportMailto}>
                  {supportEmail}
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-14 flex flex-col gap-4 border-t border-line py-8 text-sm text-mist/50 sm:flex-row sm:items-center sm:justify-between">
          <p>Study Capture</p>
          <div className="flex flex-wrap gap-4">
            <Link className="transition hover:text-mist" href="/contact">
              Contact
            </Link>
            <Link className="transition hover:text-mist" href="/privacy">
              Privacy
            </Link>
            <Link className="transition hover:text-mist" href="/terms">
              Terms
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

function PrivacySignal({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-line bg-panel/70 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-panel/85 text-mint">
        {icon}
      </div>
      <h2 className="mt-5 text-lg font-semibold text-mist">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-mist/62">{text}</p>
    </div>
  );
}

function PolicySection({ section }) {
  return (
    <section className="rounded-3xl border border-line bg-panel/70 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-mist">{section.title}</h2>
      <p className="mt-4 text-base leading-8 text-mist/70">{section.body}</p>
      {section.items ? (
        <ul className="mt-5 grid gap-3 text-sm leading-7 text-mist/72 sm:grid-cols-2">
          {section.items.map((item) => (
            <li key={item} className="flex gap-3">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.note ? (
        <p className="mt-5 rounded-2xl border border-mint/15 bg-mint/8 px-4 py-3 text-sm leading-7 text-mist/72">
          {section.note}
        </p>
      ) : null}
    </section>
  );
}
