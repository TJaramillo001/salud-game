import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { GameStoreProvider } from '@/providers/GameStoreProvider';
import { ActiveRulesProvider } from '@/features/rules/useActiveRules';

export const metadata: Metadata = {
    title: "Salud — Juego de fiesta",
    description: "Escanea → Agrega jugadores → Elige un modo → Juega deslizando cartas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark">
        <head>
            <meta name="color-scheme" content="dark" />
            <meta name="theme-color" content="#0a0a0a" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <GameStoreProvider>
        <ActiveRulesProvider>
        <Header />
        <main className="mx-auto max-w-5xl px-6 pb-24">{children}</main>
        <Footer />
        </ActiveRulesProvider>
        </GameStoreProvider>
        </body>
        </html>
    );
}

function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                {/* Marca → siempre al inicio */}
                <Link href="/" aria-label="Ir al inicio" className="font-bold tracking-tight text-xl">
                    Salud
                </Link>

                <nav className="flex items-center gap-4 text-sm text-neutral-300">
                    {/* Anclas absolutas para funcionar también desde /game/* */}
                    <Link href="/#features" className="hover:text-white">
                        Características
                    </Link>
                    <Link href="/#faq" className="hover:text-white">
                        Preguntas frecuentes
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
            <p>© {new Date().getFullYear()} Salud. Hecho para noches divertidas con amigos.</p>
        </footer>
    );
}
