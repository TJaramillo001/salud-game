// features/deck/useDeck.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { getPackById } from '@/features/questions/repository';
import type { Card, Pack } from '@/features/questions/types';
import { scheduleRulePairs, shuffleInPlace } from './shuffler';

export function useDeck(seed: number) {
    const {
        state: { selectedMode, players },
    } = useGameStore();

    const [deck, setDeck] = useState<Card[]>([]);
    const [index, setIndex] = useState(0);

    // Build (or rebuild) the deck whenever inputs change
    useEffect(() => {
        let alive = true;

        async function load() {
            if (!selectedMode) {
                if (alive) {
                    setDeck([]);
                    setIndex(0);
                }
                return;
            }

            const pack: Pack | undefined = await getPackById(selectedMode);
            const cards = pack?.cards ?? [];

            // You can inject future constraints/filters here (by players, gender, etc.)
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
    }, [selectedMode, seed, players]);

    const current = deck[index] ?? null;
    const remaining = Math.max(deck.length - (index + (current ? 1 : 0)), 0);
    const next = () => setIndex((i) => Math.min(i + 1, deck.length));

    return { deck, current, remaining, next };
}
