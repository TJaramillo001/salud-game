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
import { useTranslation } from '@/lib/i18n';
import { useBarSession } from '@/features/bars/useBarSession';
import { isModeAccessible } from '@/features/bars/access';
import { BarExpiredModal } from '@/components/game/BarExpiredModal';
import { trackBarEvent } from '@/lib/barAnalytics';
import { getSupabaseClient } from '@/lib/supabase';

function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export default function PlayPage() {
    const { state: { selectedMode, players, sessionId, selectedLanguage } } = useGameStore();
    const { t } = useTranslation();
    const router = useRouter();
    const { addRule, clearRule, clearAll } = useActiveRules();
    const { barSession, isBarActive } = useBarSession();

    // Bar session expiry tracking
    const [showBarExpired, setShowBarExpired] = useState(false);
    const wasBarActive = useRef(false);
    useEffect(() => {
        if (isBarActive) wasBarActive.current = true;
        if (wasBarActive.current && !isBarActive && barSession === null) {
            setShowBarExpired(true);
        }
    }, [isBarActive, barSession]);

    function handleBarExpiredDismiss() {
        setShowBarExpired(false);
        if (selectedMode && !isModeAccessible(selectedMode, null)) {
            router.replace('/game/setup/mode');
        }
    }

    // Track session start in Supabase
    const sessionTracked = useRef(false);
    useEffect(() => {
        if (sessionTracked.current || !sessionId || !selectedMode || !selectedLanguage) return;
        sessionTracked.current = true;
        const supabase = getSupabaseClient();
        if (!supabase) return;
        supabase.from('game_sessions').insert({
            session_id: sessionId,
            mode: selectedMode,
            language: selectedLanguage,
            player_count: players.length,
            bar_slug: barSession?.slug ?? null,
        }).then(({ error }) => {
            if (error) console.warn('game_sessions insert failed:', error.message);
        });
    }, [sessionId, selectedMode, selectedLanguage, players.length, barSession]);

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

    // Analytics counters (refs to avoid stale closures in flushSessionStats)
    const cardsSwiped = useRef(0);
    const drinksNudged = useRef(0);

    // Weighted-decay player distribution
    const [weights, setWeights] = useState<number[]>(() => players.map(() => 1));
    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
    useEffect(() => {
        setWeights(Array(players.length).fill(1));
        setCurrentPlayerIdx(0);
        cardsSwiped.current = 0;
        drinksNudged.current = 0;
        flushedSession.current = false;
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

    // Flush analytics counters to Supabase
    const flushedSession = useRef(false);
    const flushSessionStats = async () => {
        if (flushedSession.current || !sessionId) return;
        flushedSession.current = true;
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { error } = await supabase.from('game_sessions')
            .update({
                cards_swiped: cardsSwiped.current,
                drinks_nudged: drinksNudged.current,
                ended_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId);
        if (error) console.warn('game_sessions update failed:', error.message);
    };

    // End of deck (only for the normal deck)
    useEffect(() => {
        if (selectedMode && !isEmptyDeck && remaining <= 0 && !current) {
            flushSessionStats().then(() => router.replace('/game/summary'));
        }
    }, [remaining, current, selectedMode, router, isEmptyDeck]);

    // Advance (handles either flow)
    const onAdvance = () => {
        const hasCard = usingOffline ? !!offlineCurrent : !!current;
        if (!hasCard) return;
        vibrate(10); // 10ms pulse — just enough tactile feedback without being intrusive

        // Analytics counters
        const card = (usingOffline ? offlineCurrent : current) as Card | undefined;
        cardsSwiped.current += 1;
        if (card?.drink_count) {
            drinksNudged.current += card.drink_count!;
        }

        // Bar analytics: track card swipe + bar card shown
        if (isBarActive && barSession) {
            const card = (usingOffline ? offlineCurrent : current) as Card | undefined;
            trackBarEvent('card_swipe', barSession.slug, null, {
                card_id: card?.id,
                card_kind: card?.kind,
                mode: selectedMode,
            });
            if (card?.source === 'bar') {
                trackBarEvent('bar_card_shown', barSession.slug, null, {
                    card_id: card.id,
                    card_text: card.text?.slice(0, 80),
                });
            }
        }

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
            {t.play.offline.banner}
        </div>
    ) : null;

    // --- Empty & no offline fallback ---
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
                        dx={0}                 // no swipe: no tilt/translate
                        players={players}
                        actors={actors}
                        kindLabels={t.card.kind}
                        altPrefix={t.card.alt}
                        renderFallbacks={t.render}
                        barBadge={isBarActive ? t.bar.badge : undefined}
                    />
                ) : <div />}
            </div>

            {/* Footer — Siguiente is now on the right */}
            <footer className="fixed bottom-4 inset-x-0 px-6">
                <div className="mx-auto max-w-md flex gap-3">
                    <Button
                        className="flex-1"
                        variant="ghost"
                        onClick={async () => { await flushSessionStats(); router.replace('/game/summary'); }}
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
