import Link from "next/link";
import { contactEmail, contactMailto } from "../../lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Study Capture."
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
        <h1 className="mt-8 text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-4 text-mist/60">Last updated: April 25, 2026</p>
        <div className="mt-10 space-y-7 text-base leading-8 text-mist/70">
          <p>
            Study Capture is designed to help you save webpage captures for personal study and research workflows.
          </p>
          <p>
            The extension captures webpage images only when you choose a capture action or enable Reading Capture mode. Captured files are prepared locally by the extension for download.
          </p>
          <p>
            We do not sell personal data. If you contact us for support, we use the information you provide to respond to your request.
          </p>
          <p>
            Browser permissions are used to provide capture, download, and cross-browser extension functionality. Some browser-protected pages cannot be captured.
          </p>
          <p>
            For privacy questions, contact <a className="text-mint" href={contactMailto}>{contactEmail}</a>.
          </p>
        </div>
      </article>
    </main>
  );
}
