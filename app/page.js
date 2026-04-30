import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Chrome,
  Crown,
  FileText,
  Layers3,
  MonitorDown,
  PanelTop,
  Sparkles
} from "lucide-react";
import { installUrl, proUrl } from "../lib/site";

const features = [
  {
    icon: MonitorDown,
    title: "Screenshot to PNG",
    text: "Save crisp page captures for notes, LMS uploads, research boards, and quick reference."
  },
  {
    icon: FileText,
    title: "Save as PDF",
    text: "Turn the current page view into a polished PDF without jumping through print dialogs."
  },
  {
    icon: Layers3,
    title: "Multi-page Study Book",
    text: "Collect related pages into one portable book and keep every capture in reading order."
  },
  {
    icon: BookOpen,
    title: "Reading Capture mode",
    text: "Start once, keep scrolling, and let Study Capture add meaningful screenfuls as pages."
  },
  {
    icon: Chrome,
    title: "Cross-browser support",
    text: "Built for Chrome, Edge, Firefox, and Safari workflows from the same focused experience."
  }
];

const browserSupport = ["Chrome", "Edge", "Firefox", "Safari"];

const faqs = [
  {
    question: "What does Study Capture save?",
    answer:
      "Study Capture saves the visible area of the current webpage as PNG, PDF, or a page inside a multi-page Study Book."
  },
  {
    question: "Is Reading Capture automatic?",
    answer:
      "Yes. Start Reading Capture, scroll through the page, and the extension keeps adding useful page captures until you stop it."
  },
  {
    question: "Which browsers are supported?",
    answer:
      "The extension is designed for Chrome, Edge, Firefox, and Safari, with browser-specific builds for each store workflow."
  },
  {
    question: "What is included in the Pro Lifetime Plan?",
    answer:
      "The introductory offer gives lifetime Pro access for advanced capture workflows, Study Book export, and future Pro improvements."
  },
  {
    question: "Can every website be captured?",
    answer:
      "Normal webpages can be captured. Browser-protected pages such as chrome://, about:, extension pages, and store pages cannot be captured by any extension."
  }
];

