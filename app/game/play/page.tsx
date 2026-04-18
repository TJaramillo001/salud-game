// app/game/play/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, PLAY_PROGRESS_STORAGE_KEY } from '@/providers/GameStoreProvider';
import { useDeck } from '@/features/deck/useDeck';
import { usePlayerRotation } from '@/features/gameplay/usePlayerRotation';
import { useSessionAnalytics } from '@/features/gameplay/useSessionAnalytics';
import { useBarExpiry } from '@/features/gameplay/useBarExpiry';
import { useRuleLifecycle } from '@/features/gameplay/useRuleLifecycle';
import { useOfflineDeck } from '@/features/gameplay/useOfflineDeck';
import { QuestionCard } from '@/components/game/QuestionCard';
import { Button } from '@/components/ui/Button';
import { DeckHUD } from './components/DeckHUD';
import { vibrate } from '@/lib/haptics';
import { resolveTargetName } from '@/features/gameplay/turn';
import type { Card } from '@/features/questions/types';
import { isOnline } from '@/lib/offline';
import { useTranslation } from '@/lib/i18n';
import { BarExpiredModal } from '@/components/game/BarExpiredModal';

function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export default function PlayPage() {
    const {
        state: { selectedMode, players, sessionId, selectedLanguage, hydrated },
        dispatch,
    } = useGameStore();
    const { t } = useTranslation();
    const router = useRouter();

    // --- Bar session expiry ---
    const { barSession, isBarActive, showBarExpired, handleBarExpiredDismiss } = useBarExpiry(selectedMode);

    // --- Navigation guards ---
    useEffect(() => {
        if (!hydrated) return;
        if (!selectedMode) router.replace('/game/setup/mode');
    }, [selectedMode, router, hydrated]);
    useEffect(() => {
        if (!hydrated) return;
        if (!players || players.length === 0) router.replace('/game/setup/players');
    }, [players, router, hydrated]);

    // --- Stable seed ---
    const [runId, setRunId] = useState(0);
    const seed = useMemo(() => {
        const names = players.map(p => p.name).join('|');
        return cyrb53(`${selectedMode ?? 'unknown'}|${names}|run:${runId}`);
    }, [selectedMode, players, runId]);

    // --- Restore progress from localStorage on refresh ---
    const [progressRestored, setProgressRestored] = useState(false);
    useEffect(() => {
        if (!hydrated || progressRestored) return;
        try {
            const raw = window.localStorage.getItem(PLAY_PROGRESS_STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                // Only restore if the saved progress matches the current session context
                // (same mode+players hash would produce the same seed, so we check sessionId)
                if (saved.sessionId && saved.seen && Array.isArray(saved.seen)) {
                    dispatch({
                        type: 'RESTORE_PROGRESS',
                        seen: new Set(saved.seen as string[]),
                        cardsSwiped: saved.cardsSwiped ?? 0,
                        drinksNudged: saved.drinksNudged ?? 0,
                        sessionId: saved.sessionId,
                        seed: saved.seed ?? seed,
                    });
                }
            }
        } catch { /* ignore parse errors */ }
        setProgressRestored(true);
    }, [hydrated, progressRestored, dispatch, seed]);

    // --- Primary deck ---
    const { current, remaining, next, deck } = useDeck(seed);
    const isEmptyDeck = !deck || deck.length === 0;

    // --- Offline fallback ---
    const { usingOffline, offlineCurrent, advanceOffline } = useOfflineDeck(
        deck as Card[] | undefined,
        isEmptyDeck,
        runId,
    );

    // --- Player rotation (seeded for determinism) ---
    const { currentPlayerIdx, actors, advance: advancePlayer, resetRotation } = usePlayerRotation(
        players.length,
        seed,
    );

    // Reset rotation on reshuffle
    useEffect(() => {
        resetRotation(players.length);
    }, [runId, players.length, resetRotation]);

    // --- Analytics ---
    const analytics = useSessionAnalytics({
        sessionId,
        selectedMode,
        selectedLanguage,
        playerCount: players.length,
        barSession,
        isBarActive,
    });

    // Reset analytics counters on reshuffle
    useEffect(() => {
        analytics.resetCounters();
    }, [runId, analytics]);

    // --- Rule lifecycle ---
    const activeCard = (usingOffline ? offlineCurrent : current) as Card | undefined;
    useRuleLifecycle(activeCard ?? null, runId);

    // --- End of deck ---
    useEffect(() => {
        if (selectedMode && !isEmptyDeck && remaining <= 0 && !current) {
            analytics.flushSessionStats().then(() => router.replace('/game/summary'));
        }
    }, [remaining, current, selectedMode, router, isEmptyDeck, analytics]);

    // --- Advance handler ---
    const onAdvance = () => {
        const card = activeCard;
        if (!card) return;
        vibrate(10);

        analytics.trackCardAdvance(card);

        if (usingOffline) {
            advanceOffline();
        } else {
            next();
        }
        advancePlayer();
    };

    // --- Subtitle ---
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
            {t.play.offline.banner}
        </div>
    ) : null;

    // --- Empty deck, no offline fallback ---
    if (isEmptyDeck && !usingOffline) {
        return (
            <main className="min-h-dvh p-6 pb-28 flex flex-col items-center gap-6">
                <DeckHUD />
                {OfflineBanner}
                <div className="max-w-md text-center space-y-3">
                    <h2 className="text-xl font-semibold">{t.play.empty.title}</h2>
                    <p className="text-sm text-neutral-500">
                        {t.play.empty.description.replace('{mode}', selectedMode ?? '')}
                    </p>
                    <ul className="text-sm text-neutral-500 list-disc text-left pl-5 space-y-1">
                        <li>{t.play.empty.tipPlayers}</li>
                        <li>{t.play.empty.tipReshuffle}</li>
                    </ul>
                    <p className="text-xs text-neutral-400 pt-1">{t.play.empty.devTip}</p>
                </div>
                <footer className="fixed bottom-4 inset-x-0 px-6">
                    <div className="mx-auto max-w-md flex gap-3">
                        <Button className="flex-1" onClick={() => setRunId(x => x + 1)}>{t.play.btn.reshuffle}</Button>
                        <Button className="flex-1" variant="ghost" onClick={() => router.replace('/game/setup/mode')}>{t.play.btn.changeMode}</Button>
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
                aria-label={t.play.aria.advance}
                tabIndex={0}
                onClick={onAdvance}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onAdvance()}
            >
                {showCard ? (
                    <QuestionCard
                        card={activeCard as Card}
                        subtitle={subtitle ?? undefined}
                        dx={0}
                        players={players}
                        actors={actors}
                        kindLabels={t.card.kind}
                        altPrefix={t.card.alt}
                        renderFallbacks={t.render}
                        barBadge={isBarActive ? t.bar.badge : undefined}
                    />
                ) : <div />}
            </div>

            {/* Footer */}
            <footer className="fixed bottom-4 inset-x-0 px-6">
                <div className="mx-auto max-w-md flex gap-3">
                    <Button
                        className="flex-1"
                        variant="ghost"
                        onClick={async () => { await analytics.flushSessionStats(); router.replace('/game/summary'); }}
                    >
                        {t.play.btn.end}
                    </Button>
                    <Button className="flex-1" onClick={onAdvance} disabled={!showCard}>
                        {t.play.btn.next}
                    </Button>
                </div>
            </footer>

            <p className="text-xs text-neutral-400">{t.play.hint.tap}</p>

            {showBarExpired && (
                <BarExpiredModal
                    barName={barSession?.name ?? ''}
                    onContinueFree={handleBarExpiredDismiss}
                />
            )}
        </main>
    );
}
