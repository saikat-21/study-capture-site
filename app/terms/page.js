import Link from "next/link";
import { contactEmail, contactMailto } from "../../lib/site";

export const metadata = {
  title: "Terms",
  description: "Terms for Study Capture."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
        <h1 className="mt-8 text-4xl font-semibold text-white">Terms</h1>
        <p className="mt-4 text-mist/60">Last updated: April 25, 2026</p>
        <div className="mt-10 space-y-7 text-base leading-8 text-mist/70">
          <p>
            By using Study Capture, you agree to use the extension responsibly and only capture content you are allowed to save.
          </p>
          <p>
            Study Capture is provided as a productivity tool for saving webpage captures into PNG, PDF, and Study Book formats.
          </p>
          <p>
            Pro Lifetime Plan availability and pricing may change for future customers. Existing paid access terms remain tied to the offer presented at purchase.
          </p>
          <p>
            The product is provided without guarantees that every webpage or browser-protected page can be captured.
          </p>
          <p>
            For terms questions, contact <a className="text-mint" href={contactMailto}>{contactEmail}</a>.
          </p>
        </div>
      </article>
    </main>
  );
}
