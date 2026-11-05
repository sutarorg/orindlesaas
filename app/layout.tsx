import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { absoluteUrl, siteConfig, socialImage } from "@/lib/site";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "optional",
  fallback: ["Arial", "sans-serif"],
});

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Orindle — Everything AI. One Platform.",
    template: "%s | Orindle",
  },
  description: siteConfig.description,
  applicationName: "Orindle",
  authors: [{ name: "Orindle" }],
  creator: "Orindle",
  publisher: "Orindle",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: "Orindle — Everything AI. One Platform.",
    description: siteConfig.description,
    url: absoluteUrl(),
    siteName: "Orindle",
    locale: "en_US",
    type: "website",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orindle — Everything AI. One Platform.",
    description: siteConfig.description,
    images: [socialImage],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
