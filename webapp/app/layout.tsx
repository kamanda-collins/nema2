import type { Metadata, Viewport } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Plot Screener | Wetland & flood risk check before you pay a deposit",
  description:
    "A preliminary environmental-risk screen for land buyers in Uganda and Kenya. Check a location before paying a deposit, then verify with licensed professionals and authorities.",
  keywords: [
    "wetland compliance",
    "NEMA",
    "due diligence",
    "Uganda land",
    "Kenya land",
    "EMCA",
    "property risk",
  ],
  openGraph: {
    title: "Plot Screener",
    description: "Check mapped environmental signals before paying a land deposit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f2f4f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
