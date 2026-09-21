import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import ApiKeyBar from "@/components/ApiKeyBar";

export const metadata: Metadata = {
  title: "Wetland Risk Screen | Before You Pay a Deposit",
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
    title: "Wetland Risk Screen",
    description: "Check mapped environmental signals before paying a land deposit.",
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
  { href: "/privacy", label: "Privacy" },
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
                  Wetland Risk Screen
                </span>
                <span className="block text-[11px] text-slate-500">
                  Preliminary check · Uganda &amp; Kenya
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
              Preliminary location screen only. It is not clearance, a land survey, title search,
              or a NEMA decision.
            </p>
            <p>
              Data sources and coverage are shown with each result. A map pin is not a parcel
              boundary; confirm with a registered surveyor and the relevant authority.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
