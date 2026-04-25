import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { contactEmail, contactMailto } from "../../lib/site";

export const metadata = {
  title: "Contact",
  description: "Contact Study Capture."
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.045] p-8 shadow-panel sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/12 text-mint">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-8 text-4xl font-semibold text-white">Contact</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-mist/68">
            Questions about installs, Pro access, browser support, or partnership workflows can go straight to the Study Capture inbox.
          </p>
          <a
            href={contactMailto}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
          >
            {contactEmail}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}
