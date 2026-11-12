"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ApiKeyBar from "@/components/ApiKeyBar";

/**
 * Open-plane shell (design-taste-frontend app sheet): a labelled sidebar on the
 * page ground on desktop; a 48px top bar that folds into a full-screen sheet on
 * the phone. One hairline separates the sidebar from the canvas.
 */

const NAV = [
  { href: "/", label: "Screen a plot" },
  { href: "/batch", label: "Batch screening" },
  { href: "/verify", label: "Verify a report" },
  { href: "/pricing", label: "Pricing" },
];

/** Product mark: plot outline with its statutory buffer ring. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" stroke="#1d5fbf" strokeWidth="1.3" strokeDasharray="2.4 2.2" />
      <rect x="7.5" y="7.5" width="9" height="9" stroke="#0a0a0a" strokeWidth="1.6" />
      <rect x="10.8" y="10.8" width="2.4" height="2.4" fill="#0a0a0a" />
    </svg>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-ink">Plot Screener</span>
        <span className="block text-xs text-muted">Uganda &amp; Kenya</span>
      </span>
    </span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone sheet when the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 items-center rounded-md px-3 text-sm transition-colors ${
              active ? "bg-raised font-medium text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-ground lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Link href="/" aria-label="Plot Screener home">
            <Wordmark />
          </Link>
        </div>
        <div className="px-2.5">{navList()}</div>
        <div className="mt-auto px-4 pb-4">
          <ApiKeyBar />
        </div>
      </aside>

      {/* Phone: top bar + full-screen menu sheet */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Link href="/" aria-label="Plot Screener home">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="grid h-9 w-9 place-items-center rounded-md text-ink hover:bg-raised"
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <Wordmark />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-md text-ink hover:bg-raised"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
          <div className="px-3 pt-3">{navList(() => setMenuOpen(false))}</div>
          <div className="mt-auto px-4 pb-6">
            <ApiKeyBar />
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-10 pt-6 lg:px-10 lg:pt-9">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-6 lg:px-10">
          <div className="mx-auto max-w-[1240px] space-y-1.5 text-xs leading-relaxed text-muted">
            <p className="font-medium text-ink">
              Preliminary location screen only. It is not clearance, a land survey, title search,
              or a NEMA decision.
            </p>
            <p>
              A map pin is not a parcel boundary; confirm with a registered surveyor and the
              relevant authority. Map data © OpenStreetMap contributors.{" "}
              <Link href="/privacy" className="underline hover:text-ink">
                Privacy
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
