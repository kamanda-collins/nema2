import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import ApiKeyBar from "@/components/ApiKeyBar";

export const metadata: Metadata = {
  title: "NEMA Wetland Due Diligence | Plot Risk Screening",
  description:
    "Instant wetland compliance screening for land buyers, lenders and conveyancers in Uganda & Kenya. Traffic-light risk score, 2-page PDF certificate, QR verification.",
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
    title: "NEMA Wetland Due Diligence",
    description: "Check any plot for wetland encroachment risk before you buy.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d47a1",
};

const NAV = [
  { href: "/", label: "Screen a Plot" },
  { href: "/batch", label: "Batch" },
  { href: "/verify", label: "Verify" },
  { href: "/pricing", label: "Pricing" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg font-bold text-white">
                N
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-slate-900">
                  Wetland Due Diligence
                </span>
                <span className="block text-[11px] text-slate-500">
                  Uganda &amp; Kenya · NEA 2019 / EMCA 1999
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <ApiKeyBar />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="mt-10 border-t border-slate-200 bg-white py-6">
          <div className="mx-auto max-w-6xl space-y-1 px-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-600">
              Indicative screening only. Not a substitute for a certified survey or a NEMA
              environmental audit.
            </p>
            <p>
              Data: OpenStreetMap · Copernicus GLO-90 DEM · gazetted wetland registries.
              Screening results are guidance, not legal advice.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
