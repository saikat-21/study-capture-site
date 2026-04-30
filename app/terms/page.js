import { AlertCircle, CreditCard, Mail, ShieldCheck } from "lucide-react";
import {
  billingEmail,
  billingMailto,
  supportEmail,
  supportMailto
} from "../../lib/site";

const lastUpdated = "April 30, 2026";

const sections = [
  {
    title: "1. Use of Service",
    body: "Study Capture is a browser extension for saving webpage content into screenshots, PDFs, and Study Books for personal study, research, note-taking, and offline reading.",
    items: [
      "You must only capture content you are allowed to save.",
      "You must not use Study Capture for illegal, restricted, harmful, or rights-violating activity.",
      "You are responsible for how you use exported files after they are created."
    ]
  },
  {
    title: "2. License Grant",
    body: "When you purchase Study Capture Pro, you receive lifetime Pro access for your own use, tied to the email used at purchase.",
    items: [
      "Your license is personal and non-transferable.",
      "You may not resell, share, sublicense, rent, or commercially redistribute Pro access.",
      "Study Capture remains owned by its creator; purchasing Pro gives you access rights, not ownership of the product or code."
    ]
  },
  {
    title: "3. Device Limit",
    body: "A Study Capture Pro license supports up to 3 active personal browsers or devices.",
    items: [
      "You can remove older devices from the manage-license page.",
      "The system may deactivate older sessions automatically to keep your account within the limit.",
      "Abuse, abnormal activation patterns, or attempts to bypass device limits may lead to review, restriction, or suspension."
    ]
  },
  {
    title: "4. Payments",
    body: "Study Capture Pro is sold as a one-time payment for lifetime Pro access. The current introductory offer is ₹499, and pricing may change for future users.",
    items: [
      "Payments are processed by trusted third-party payment providers.",
      "We do not store your card, UPI, banking, or payment instrument details.",
      "Existing valid purchases remain valid under the terms shown at the time of purchase."
    ]
  },
  {
    title: "5. Refund Policy",
    body: "Because Study Capture Pro is a one-time digital software purchase, refunds are limited and reviewed case by case.",
    items: [
      "If you purchased by mistake or cannot activate Pro, contact us within 7 days of purchase.",
      "Refunds may be declined if Pro access has been used extensively, shared, abused, or resold.",
      "For billing, refund, invoice, or payment questions, contact billing@studycapture.co."
    ]
  },
  {
    title: "6. Account & Access",
    body: "Study Capture uses email-based OTP authentication. There are no traditional password accounts.",
    items: [
      "Your Pro access is tied to your purchase email.",
      "You are responsible for maintaining access to that email inbox.",
      "If you lose access to your email, contact support and we will review recovery requests where possible."
    ]
  },
  {
    title: "7. Misuse & Termination",
    body: "We want Study Capture to stay fair, reliable, and sustainable for legitimate users.",
    items: [
      "Abuse, automation, scraping at abnormal scale, resale, credential sharing, reverse engineering, or exploitation may result in access restriction.",
      "Attempts to bypass payment, activation, device, or license checks may lead to revocation without refund.",
      "We may suspend or terminate access when needed to protect users, the product, or the business."
    ]
  },
  {
    title: "8. Service Availability",
    body: "Study Capture is designed to work across supported browsers, but browser and website restrictions can affect capture behavior.",
    items: [
      "We do not guarantee that every website, protected page, browser page, or embedded app can be captured.",
      "Some pages may block capture, downloads, scripts, or extension access.",
      "Features, browser support, and Pro capabilities may evolve over time."
    ]
  },
  {
    title: "9. Limitation of Liability",
    body: "Study Capture is provided as a productivity tool. Use it with your own judgment and keep backups of important material.",
    items: [
      "We are not liable for data loss, export failures, browser incompatibility, missed captures, or workflow interruption.",
      "We are not responsible for third-party websites, browser changes, payment-provider issues, or content you choose to capture.",
      "To the maximum extent permitted by law, our liability is limited to the amount you paid for Study Capture Pro."
    ]
  }
];

export const metadata = {
  title: "Terms",
  description: "Terms for Study Capture Pro purchases, license access, device limits, payments, and acceptable use."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <article className="mx-auto max-w-5xl">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Study Capture Terms
            </p>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-mist/68">
              These terms govern your use of Study Capture, including Pro access, payments, and device limits.
            </p>
            <p className="mt-5 text-sm text-mist/50">Last updated: {lastUpdated}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-panel">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <QuickFact icon={CreditCard} title="One-time payment" text="Introductory Pro price: ₹499" />
              <QuickFact icon={ShieldCheck} title="Lifetime Pro" text="Valid purchases remain active." />
              <QuickFact icon={AlertCircle} title="3 devices" text="Up to 3 active personal browsers/devices." />
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          {sections.map((section) => (
            <TermsSection key={section.title} section={section} />
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-mint/20 bg-mint/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-mint">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">10. Contact</h2>
              <p className="mt-3 max-w-2xl text-base leading-8 text-mist/70">
                For billing, refunds, invoices, or payment questions, contact{" "}
                <a className="font-semibold text-mint" href={billingMailto}>
                  {billingEmail}
                </a>
                . For product help or activation support, contact{" "}
                <a className="font-semibold text-mint" href={supportMailto}>
                  {supportEmail}
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function QuickFact({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/45 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/12 text-mint">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-mist/60">{text}</p>
    </div>
  );
}

function TermsSection({ section }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
      <p className="mt-4 text-base leading-8 text-mist/70">{section.body}</p>
      <ul className="mt-5 grid gap-3 text-sm leading-7 text-mist/72 md:grid-cols-3">
        {section.items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
