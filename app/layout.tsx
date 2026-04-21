import type { Metadata } from "next";
import "./globals.css";
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
        {children}
        </ActiveRulesProvider>
        </GameStoreProvider>
        </body>
        </html>
    );
}
