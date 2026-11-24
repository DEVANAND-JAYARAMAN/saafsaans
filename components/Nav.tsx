"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Daily Plan" },
  { href: "/indoor", label: "Indoor Air" },
  { href: "/commute", label: "Commute" },
  { href: "/community", label: "Community" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6"
      >
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span aria-hidden className="text-xl">🌬️</span>
          <span className="text-lg">
            Saaf<span className="text-brand-400">Saans</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname === l.href ? "bg-white/10 text-white" : "text-white/70 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/setup" className="btn-primary ml-2 text-sm">
              My Household
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="btn-ghost text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </nav>

      {open && (
        <ul id="mobile-menu" className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {[...LINKS, { href: "/setup", label: "My Household" }].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
                className={clsx(
                  "block rounded-lg px-3 py-2.5 font-medium",
                  pathname === l.href ? "bg-white/10 text-white" : "text-white/80",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
