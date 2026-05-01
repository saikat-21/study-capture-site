"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Compass, Globe2 } from "lucide-react";
import { storeUrls } from "../lib/site";

const BROWSERS = [
  { id: "chrome", label: "Chrome", note: "Chrome Web Store", detector: /Chrome\// },
  { id: "edge", label: "Edge", note: "Microsoft Edge Add-ons", detector: /Edg\// },
  { id: "firefox", label: "Firefox", note: "Firefox Add-ons", detector: /Firefox\// },
  { id: "safari", label: "Safari", note: "Mac App Store / Safari Extension", detector: /Safari\// }
];

export default function InstallClient() {
  const [detected, setDetected] = useState("unknown");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) setDetected("edge");
    else if (/Firefox\//.test(ua)) setDetected("firefox");
    else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) setDetected("chrome");
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) setDetected("safari");
    else setDetected("unknown");
  }, []);

  const visibleBrowsers = useMemo(() => {
    if (detected === "unknown") return BROWSERS;
    return BROWSERS.filter((browser) => browser.id === detected);
  }, [detected]);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-line bg-panel/80 p-7 shadow-panel sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/12 text-mint">
          {detected === "unknown" ? <Globe2 className="h-6 w-6" /> : <Compass className="h-6 w-6" />}
        </div>
        <h1 className="mt-7 text-4xl font-semibold text-mist">Install Study Capture</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-mist/65">
          {detected === "unknown"
            ? "Choose your browser to continue."
            : `We detected ${BROWSERS.find((browser) => browser.id === detected)?.label}. Use the matching install path below.`}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visibleBrowsers.map((browser) => {
          const href = storeUrls[browser.id];
          return (
            <article key={browser.id} className="rounded-3xl border border-line bg-panel p-6 shadow-panel">
              <h2 className="text-2xl font-semibold text-mist">{browser.label}</h2>
              <p className="mt-2 text-sm text-mist/55">{browser.note}</p>
              <a
                href={href || "#"}
                aria-disabled={!href}
                className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                  href
                    ? "bg-mint text-strong hover:-translate-y-0.5 hover:bg-panel"
                    : "cursor-not-allowed border border-line text-mist/42"
                }`}
              >
                {href ? "Open install page" : "Store URL coming soon"}
                {href ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
              </a>
            </article>
          );
        })}
      </div>

      {detected !== "unknown" ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setDetected("unknown")}
            className="text-sm font-semibold text-mist/58 transition hover:text-mist"
          >
            Show all browser options
          </button>
        </div>
      ) : null}
    </section>
  );
}
