import { ArrowRight, Mail } from "lucide-react";
import {
  billingEmail,
  billingMailto,
  founderEmail,
  founderMailto,
  supportEmail,
  supportMailto
} from "../../lib/site";

export const metadata = {
  title: "Contact",
  description: "Contact Study Capture."
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-8 shadow-panel sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/12 text-mint">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-8 text-4xl font-semibold text-white">Contact</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-mist/68">
            Questions about installs, browser support, billing, or business workflows can go straight to the right Study Capture inbox.
          </p>
          <div className="mt-8 grid gap-3">
            <ContactLink label="Support" email={supportEmail} href={supportMailto} />
            <ContactLink label="Billing, refunds, invoices" email={billingEmail} href={billingMailto} />
            <ContactLink label="Admin and business" email={founderEmail} href={founderMailto} />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactLink({ label, email, href }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm transition hover:border-mint/40 hover:bg-white/[0.07]"
    >
      <span>
        <span className="block font-semibold text-white">{label}</span>
        <span className="mt-1 block text-mist/60">{email}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
    </a>
  );
}
