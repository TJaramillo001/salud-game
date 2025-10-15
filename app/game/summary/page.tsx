// app/game/summary/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useActiveRules } from '@/features/rules/useActiveRules';
import { trackEvent } from '@/lib/analytics';

// Minimal ES labels so we don't leak raw IDs like "night_out"
const MODE_LABEL_ES: Record<string, string> = {
    pre: 'Pre',
    night_out: 'Rumba',
    couple: 'Pareja',
    afterparty: 'After',
    hot_and_sexy: 'Hot & Sexy',
};

export default function SummaryPage() {
    const router = useRouter();
    const {
        startNewSession,
        state: { selectedMode },
    } = useGameStore();
    const { clearAll } = useActiveRules();
    const sent = useRef(false);

    // Telemetry once
    useEffect(() => {
        if (!sent.current) {
            trackEvent('session_end', { mode: selectedMode });
            sent.current = true;
        }
    }, [selectedMode]);

    // Clear any active rules once
    useEffect(() => {
        clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function playAgain() {
        clearAll(); // safety
        startNewSession();
        router.replace('/game/play');
    }

    function rate() {
        window.open('https://forms.gle/9GrR3mFqjQCTqoB89', '_blank');
    }

    function changeSetup() {
        // Unify "Cambiar modo" + "Cambiar jugadores"
        router.replace('/game/setup/players');
    }

    const modeLabel = MODE_LABEL_ES[selectedMode ?? ''] ?? 'desconocido';

    return (
        <main className="min-h-dvh px-6 pb-10 pt-8 flex flex-col items-center">
            <div className="w-full max-w-sm text-center space-y-5">
                <h1 className="text-2xl font-semibold">Fin de la partida</h1>

                <p className="text-sm text-neutral-400">
                    ¡Gracias por jugar Salud 🍹 — Modo:{' '}
                    <span className="font-medium">{modeLabel}</span>!
                </p>

                {/* Actions: single-column stack on mobile */}
                <div className="pt-2 space-y-3">
                    <Button size="lg" className="w-full" onClick={playAgain}>
                        Jugar de nuevo
                    </Button>

                    <Button size="lg" variant="secondary" className="w-full" onClick={changeSetup}>
                        Cambiar modo
                    </Button>

                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => router.replace('/')}>
                            Inicio
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={rate}>
                            Calificar Salud
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
