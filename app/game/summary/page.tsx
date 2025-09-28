'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/providers/GameStoreProvider';

export default function SummaryPage() {
    const router = useRouter();
    const { resetSeen } = useGameStore();

    function playAgain() {
        // Clear seen cards for the last-selected pack so the new run has a full deck
        resetSeen();
        router.replace('/game/setup/players');
    }

    return (
        <main className="min-h-dvh p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold">Game Over</h1>
            <p className="text-gray-600">Thanks for playing Salud 🍹</p>
            <div className="flex gap-3">
                <Button onClick={playAgain}>Play Again</Button>
                <Button variant="ghost" onClick={() => router.replace('/')}>Home</Button>
            </div>
        </main>
    );
}
