import "./globals.css";
import AppLayout from "../components/AppLayout";

export const metadata = {
  metadataBase: new URL("https://studycapture.co"),
  title: {
    default: "Study Capture - Webpage Capture for Study Books",
    template: "%s | Study Capture"
  },
  description:
    "Capture webpages into PNG, PDF, or multi-page Study Books instantly with the Study Capture browser extension.",
  openGraph: {
    title: "Study Capture",
    description:
      "Capture webpages into PNG, PDF, or Study Books instantly.",
    url: "https://studycapture.co",
    siteName: "Study Capture",
    images: [
      {
        url: "/study-capture-icon.png",
        width: 128,
        height: 128,
        alt: "Study Capture app icon"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Study Capture",
    description:
      "Capture webpages into PNG, PDF, or Study Books instantly.",
    images: ["/study-capture-icon.png"]
  },
  icons: {
    icon: "/study-capture-icon.png",
    apple: "/study-capture-icon.png"
  }
};

export const viewport = {
  themeColor: "#071014",
  colorScheme: "dark light"
};

const themeScript = `
(() => {
  const storageKey = "study-capture-theme";
  const allowed = new Set(["light", "dark", "system"]);
  const root = document.documentElement;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => {
    let preference = "system";

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (allowed.has(stored)) preference = stored;
    } catch {
      preference = "system";
    }

    const resolvedTheme = preference === "system"
      ? (darkQuery.matches ? "dark" : "light")
      : preference;
    const useDark = resolvedTheme === "dark";

    root.classList.toggle("dark", useDark);
    root.dataset.theme = resolvedTheme;
    root.dataset.themeMode = preference;
    root.style.colorScheme = resolvedTheme;
  };

  applyTheme();
  darkQuery.addEventListener?.("change", applyTheme);
  window.__studyCaptureApplyTheme = applyTheme;
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) applyTheme();
  });
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="min-h-full bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
