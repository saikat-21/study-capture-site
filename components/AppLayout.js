import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { proUrl } from "../lib/site";

const navItems = [
  ["Features", "/#features"],
  ["Browsers", "/#browser-support"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"]
];

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink text-mist">
      <AppHeader />
      {children}
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Study Capture home">
          <Image
            src="/study-capture-icon.png"
            alt=""
            width={34}
            height={34}
            className="h-8 w-8 rounded-lg"
            priority
          />
          <span className="truncate text-sm font-semibold text-white sm:text-base">Study Capture</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm text-mist/72 md:flex">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-white">
              {label}
            </Link>
          ))}
        </nav>

        <a
          href={proUrl}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-mint px-4 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
        >
          <Crown className="h-4 w-4" aria-hidden="true" />
          Get Pro
        </a>
      </div>
    </header>
  );
}
