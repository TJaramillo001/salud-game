'use client';

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function MarketingPage() {
    return (
        <section className="pt-16">
            {/* Hero */}
            <div className="mx-auto grid max-w-5xl gap-10 px-2 text-center sm:gap-12">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                    Salud
                </h1>
                <p className="mx-auto max-w-2xl text-balance text-neutral-300 sm:text-lg">
                    Un juego social rápido: escanea, agrega jugadores, elige un modo y
                    desliza cartas. Perfecto para pre, rumba, parejas, after y más.
                </p>
                <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
                    <Link href="/game/setup/players">
                        <Button size="lg" variant="primary">Empezar ahora</Button>
                    </Link>
                    <a href="#features">
                        <Button size="lg" variant="secondary">
                            Ver características
                        </Button>
                    </a>
                </div>
            </div>

            {/* Feature grid */}
            <div
                id="features"
                className="mx-auto mt-20 grid max-w-5xl gap-6 px-2 sm:grid-cols-3"
            >
                {[
                    {
                        title: "Añade jugadores",
                        desc: "Nombres rápidos, sin fricción. Soporta 1–12 jugadores.",
                    },
                    {
                        title: "Modos de juego",
                        desc: "Pre, Rumba, Couple, Afterparty, Hot & Sexy (más adelante).",
                    },
                    {
                        title: "Cartas por swipe",
                        desc: "Gestos fluidos para mantener el ritmo de la noche.",
                    },
                ].map((f) => (
                    <div
                        key={f.title}
                        className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 text-left"
                    >
                        <h3 className="text-lg font-semibold">{f.title}</h3>
                        <p className="mt-2 text-sm text-neutral-300">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="mx-auto mt-16 flex max-w-5xl justify-center">
                <Link href="/game/setup/players">
                    <Button size="lg" variant="ghost" className="border border-neutral-800">
                        Crear partida
                    </Button>
                </Link>
            </div>

            {/* FAQ */}
            <div id="faq" className="mx-auto mt-24 max-w-3xl px-2">
                <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
                <div className="mt-6 space-y-6 text-neutral-300">
                    <details className="rounded-2xl border border-neutral-800 p-4">
                        <summary className="cursor-pointer text-white">
                            ¿Necesito cuenta?
                        </summary>
                        <p className="mt-2 text-sm">
                            No por ahora: juegas directo en el navegador.
                        </p>
                    </details>
                    <details className="rounded-2xl border border-neutral-800 p-4">
                        <summary className="cursor-pointer text-white">
                            ¿Funciona offline?
                        </summary>
                        <p className="mt-2 text-sm">
                            La MVP requiere conexión. PWA llegará después.
                        </p>
                    </details>
                </div>
            </div>
        </section>
    );
}
