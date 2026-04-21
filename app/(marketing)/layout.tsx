import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            {children}
            <Footer />
        </>
    );
}

function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <Link href="/" aria-label="Ir al inicio" className="font-bold tracking-tight text-xl">
                    Salud
                </Link>

                <nav className="flex items-center gap-4 text-sm text-neutral-300">
                    <Link href="/#features" className="hover:text-white">
                        Caracteristicas
                    </Link>
                    <Link href="/#faq" className="hover:text-white">
                        Preguntas frecuentes
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function Footer() {
    return (
        <footer className="border-t border-neutral-800/60 py-8 text-center text-sm text-neutral-400">
            <p>&copy; {new Date().getFullYear()} Salud. Hecho para noches divertidas con amigos.</p>
        </footer>
    );
}
