// features/deck/useDeck.ts
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { getPackByModeAndLanguage } from '@/features/questions/repository';
import { getBarCards } from '@/features/bars/repository';
import { isBarSessionValid } from '@/features/bars/types';
import type { Card, Pack } from '@/features/questions/types';
import { scheduleRulePairs, shuffleInPlace } from './shuffler';

export function useDeck(seed: number) {
    const {
        state: { selectedMode, selectedLanguage, players, barSession },
    } = useGameStore();

    const [deck, setDeck] = useState<Card[]>([]);
    const [index, setIndex] = useState(0);

    // Build (or rebuild) the deck whenever inputs change
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
                setIndex(0);
            }
        }

        load();

        return () => {
            alive = false;
        };
    }, [selectedMode, selectedLanguage, seed, players, barSession]);

    const current = deck[index] ?? null;
    const remaining = Math.max(deck.length - (index + (current ? 1 : 0)), 0);
    const next = () => setIndex((i) => Math.min(i + 1, deck.length));

    return { deck, current, remaining, next };
}
