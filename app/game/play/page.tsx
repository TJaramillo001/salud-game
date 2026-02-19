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
import { vibrate } from '@/lib/haptics';
import { weightedPickIndex, applyDecay, resolveTargetName } from '@/features/gameplay/turn';
import type { Card } from '@/features/questions/types';
import { saveLastDeck, getLastDeck, isOnline } from '@/lib/offline';

function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export default function PlayPage() {
    const { state: { selectedMode, players } } = useGameStore();
    const router = useRouter();
    const { addRule, clearRule, clearAll } = useActiveRules();

    // Require mode and players
    useEffect(() => { if (!selectedMode) router.replace('/game/setup/mode'); }, [selectedMode, router]);
    useEffect(() => { if (!players || players.length === 0) router.replace('/game/setup/players'); }, [players, router]);

    // Stable seed
    const [runId, setRunId] = useState(0);
    const seed = useMemo(() => {
        const names = players.map(p => p.name).join('|');
        return cyrb53(`${selectedMode ?? 'unknown'}|${names}|run:${runId}`);
    }, [selectedMode, players, runId]);

    // Primary deck (normal flow)
    const { current, remaining, next, deck } = useDeck(seed);
    const isEmptyDeck = !deck || deck.length === 0;

    // --- Persist the latest playable deck for offline fallback ---
    useEffect(() => {
        try {
            if (deck && deck.length > 0) {
                saveLastDeck(deck as Card[]);
            }
        } catch { /* ignore */ }
    }, [deck]);

    // Offline fallback deck (when generation fails or offline)
    const [offlineDeck, setOfflineDeck] = useState<Card[] | null>(null);
    const [offlineIndex, setOfflineIndex] = useState(0);

    useEffect(() => {
        if (!isEmptyDeck) {
            // Online deck loaded — discard any stale offline fallback
            setOfflineDeck(null);
            setOfflineIndex(0);
            return;
        }
        const cached = getLastDeck();
        if (cached && cached.length > 0) {
            setOfflineDeck(cached);
            setOfflineIndex(0);
        }
    }, [isEmptyDeck, runId]);

    const usingOffline = isEmptyDeck && offlineDeck && offlineDeck.length > 0;
    const offlineCurrent = usingOffline ? offlineDeck![offlineIndex] : null;

    // Weighted-decay player distribution
    const [weights, setWeights] = useState<number[]>(() => players.map(() => 1));
    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
    useEffect(() => {
        setWeights(Array(players.length).fill(1));
        setCurrentPlayerIdx(0);
    }, [runId, players.length]);

    // Rule lifecycle once per card (applies to both online/offline flows)
    const processed = useRef<Set<string>>(new Set());
    useEffect(() => {
        processed.current.clear();
        clearAll();
    }, [runId, clearAll]);
    useEffect(() => {
        const active = (usingOffline ? offlineCurrent : current) as Card | undefined;
        if (!active || !active.ruleId) return;
        const isOn = active.kind === 'rule_on';
        const isOff = active.kind === 'rule_off';
        if (!isOn && !isOff) return;
        if (processed.current.has(active.id)) return;
        processed.current.add(active.id);
        if (isOn) addRule({ ruleId: active.ruleId, params: { phase: 'on' } });
        else clearRule(active.ruleId);
    }, [current, offlineCurrent, usingOffline, addRule, clearRule]);

    // End of deck (only for the normal deck)
    useEffect(() => {
        if (selectedMode && !isEmptyDeck && remaining <= 0 && !current) router.replace('/game/summary');
    }, [remaining, current, selectedMode, router, isEmptyDeck]);

    // Advance (handles either flow)
    const onAdvance = () => {
        const hasCard = usingOffline ? !!offlineCurrent : !!current;
        if (!hasCard) return;
        vibrate(10); // 10ms pulse — just enough tactile feedback without being intrusive

        if (usingOffline) {
            setOfflineIndex((i) => (i + 1 < (offlineDeck?.length ?? 0) ? i + 1 : i));
        } else {
            next();
        }
        const nextWeights = applyDecay(weights, currentPlayerIdx);
        const nextIdx = weightedPickIndex(nextWeights);
        setWeights(nextWeights);
        setCurrentPlayerIdx(nextIdx);
    };

    // Actors (for {A}/{B}/{STARTER})
    const actors = useMemo(() => {
        if (players.length === 0) return {};
        const A = currentPlayerIdx, B = (currentPlayerIdx + 1) % players.length, STARTER = A;
        return { A, B, STARTER };
    }, [currentPlayerIdx, players.length]);

    // Subtitle
    const activeCard = (usingOffline ? offlineCurrent : current) as Card | undefined;
    const isRuleCard = activeCard?.kind === 'rule_on' || activeCard?.kind === 'rule_off';
    const rawSubtitle =
        activeCard && !isRuleCard
            ? resolveTargetName?.(activeCard as Card, players.map(p => p.name), currentPlayerIdx) ?? null
            : null;

    const subtitle = typeof rawSubtitle === 'string' ? rawSubtitle : null;

    // --- Offline banner ---
    const offline = !isOnline();
    const OfflineBanner = offline ? (
        <div className="text-[11px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded">
            Modo sin conexión: usando contenido en caché cuando sea posible.
        </div>
    ) : null;

    // --- Empty & no offline fallback ---
    if (isEmptyDeck && !usingOffline) {
        return (
            <main className="min-h-dvh p-6 pb-28 flex flex-col items-center gap-6">
                <DeckHUD />
                {OfflineBanner}
                <div className="max-w-md text-center space-y-3">
                    <h2 className="text-xl font-semibold">No se pudo armar el mazo</h2>
                    <p className="text-sm text-neutral-500">
                        El modo <b>{selectedMode}</b> generó 0 cartas con los jugadores/condiciones actuales.
                    </p>
                    <ul className="text-sm text-neutral-500 list-disc text-left pl-5 space-y-1">
                        <li>Prueba con más jugadores o cambia el modo.</li>
                        <li>O rearmemos el mazo con una nueva semilla.</li>
                    </ul>
                    <p className="text-xs text-neutral-400 pt-1">Tip: si ves esto seguido, revisa las constraints del pack.</p>
                </div>
                <footer className="fixed bottom-4 inset-x-0 px-6">
                    <div className="mx-auto max-w-md flex gap-3">
                        <Button className="flex-1" onClick={() => setRunId(x => x + 1)}>Rearmar mazo</Button>
                        <Button className="flex-1" variant="ghost" onClick={() => router.replace('/game/setup/mode')}>Cambiar modo</Button>
                    </div>
                </footer>
            </main>
        );
    }

    // --- Normal or offline deck rendering ---
    const showCard = activeCard != null;

    return (
        <main className="min-h-dvh p-6 pb-28 flex flex-col items-center gap-6">
            <DeckHUD />
            {OfflineBanner}

            {/* Tap anywhere on the card area to advance */}
            <div
                className="w-full flex justify-center py-2 sm:py-4 cursor-pointer"
                role="button"
                aria-label="Avanzar"
                tabIndex={0}
                onClick={onAdvance}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onAdvance()}
            >
                {showCard ? (
                    <QuestionCard
                        card={activeCard as Card}
                        subtitle={subtitle ?? undefined}
                        dx={0}                 // no swipe: no tilt/translate
                        players={players}
                        actors={actors}
                    />
                ) : <div />}
            </div>

            {/* Footer — Siguiente is now on the right */}
            <footer className="fixed bottom-4 inset-x-0 px-6">
                <div className="mx-auto max-w-md flex gap-3">
                    <Button
                        className="flex-1"
                        variant="ghost"
                        onClick={() => router.replace('/game/summary')}
                    >
                        Terminar
                    </Button>
                    <Button className="flex-1" onClick={onAdvance} disabled={!showCard}>
                        Siguiente
                    </Button>
                </div>
            </footer>

            <p className="text-xs text-neutral-400">Tip: toca la carta para avanzar</p>
        </main>
    );
}
