'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useDeck } from '@/features/deck/useDeck';
import { QuestionCard } from '@/components/game/QuestionCard';
import { Button } from '@/components/ui/Button';

export default function PlayPage() {
    const { pack, players } = useGameStore();
    const router = useRouter();

    // Seed with player count for fun determinism
    const seed = useMemo(() => players.join(',').length || 1, [players]);
    const { current, remaining, next } = useDeck(pack, seed);

    useEffect(() => {
        if (!pack) router.replace('/game/setup/mode');
    }, [pack, router]);

    useEffect(() => {
        if (pack && remaining <= 0 && !current) {
            router.replace('/game/summary');
        }
    }, [remaining, current, pack, router]);

    if (!pack) return null;

    return (
        <main className="min-h-dvh p-6 flex flex-col items-center gap-6">
            <div className="text-sm text-gray-500">Remaining: {remaining}</div>

            {current ? <QuestionCard card={current} /> : <div>No more cards.</div>}

            <div className="flex gap-3">
                <Button onClick={next} disabled={!current}>Next</Button>
                <Button variant="ghost" onClick={() => router.replace('/game/summary')}>End Game</Button>
            </div>
        </main>
    );
}
