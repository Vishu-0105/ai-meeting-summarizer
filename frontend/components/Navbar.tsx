"use client";

import Link from "next/link";
import { NotebookPen } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/meetings", label: "Meetings" },
  { href: "/#how-it-works", label: "How it works" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8"
      >
        <Link href="/" className="flex items-center gap-2 text-accent">
          <NotebookPen className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          <span className="font-display text-xl italic text-ink">Fieldnote</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/meetings"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent-deep focus-visible:outline-offset-4"
        >
          Upload meeting
        </Link>
      </nav>
    </header>
  );
}
