'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/providers/GameStoreProvider';

export default function SummaryPage() {
    const router = useRouter();
    const { startNewSession, state: { selectedMode } } = useGameStore();

    function playAgain() {
        // Fresh run: new seed + cleared runtime (seen, gameOver). Mode persists.
        startNewSession();
        router.replace('/game/play');
    }

    return (
        <main className="min-h-dvh p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold">Game Over</h1>
            <p className="text-gray-600">
                ¡Gracias por jugar Salud 🍹{selectedMode ? ` — Modo: ${selectedMode}` : ''}!
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
                <Button onClick={playAgain}>Jugar de nuevo</Button>
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
