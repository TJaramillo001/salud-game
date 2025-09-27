import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";


export const metadata: Metadata = {
    title: "Salud — Party Game",
    description: "Scan → Add players → Pick a mode → Play by swiping cards.",
};


export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <Header />
        <main className="mx-auto max-w-5xl px-6 pb-24">{children}</main>
        <Footer />
        </body>
        </html>
    );
}


function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <Link href="/public" className="font-bold tracking-tight text-xl">
                    Salud
                </Link>
                <nav className="flex items-center gap-4 text-sm text-neutral-300">
                    <Link href="#features" className="hover:text-white">
                        Features
                    </Link>
                    <Link href="#faq" className="hover:text-white">
                        FAQ
                    </Link>
                    <a
                        href="https://github.com/your-user/salud-game"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden hover:text-white sm:inline"
                    >
                        GitHub
                    </a>
                </nav>
            </div>
        </header>
    );
}


function Footer() {
    return (
        <footer className="border-t border-neutral-800/60 py-8 text-center text-sm text-neutral-400">
            <p>
                © {new Date().getFullYear()} Salud. Built for fun nights with friends.
            </p>
        </footer>
    );
}