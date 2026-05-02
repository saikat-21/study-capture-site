import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Chrome,
  CreditCard,
  Crown,
  EyeOff,
  FileText,
  Layers3,
  MonitorDown,
  MousePointer2,
  PanelTop,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { installUrl, proUrl, supportMailto } from "../lib/site";

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

const permissionTrustBullets = [
  "Local-first capture",
  "User-controlled exports",
  "No selling of data",
  "Secure payment handling",
  "Clear privacy policy"
];

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
      <HeroSection />
      <TrustPermissionsSection />
      <FeatureSection />
      <BrowserSupportSection />
      <PricingSection />
      <ScreenshotsSection />
      <FAQSection />
      <SiteFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="hero-depth relative isolate flex min-h-[88svh] items-center overflow-hidden pt-16">
      <div className="hero-grid absolute inset-0 opacity-55 dark:opacity-70" aria-hidden="true" />
      <HeroScene />
      <div className="section-shell relative z-10 grid gap-12 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div className="max-w-3xl animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-4 py-2 text-sm font-medium text-mint">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Browser capture for serious study workflows
          </div>
          <h1 className="text-6xl font-semibold leading-none text-mist sm:text-7xl lg:text-8xl">
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-strong shadow-panel transition hover:-translate-y-0.5 hover:bg-mint/85 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
            >
              <MonitorDown className="h-4 w-4" aria-hidden="true" />
              Install Extension
            </a>
            <a
              href={proUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-panel/70 px-6 text-sm font-semibold text-mist transition hover:-translate-y-0.5 hover:border-amber/60 hover:bg-amber/12 focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-ink"
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              Get Pro
            </a>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm text-mist/70">
            {["PNG export", "PDF ready", "Study Books"].map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
                <Check className="mb-2 h-4 w-4 text-mint" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="hero-product-depth relative min-h-[420px] lg:min-h-[560px]" aria-hidden="true">
          <HeroProductMockup />
        </div>
      </div>
    </section>
  );
}

function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[6%] top-[18%] h-32 w-32 rounded-full border border-mint/20 opacity-20 dark:opacity-[0.28]" />
      <div className="absolute bottom-[10%] left-[12%] h-24 w-24 rounded-full border border-violet/20 opacity-[0.18] dark:opacity-[0.24]" />
      <div className="absolute right-[8%] top-[14%] h-44 w-44 rounded-full border border-amber/20 opacity-20 dark:opacity-[0.28]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
    </div>
  );
}

function HeroProductMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
      <div className="relative w-full max-w-[560px]">
        <div className="absolute -inset-10 rounded-[44px] bg-mint/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-200 bg-[#f7f9fc] p-4 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-w-[430px] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Image src="/study-capture-icon.png" alt="" width={54} height={54} className="h-14 w-14 rounded-2xl shadow-[0_16px_30px_rgba(124,58,237,0.28)]" />
              <div>
                <p className="text-xl font-semibold leading-tight">Study Capture</p>
                <p className="mt-1 max-w-[170px] text-sm leading-6 text-slate-600">
                  Turn what you read into one beautiful PDF.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Pro Active
              </div>
              <p className="mt-3 hidden text-xs font-medium text-slate-500 sm:block">saikat.adhikary@gmail.com</p>
              <p className="mt-1 text-sm font-medium text-violet-600">Account</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <h3 className="text-lg font-semibold">Smart Capture</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Scroll to capture pages, or use auto-scroll capture for long articles.
            </p>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-center text-base font-semibold text-white shadow-[0_18px_38px_rgba(5,150,105,0.28)]">
              <span className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 align-middle">
                <span className="h-3.5 w-3.5 rounded-full bg-white" />
              </span>
              Capture while reading
            </div>
            <p className="mt-3 text-center text-sm text-slate-400">Ready</p>

            <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-3">
              <p className="text-sm font-semibold">Auto-scroll capture</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                We scroll the tab for you and capture automatically.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                <div className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-white shadow-[0_10px_20px_rgba(5,150,105,0.18)]">
                  Start
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-2 text-center text-slate-400">
                  Pause
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-2 text-center text-slate-400">
                  Resume
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-2 text-center text-rose-400">
                  Stop
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-lg font-semibold">Quick Export</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              One screen from this tab only — not added to your Current PDF.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-600 shadow-sm">
                Save PNG
              </div>
              <div className="rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_28px_rgba(124,58,237,0.24)]">
                Save PDF
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
              Current PDF · 0 pages
              <span className="float-right text-slate-400">⌄</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustPermissionsSection() {
  return (
    <section className="border-y border-line bg-night/80 py-16 sm:py-20">
      <div className="section-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Permissions and trust
          </p>
          <h2 className="mt-6 max-w-2xl text-3xl font-semibold leading-tight text-mist sm:text-4xl">
            Why Study Capture needs browser access
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-mist/70">
            Study Capture needs access to the current webpage so it can capture visible content and create PNG, PDF, or Study Book exports. Captures happen only when you click capture or export.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">
            Page content is processed locally in the browser where possible. We do not sell personal data, track browsing history for advertising, or read pages in the background.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/62">
            Email is used only for Pro license delivery, restore access, support, and payment confirmation. Payments are handled by Razorpay or trusted payment processors.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacy"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-mint px-5 text-sm font-semibold text-strong transition hover:-translate-y-0.5 hover:bg-mint/85"
            >
              Privacy Policy
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={supportMailto}
              className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-mist transition hover:-translate-y-0.5 hover:border-mint/50 hover:bg-mint/10"
            >
              Contact Support
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TrustCard
            icon={<MousePointer2 className="h-5 w-5" aria-hidden="true" />}
            title="Only when you ask"
            text="Study Capture captures the current page after a user action. It does not read pages in the background."
          />
          <TrustCard
            icon={<EyeOff className="h-5 w-5" aria-hidden="true" />}
            title="No ad tracking"
            text="We do not track browsing history for advertising or sell personal data."
          />
          <TrustCard
            icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
            title="Payments stay secure"
            text="Pro payments are handled by Razorpay or trusted payment processors."
          />
          <div className="rounded-3xl border border-mint/20 bg-mint/10 p-5">
            <ul className="grid gap-3 text-sm font-semibold leading-6 text-mist/76">
              {permissionTrustBullets.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustCard({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-line bg-panel/80 p-5 shadow-panel">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint/12 text-mint">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-mist">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-mist/62">{text}</p>
    </div>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="relative border-y border-line bg-night/80 py-20 sm:py-24">
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
                <h3 className="text-base font-semibold text-mist">{feature.title}</h3>
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
            <article key={browser} className="premium-border rounded-2xl bg-panel/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-panel/70 text-mist">
                    <PanelTop className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-mist">{browser}</h3>
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
    <section id="pricing" className="border-y border-line bg-night/80 py-20 sm:py-24">
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
    <article className={`premium-border rounded-3xl p-6 sm:p-8 ${featured ? "bg-mint text-strong shadow-glow" : "glass-panel text-mist"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-semibold ${featured ? "text-strong" : "text-mist"}`}>{name}</h3>
          <p className={`mt-2 text-sm ${featured ? "text-strong/70" : "text-mist/60"}`}>{description}</p>
        </div>
        {tag ? (
          <span className="rounded-full bg-strong px-3 py-1 text-xs font-semibold text-white">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="mt-8 flex items-end gap-2">
        <span className="text-5xl font-semibold">{price}</span>
        {originalPrice ? (
          <span className={`pb-2 text-2xl font-semibold line-through ${featured ? "text-strong/45" : "text-mist/40"}`}>
            {originalPrice}
          </span>
        ) : null}
        {featured ? <span className="pb-2 text-sm font-medium text-strong/65">one time</span> : null}
      </div>
      {featured ? (
        <p className="mt-3 text-sm font-semibold text-strong/72">One-time payment · lifetime Pro access</p>
      ) : null}
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6">
            <Check className={`mt-0.5 h-5 w-5 shrink-0 ${featured ? "text-strong" : "text-mint"}`} aria-hidden="true" />
            <span className={featured ? "text-strong/78" : "text-mist/70"}>{item}</span>
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`mt-9 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          featured
            ? "bg-strong text-white hover:bg-strong/90 focus:ring-ink focus:ring-offset-mint"
            : "bg-panel text-strong hover:bg-mint focus:ring-mint focus:ring-offset-ink"
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
            <article key={card.title} className="premium-border overflow-hidden rounded-3xl bg-panel/80 shadow-panel">
              <div className="border-b border-line p-5">
                <p className="text-sm font-semibold text-mint">{card.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold text-mist">{card.title}</h3>
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
      <div className="rounded-3xl border border-amber/20 bg-panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-mist">Reading Capture</p>
            <p className="mt-1 text-xs text-mist/48">Capturing while you scroll</p>
          </div>
          <span className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-mist">REC</span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Metric label="Added" value="12" />
          <Metric label="Last" value="3s" />
        </div>
        <div className="mt-6 space-y-3">
          {[72, 88, 56, 78].map((width, index) => (
            <div key={width} className="rounded-2xl border border-line bg-panel/80 p-3">
              <div className="h-3 rounded-full bg-amber/50" style={{ width: `${width}%` }} />
              <div className="mt-3 h-2 rounded-full bg-panel/70" />
              <div className="mt-2 h-2 rounded-full bg-panel/70" style={{ width: `${65 + index * 7}%` }} />
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
            className="absolute h-60 w-40 rounded-2xl border border-line bg-panel p-4 shadow-panel"
            style={{ transform: `translateX(${(page - 1) * 42}px) rotate(${(page - 1) * 7}deg)` }}
          >
            <div className="h-20 rounded-xl bg-gradient-to-br from-lagoon/30 to-mint/10" />
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-panel/80" />
              <div className="h-2 w-10/12 rounded-full bg-panel/75" />
              <div className="h-2 w-7/12 rounded-full bg-panel/75" />
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
    <div className="mx-auto max-w-[280px] rounded-[28px] border border-line bg-panel p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <Image src="/study-capture-icon.png" alt="" width={42} height={42} className="h-10 w-10 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-mist">Study Capture</p>
          <p className="mt-1 text-xs text-mist/45">Ready on this tab</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {[
          ["Save PNG", MonitorDown],
          ["Save PDF", FileText],
          ["Add to Book", Layers3]
        ].map(([label, Icon]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-panel/75 px-4 py-3 text-sm font-semibold text-mist">
            <span>{label}</span>
            <Icon className="h-4 w-4 text-mint" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-mint px-4 py-3 text-center text-sm font-semibold text-strong">
        Start reading capture
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-panel/75 p-4">
      <p className="text-xs text-mist/48">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-mist">{value}</p>
    </div>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="border-y border-line bg-night/80 py-20 sm:py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <SectionIntro
          eyebrow="FAQ"
          title="Questions before launch."
          text="Clear answers for students, teams, and reviewers looking at the extension before installing."
        />
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-line bg-panel/80 p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-mist">
                {faq.question}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel/70 text-mint transition group-open:rotate-45">
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
          <span className="text-sm font-semibold text-mist">Study Capture</span>
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-mist/58" aria-label="Footer navigation">
          <Link href="/install" className="transition hover:text-mist">Install</Link>
          <Link href="/upgrade" className="transition hover:text-mist">Upgrade</Link>
          <Link href="/login" className="transition hover:text-mist">Login</Link>
          <Link href="/manage-license" className="transition hover:text-mist">Manage License</Link>
          <Link href="/contact" className="transition hover:text-mist">Contact</Link>
          <Link href="/privacy" className="transition hover:text-mist">Privacy</Link>
          <Link href="/terms" className="transition hover:text-mist">Terms</Link>
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
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-mist sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-mist/62">{text}</p>
    </div>
  );
}
