// app/game/play/page.tsx
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
import type { Card } from '@/features/questions/types';

// tiny hash for seed; avoids Date.now() jitter each render
function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 =
        Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
        Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
        Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
        Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export default function PlayPage() {
    const {
        state: { selectedMode, players },
    } = useGameStore();

    const router = useRouter();
    const { addRule, clearRule } = useActiveRules();

    // 1) Require mode and players
    useEffect(() => {
        if (!selectedMode) router.replace('/game/setup/mode');
    }, [selectedMode, router]);

    useEffect(() => {
        if (!players || players.length === 0) {
            router.replace('/game/setup/players');
        }
    }, [players, router]);

    // 2) Stable per-run seed depending on mode + player names (not objects)
    const [runId, setRunId] = useState(0);
    const seed = useMemo(() => {
        const names = players.map((p) => p.name).join('|');
        const key = `${selectedMode ?? 'unknown'}|${names}|run:${runId}`;
        return cyrb53(key);
    }, [selectedMode, players, runId]);

    // 3) Build deck for the selected mode (hook reads mode from store)
    const { current, remaining, next, deck } = useDeck(seed);

    // 4) Sanity check: deck built empty → show recovery UI (no import fallbacks)
    const isEmptyDeck = !deck || deck.length === 0;

    // 5) Track whose turn it is
    const [turnIndex, setTurnIndex] = useState(0);
    useEffect(() => {
        if (players.length === 0) setTurnIndex(0);
    }, [players.length]);

    // 6) Apply rule lifecycle exactly once per card
    const processed = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!current || !current.ruleId) return;

        const isOn = current.kind === 'rule_on';
        const isOff = current.kind === 'rule_off';

        if (!isOn && !isOff) return;
        if (processed.current.has(current.id)) return; // idempotent per card id
        processed.current.add(current.id);

        if (isOn) {
            addRule({ ruleId: current.ruleId, params: { phase: 'on' } });
        } else {
            clearRule(current.ruleId);
        }
    }, [current, addRule, clearRule]);

    // 7) End of deck → summary (but not for the empty-deck sanity state)
    useEffect(() => {
        if (selectedMode && !isEmptyDeck && remaining <= 0 && !current) {
            router.replace('/game/summary');
        }
    }, [remaining, current, selectedMode, router, isEmptyDeck]);

    // 8) Advancing
    const onAdvance = () => {
        if (!current) return;
        vibrate(10);
        next();
        setTurnIndex((i) => nextTurnIndex(i, players.length));
    };

    // 9) Swipe
    const { dx, bind } = useSwipe({
        onSwipeLeft: onAdvance,
        onSwipeRight: onAdvance,
        threshold: 80,
    });

    // 10) Build a default actors map so {A}/{B}/{STARTER} resolve
    const actors = useMemo(() => {
        if (players.length === 0) return {};
        const A = turnIndex % players.length;
        const B = (turnIndex + 1) % players.length;
        const STARTER = A;
        return { A, B, STARTER };
    }, [turnIndex, players.length]);

    // 11) Subtitle resolution — must be a string, never an object
    const isRuleCard = current?.kind === 'rule_on' || current?.kind === 'rule_off';
    const rawSubtitle =
        current && !isRuleCard
            ? resolveTargetName?.(current as Card, players.map((p) => p.name), turnIndex) ?? null
            : null;

    const subtitle =
        typeof rawSubtitle === 'string'
            ? rawSubtitle
            : rawSubtitle !== null &&
            typeof rawSubtitle === 'object' &&
            'name' in rawSubtitle
                ? (rawSubtitle as { name: string }).name
                : null;

    // 12) Empty deck recovery UI
    if (isEmptyDeck) {
        return (
            <main className="min-h-dvh p-6 pb-28 flex flex-col items-center gap-6">
                <DeckHUD />
                <div className="max-w-md text-center space-y-3">
                    <h2 className="text-xl font-semibold">No se pudo armar el mazo</h2>
                    <p className="text-sm text-neutral-500">
                        El modo <b>{selectedMode}</b> generó 0 cartas con los jugadores/condiciones actuales.
                    </p>
                    <ul className="text-sm text-neutral-500 list-disc text-left pl-5 space-y-1">
                        <li>Prueba con más jugadores o cambia el modo.</li>
                        <li>O rearmemos el mazo con una nueva semilla.</li>
                    </ul>
                    <p className="text-xs text-neutral-400 pt-1">
                        Tip: si ves esto seguido, revisa las constraints del pack.
                    </p>
                </div>

                {/* Fixed footer with actions */}
                <footer className="fixed bottom-4 inset-x-0 px-6">
                    <div className="mx-auto max-w-md flex gap-3">
                        <Button className="flex-1" onClick={() => setRunId((x) => x + 1)}>
                            Rearmar mazo
                        </Button>
                        <Button
                            className="flex-1"
                            variant="ghost"
                            onClick={() => router.replace('/game/setup/mode')}
                        >
                            Cambiar modo
                        </Button>
                    </div>
                </footer>
            </main>
        );
    }

    // 13) Normal play UI (no progress displayed)
    return (
        <main className="min-h-dvh p-6 pb-28 flex flex-col items-center gap-6">
            <DeckHUD />

            {/* Card area */}
            <div className="w-full flex justify-center" {...bind}>
                {current ? (
                    <QuestionCard
                        card={current as Card}
                        subtitle={subtitle ?? undefined} // must be string
                        dx={dx}
                        players={players}              // pass Player[] so placeholders can resolve
                        actors={actors}                // default mapping for {A},{B},{STARTER}
                    />
                ) : (
                    <div />
                )}
            </div>

            {/* Fixed footer with persistent actions */}
            <footer className="fixed bottom-4 inset-x-0 px-6">
                <div className="mx-auto max-w-md flex gap-3">
                    <Button className="flex-1" onClick={onAdvance} disabled={!current}>
                        Siguiente
                    </Button>
                    <Button
                        className="flex-1"
                        variant="ghost"
                        onClick={() => router.replace('/game/summary')}
                    >
                        Terminar
                    </Button>
                </div>
            </footer>

            <p className="text-xs text-neutral-400">Tip: desliza izquierda o derecha para avanzar</p>
        </main>
    );
}
