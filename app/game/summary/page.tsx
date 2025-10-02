'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/providers/GameStoreProvider';
import { trackEvent } from '@/lib/analytics'; // <-- import your telemetry util

export default function SummaryPage() {
    const router = useRouter();
    const { startNewSession, state: { selectedMode } } = useGameStore();
    const sent = useRef(false);

    // Fire telemetry once
    useEffect(() => {
        if (!sent.current) {
            trackEvent('session_end', { mode: selectedMode });
            sent.current = true;
        }
    }, [selectedMode]);

    function playAgain() {
        startNewSession();
        router.replace('/game/play');
    }

    function rate() {
        window.open(
            'https://forms.gle/9GrR3mFqjQCTqoB89', 
            '_blank'
        );
    }

    return (
        <main className="min-h-dvh p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold">Game Over</h1>
            <p className="text-gray-600">
                ¡Gracias por jugar Salud 🍹{selectedMode ? ` — Modo: ${selectedMode}` : ''}!
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
                <Button onClick={playAgain}>Jugar de nuevo</Button>
                <Button variant="secondary" onClick={rate}>Calificar Salud</Button>
                <Button variant="ghost" onClick={() => router.replace('/game/setup/mode')}>
                    Cambiar modo
                </Button>
                <Button variant="ghost" onClick={() => router.replace('/game/setup/players')}>
                    Cambiar jugadores
                </Button>
                <Button variant="ghost" onClick={() => router.replace('/')}>Inicio</Button>
            </div>
        </main>
    );
}
