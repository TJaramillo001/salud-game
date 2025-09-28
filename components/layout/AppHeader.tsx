// components/layout/AppHeader.tsx (or wherever your header is)
'use client';
import Link from 'next/link';

export function AppHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/70 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
                <Link href="/" aria-label="Go to homepage" className="font-semibold text-white">
                    Salud
                </Link>

                <nav className="flex items-center gap-6 text-sm text-neutral-300">
                    <Link href="/#features">Features</Link>
                    <Link href="/#faq">FAQ</Link>
                    <a href="https://github.com/..." target="_blank" rel="noreferrer">GitHub</a>
                </nav>
            </div>
        </header>
    );
}
