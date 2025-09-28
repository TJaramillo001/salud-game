'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useDeck } from '@/features/deck/useDeck';
import { useActiveRules } from '@/features/rules/useActiveRules';
import { QuestionCard } from '@/components/game/QuestionCard';
import { Button } from '@/components/ui/Button';
import { DeckHUD } from './components/DeckHUD';
import { useSwipe } from '@/hooks/useSwipe';
import { vibrate } from '@/lib/haptics';
import { nextTurnIndex, resolveTargetName } from '@/features/gameplay/turn';

export default function PlayPage() {
    const { pack, players } = useGameStore();
    const router = useRouter();
    const { addRule } = useActiveRules();

    // Guard: need a pack selected
    useEffect(() => {
        if (!pack) router.replace('/game/setup/mode');
    }, [pack, router]);

    // Seed deck deterministically-ish
    const seed = useMemo(() => players.join(',').length || 1, [players]);
    const { current, remaining, next } = useDeck(pack, seed);

    // Track turns (who is "current")
    const [turnIndex, setTurnIndex] = useState(0);
    useEffect(() => {
        if (players.length === 0) setTurnIndex(0);
    }, [players.length]);

    // Auto-apply rules exactly once when a rule card shows
    const appliedRules = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (current?.type === 'rule' && !appliedRules.current.has(current.id)) {
            addRule({ ruleId: current.ruleId, params: current.params });
            appliedRules.current.add(current.id);
        }
    }, [current, addRule]);

    // When deck ends → summary
    useEffect(() => {
        if (pack && remaining <= 0 && !current) {
            router.replace('/game/summary');
        }
    }, [remaining, current, pack, router]);

    // Swipe behavior
    const onAdvance = () => {
        if (!current) return;
        vibrate(10);
        next();
        setTurnIndex(i => nextTurnIndex(i, players.length));
    };

    const { dx, bind } = useSwipe({
        onSwipeLeft: onAdvance,
        onSwipeRight: onAdvance,
        threshold: 80,
    });

    if (!pack) return null;

    const currentPlayer = players.length ? players[turnIndex % players.length] : null;
    const subtitle =
        current && current.type !== 'rule'
            ? (resolveTargetName(current, players, turnIndex) === 'Todos'
                ? 'Todos'
                : resolveTargetName(current, players, turnIndex))
            : null;

    return (
        <main className="min-h-dvh p-6 flex flex-col items-center gap-6">
            <DeckHUD remaining={remaining} currentPlayer={currentPlayer} />

            <div className="w-full flex justify-center" {...bind}>
                {current ? <QuestionCard card={current} subtitle={subtitle} dx={dx} /> : <div>No more cards.</div>}
            </div>

            <div className="flex gap-3">
                <Button onClick={onAdvance} disabled={!current}>Siguiente</Button>
                <Button variant="ghost" onClick={() => router.replace('/game/summary')}>Terminar</Button>
            </div>

            <p className="text-xs text-neutral-400">Tip: desliza izquierda o derecha para avanzar</p>
        </main>
    );
}