const screenshotCards = [
  {
    title: "Capture panel",
    eyebrow: "Fast actions",
    body: "PNG, PDF, and Book capture live in one calm extension popup.",
    visual: "panel"
  },
  {
    title: "Reading session",
    eyebrow: "While you scroll",
    body: "Track captures, recent activity, and book page count without losing context.",
    visual: "reading"
  },
  {
    title: "Study Book export",
    eyebrow: "Multi-page output",
    body: "Build one portable study file from separate webpage moments.",
    visual: "book"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-mist">
      <SiteHeader />
      <HeroSection />
      <FeatureSection />
      <BrowserSupportSection />
      <PricingSection />
      <ScreenshotsSection />
      <FAQSection />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  const nav = [
    ["Features", "#features"],
    ["Browsers", "#browser-support"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"]
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
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
          <span className="text-sm font-semibold text-white sm:text-base">Study Capture</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm text-mist/72 md:flex">
          {nav.map(([label, href]) => (
            <a key={href} href={href} className="transition hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <a
          href={proUrl}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-mint px-4 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
        >
          <Crown className="h-4 w-4" aria-hidden="true" />
          Get Pro
        </a>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden pt-16">
      <div className="hero-grid absolute inset-0 opacity-80" aria-hidden="true" />
      <HeroScene />
      <div className="section-shell relative z-10 grid gap-12 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div className="max-w-3xl animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-4 py-2 text-sm font-medium text-mint">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Browser capture for serious study workflows
          </div>
          <h1 className="text-6xl font-semibold leading-none text-white sm:text-7xl lg:text-8xl">
            Study Capture
          </h1>
          <p className="mt-7 max-w-2xl text-2xl font-medium leading-tight text-mist sm:text-3xl">
            Capture webpages into PNG, PDF, or Study Books instantly.
          </p>
          <p className="mt-5 max-w-xl text-base leading-8 text-mist/70 sm:text-lg">
            A premium browser extension built for students, researchers, and professionals who need clean captures without breaking flow.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={installUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink shadow-panel transition hover:-translate-y-0.5 hover:bg-mint focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-ink"
            >
              <MonitorDown className="h-4 w-4" aria-hidden="true" />
              Install Extension
            </a>
            <a
              href={proUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-amber/60 hover:bg-amber/12 focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-ink"
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              Get Pro
            </a>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm text-mist/70">
            {["PNG export", "PDF ready", "Study Books"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <Check className="mb-2 h-4 w-4 text-mint" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[420px] lg:min-h-[560px]" aria-hidden="true">
          <HeroProductMockup />
        </div>
      </div>
    </section>
  );
}

function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[6%] top-[18%] h-36 w-36 rounded-full border border-mint/25 opacity-40" />
      <div className="absolute bottom-[10%] left-[12%] h-28 w-28 rounded-full border border-coral/20 opacity-40" />
      <div className="absolute right-[8%] top-[14%] h-48 w-48 rounded-full border border-amber/25 opacity-45" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
    </div>
  );
}

function HeroProductMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
      <div className="relative h-[390px] w-full max-w-[620px] sm:h-[470px] lg:h-[540px]">
        <div className="absolute left-5 top-8 h-[76%] w-[78%] rounded-[28px] border border-white/12 bg-white/[0.06] p-4 shadow-panel backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <span className="h-3 w-3 rounded-full bg-coral" />
            <span className="h-3 w-3 rounded-full bg-amber" />
            <span className="h-3 w-3 rounded-full bg-mint" />
            <span className="ml-3 h-7 flex-1 rounded-full bg-white/10" />
          </div>
          <div className="relative mt-5 h-[78%] overflow-hidden rounded-2xl border border-white/10 bg-[#0E161B] p-5">
            <div className="capture-sweep absolute inset-x-0 top-0 h-28 animate-scan-line" />
            <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="space-y-4">
                <div className="h-28 rounded-2xl bg-gradient-to-br from-mint/25 via-lagoon/15 to-white/5" />
                <div className="mock-text-row w-11/12" />
                <div className="mock-text-row w-10/12" />
                <div className="mock-text-row w-8/12" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-20 rounded-xl bg-white/[0.06]" />
                  <div className="h-20 rounded-xl bg-amber/15" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-16 rounded-xl bg-white/[0.06]" />
                <div className="h-16 rounded-xl bg-mint/15" />
                <div className="h-16 rounded-xl bg-lagoon/15" />
                <div className="h-16 rounded-xl bg-coral/15" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 right-2 w-[260px] rounded-[24px] border border-white/14 bg-[#111C22]/95 p-4 shadow-panel backdrop-blur-xl sm:right-8 sm:w-[300px]">
          <div className="flex items-center gap-3">
            <Image src="/study-capture-icon.png" alt="" width={42} height={42} className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-sm font-semibold text-white">Study Capture</p>
              <p className="text-xs text-mist/55">Current tab ready</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {[
              ["PNG", "bg-mint text-ink"],
              ["PDF", "bg-white/10 text-white"],
              ["Add to Book", "bg-lagoon/18 text-lagoon"]
            ].map(([label, className]) => (
              <div key={label} className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${className}`}>
                {label}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-amber/25 bg-amber/10 p-3">
            <div className="flex items-center justify-between text-xs text-amber">
              <span>Reading Capture</span>
              <span>REC 12</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-amber" />
            </div>
          </div>
        </div>
        <div className="absolute right-8 top-6 hidden rounded-full border border-mint/25 bg-mint/12 px-4 py-2 text-sm font-semibold text-mint shadow-glow sm:block">
          Captured
        </div>
      </div>
    </div>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="relative border-y border-white/10 bg-[#091116]/85 py-20 sm:py-24">
      <div className="section-shell">
        <SectionIntro
          eyebrow="Features"
          title="Everything capture needs, nothing that slows you down."
          text="Study Capture keeps the extension experience direct: choose the output, save the page, and keep moving through your material."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="premium-border glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-mint/35">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-mint/12 text-mint">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-mist/62">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BrowserSupportSection() {
  return (
    <section id="browser-support" className="py-20 sm:py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <SectionIntro
          eyebrow="Browser Support"
          title="Ready for the browser you study in."
          text="Ship a focused landing experience today, with clear install paths for each supported browser as store links become available."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {browserSupport.map((browser, index) => (
            <article key={browser} className="premium-border rounded-2xl bg-white/[0.045] p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                    <PanelTop className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{browser}</h3>
                    <p className="mt-1 text-sm text-mist/55">Extension build supported</p>
                  </div>
                </div>
                <span className={`h-3 w-3 rounded-full ${index === 1 ? "bg-amber" : index === 2 ? "bg-lagoon" : index === 3 ? "bg-coral" : "bg-mint"}`} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="border-y border-white/10 bg-[#0B1519] py-20 sm:py-24">
      <div className="section-shell">
        <SectionIntro
          eyebrow="Pricing"
          title="Start free. Upgrade once when you are ready."
          text="Simple plans for a focused browser extension, with a limited-time introductory price for lifetime Pro access."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <PricingCard
            name="Free Plan"
            price="₹0"
            description="Core capture tools for quick study sessions."
            cta="Install Extension"
            href={installUrl}
            items={["Screenshot to PNG", "Save as PDF", "Single-page capture", "Chrome, Edge, Firefox, Safari support"]}
          />
          <PricingCard
            featured
            name="Pro Lifetime Plan"
            price="₹499"
            originalPrice="₹799"
            tag="Introductory offer"
            description="Limited-time introductory price for early users."
            cta="Get Pro"
            href={proUrl}
            items={["Multi-page Study Books", "Reading Capture mode", "Download and keep workflows", "Future Pro improvements included"]}
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({ name, price, originalPrice, tag, description, cta, href, items, featured = false }) {
  return (
    <article className={`premium-border rounded-3xl p-6 sm:p-8 ${featured ? "bg-mint text-ink shadow-glow" : "glass-panel text-mist"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-semibold ${featured ? "text-ink" : "text-white"}`}>{name}</h3>
          <p className={`mt-2 text-sm ${featured ? "text-ink/70" : "text-mist/60"}`}>{description}</p>
        </div>
        {tag ? (
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-mint">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="mt-8 flex items-end gap-2">
        <span className="text-5xl font-semibold">{price}</span>
        {originalPrice ? (
          <span className={`pb-2 text-2xl font-semibold line-through ${featured ? "text-ink/45" : "text-mist/40"}`}>
            {originalPrice}
          </span>
        ) : null}
        {featured ? <span className="pb-2 text-sm font-medium text-ink/65">one time</span> : null}
      </div>
      {featured ? (
        <p className="mt-3 text-sm font-semibold text-ink/72">One-time payment · lifetime Pro access</p>
      ) : null}
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6">
            <Check className={`mt-0.5 h-5 w-5 shrink-0 ${featured ? "text-ink" : "text-mint"}`} aria-hidden="true" />
            <span className={featured ? "text-ink/78" : "text-mist/70"}>{item}</span>
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`mt-9 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          featured
            ? "bg-ink text-white hover:bg-[#122329] focus:ring-ink focus:ring-offset-mint"
            : "bg-white text-ink hover:bg-mint focus:ring-white focus:ring-offset-ink"
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}

function ScreenshotsSection() {
  return (
    <section id="screenshots" className="py-20 sm:py-24">
      <div className="section-shell">
        <SectionIntro
          eyebrow="Screenshots"
          title="A calm interface for high-volume capture."
          text="The product experience is built around fast output choices, visible capture state, and study-friendly exports."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {screenshotCards.map((card) => (
            <article key={card.title} className="premium-border overflow-hidden rounded-3xl bg-white/[0.045] shadow-panel">
              <div className="border-b border-white/10 p-5">
                <p className="text-sm font-semibold text-mint">{card.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-mist/60">{card.body}</p>
              </div>
              <div className="min-h-[320px] p-5">
                <ScreenshotVisual type={card.visual} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotVisual({ type }) {
  if (type === "reading") {
    return (
      <div className="rounded-3xl border border-amber/20 bg-[#10161A] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Reading Capture</p>
            <p className="mt-1 text-xs text-mist/48">Capturing while you scroll</p>
          </div>
          <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">REC</span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Metric label="Added" value="12" />
          <Metric label="Last" value="3s" />
        </div>
        <div className="mt-6 space-y-3">
          {[72, 88, 56, 78].map((width, index) => (
            <div key={width} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="h-3 rounded-full bg-amber/50" style={{ width: `${width}%` }} />
              <div className="mt-3 h-2 rounded-full bg-white/10" />
              <div className="mt-2 h-2 rounded-full bg-white/10" style={{ width: `${65 + index * 7}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "book") {
    return (
      <div className="relative flex h-full min-h-[280px] items-center justify-center">
        {[0, 1, 2].map((page) => (
          <div
            key={page}
            className="absolute h-60 w-40 rounded-2xl border border-white/12 bg-[#101A20] p-4 shadow-panel"
            style={{ transform: `translateX(${(page - 1) * 42}px) rotate(${(page - 1) * 7}deg)` }}
          >
            <div className="h-20 rounded-xl bg-gradient-to-br from-lagoon/30 to-mint/10" />
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-white/18" />
              <div className="h-2 w-10/12 rounded-full bg-white/14" />
              <div className="h-2 w-7/12 rounded-full bg-white/14" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-full bg-mint/15 px-3 py-2 text-center text-xs font-semibold text-mint">
              Page {page + 1}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[280px] rounded-[28px] border border-white/12 bg-[#101A20] p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <Image src="/study-capture-icon.png" alt="" width={42} height={42} className="h-10 w-10 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-white">Study Capture</p>
          <p className="mt-1 text-xs text-mist/45">Ready on this tab</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {[
          ["Save PNG", MonitorDown],
          ["Save PDF", FileText],
          ["Add to Book", Layers3]
        ].map(([label, Icon]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
            <span>{label}</span>
            <Icon className="h-4 w-4 text-mint" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-mint px-4 py-3 text-center text-sm font-semibold text-ink">
        Start reading capture
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4">
      <p className="text-xs text-mist/48">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="border-y border-white/10 bg-[#091116] py-20 sm:py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <SectionIntro
          eyebrow="FAQ"
          title="Questions before launch."
          text="Clear answers for students, teams, and reviewers looking at the extension before installing."
        />
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
                {faq.question}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-mint transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-10">
      <div className="section-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Study Capture home">
          <Image src="/study-capture-icon.png" alt="" width={34} height={34} className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-semibold text-white">Study Capture</span>
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-mist/58" aria-label="Footer navigation">
          <Link href="/install" className="transition hover:text-white">Install</Link>
          <Link href="/upgrade" className="transition hover:text-white">Upgrade</Link>
          <Link href="/login" className="transition hover:text-white">Login</Link>
          <Link href="/manage-license" className="transition hover:text-white">Manage License</Link>
          <Link href="/contact" className="transition hover:text-white">Contact</Link>
          <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          <Link href="/terms" className="transition hover:text-white">Terms</Link>
        </nav>
        <p className="text-sm text-mist/42">&copy; 2026 Study Capture.</p>
      </div>
    </footer>
  );
}

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-mint">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-mist/62">{text}</p>
    </div>
  );
}
