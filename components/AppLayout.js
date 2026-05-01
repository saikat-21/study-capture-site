import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { proUrl } from "../lib/site";
import ThemeToggle from "./ThemeToggle";

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
    <header className="sticky inset-x-0 top-0 z-50 border-b border-line bg-ink/78 backdrop-blur-[8px]">
      <div className="section-shell flex min-h-[72px] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-4" aria-label="Study Capture home">
          <Image
            src="/study-capture-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl"
            priority
          />
          <span className="truncate text-sm font-semibold text-mist sm:text-base">Study Capture</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm text-mist/72 md:flex">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-mist">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href={proUrl}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-mint px-4 text-sm font-semibold text-strong shadow-glow transition hover:-translate-y-0.5 hover:bg-mint/85 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Get Pro</span>
            <span className="sm:hidden">Pro</span>
          </a>
        </div>
      </div>
    </header>
  );
}
