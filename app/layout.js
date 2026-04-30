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
  colorScheme: "dark"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
