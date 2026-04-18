// features/deck/useDeck.ts
//
// PATCH (CoderB): Removed `seen` from the useEffect dependency array.
//
// Problem: `seen` is a Set<string> in GameState. Every MARK_SEEN action creates
// a new Set (new reference), which re-triggered the deck-build effect on every
// card advance. This caused a full deck rebuild (shuffle + rule scheduling) on
// each tap -- O(n) work per card on the hot path.
//
// Fix: Read `seen` via a ref so the effect can access the latest value during
// initial restore without re-running when seen changes during normal play.
// Normal card advancement uses next() which increments the index directly.
'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { getPackByModeAndLanguage } from '@/features/questions/repository';
import { getBarCards } from '@/features/bars/repository';
import { isBarSessionValid } from '@/features/bars/types';
import type { Card, Pack } from '@/features/questions/types';
import { scheduleRulePairs, shuffleInPlace } from './shuffler';

export function useDeck(seed: number) {
    const {
        state: { selectedMode, selectedLanguage, players, barSession, seen },
    } = useGameStore();

    const [deck, setDeck] = useState<Card[]>([]);
    const [index, setIndex] = useState(0);

    // Keep seen in a ref so the build effect can read it without depending on it.
    const seenRef = useRef(seen);
    seenRef.current = seen;

    // Build (or rebuild) the deck whenever structural inputs change.
    // `seen` is deliberately excluded -- it changes on every card advance and
    // would cause a full rebuild loop. The seen Set is only consulted once
    // during the initial fast-forward for session restore.
    useEffect(() => {
        let alive = true;

        async function load() {
            if (!selectedMode || !selectedLanguage) {
                if (alive) {
                    setDeck([]);
                    setIndex(0);
                }
                return;
            }

            const pack: Pack | undefined = await getPackByModeAndLanguage(selectedMode, selectedLanguage);
            let cards = pack?.cards ?? [];

            // Inject bar-specific cards when a bar session is active
            if (barSession && isBarSessionValid(barSession)) {
                const extra = getBarCards(barSession.slug, selectedMode, selectedLanguage);
                cards = [...cards, ...extra];
            }

            const shuffled = shuffleInPlace(cards.slice(), seed);

            // Enforce rule lifecycle & schedule offs deterministically
            const scheduled = scheduleRulePairs(shuffled, seed, { min: 8, max: 15 });

            if (alive) {
                setDeck(scheduled);

                // Fast-forward using the seen ref (not the dependency).
                // This only matters on the first load after a page refresh
                // where RESTORE_PROGRESS has populated the seen Set.
                const currentSeen = seenRef.current;
                if (currentSeen.size > 0) {
                    let resumeIndex = 0;
                    for (let i = 0; i < scheduled.length; i++) {
                        if (!currentSeen.has(scheduled[i].id)) {
                            resumeIndex = i;
                            break;
                        }
                        // If all cards are seen, resume at end of deck
                        if (i === scheduled.length - 1) {
                            resumeIndex = scheduled.length;
                        }
                    }
                    setIndex(resumeIndex);
                } else {
                    setIndex(0);
                }
            }
        }

        load();

        return () => {
            alive = false;
        };
    // Note: `seen` is read via seenRef, not as a direct dependency.
    // See the comment at the top of this effect for the rationale.
    }, [selectedMode, selectedLanguage, seed, players, barSession]);

    const current = deck[index] ?? null;
    const remaining = Math.max(deck.length - (index + (current ? 1 : 0)), 0);
    const next = () => setIndex((i) => Math.min(i + 1, deck.length));

    // Expose the full deck for offline caching
    return { deck, current, remaining, next };
}
