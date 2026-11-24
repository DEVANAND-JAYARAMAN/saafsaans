import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://saafsaans.vercel.app"),
  title: {
    default: "SaafSaans — Clean breath for every family",
    template: "%s · SaafSaans",
  },
  description:
    "A GenAI air-quality companion that turns winter-smog data into grounded, personalized action for families and communities — and shows the exact impact of every choice.",
  keywords: [
    "air quality",
    "winter smog",
    "PM2.5",
    "AQI",
    "indoor air quality",
    "family health",
    "Gemini",
    "India",
  ],
  authors: [{ name: "SaafSaans" }],
  openGraph: {
    title: "SaafSaans — Clean breath for every family",
    description:
      "Grounded, personalized smog guidance. Every suggestion shows its real impact in µg of PM2.5 and cigarette-equivalents.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 md:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
