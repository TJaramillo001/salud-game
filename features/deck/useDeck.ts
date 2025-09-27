'use client';

import { useMemo, useState } from 'react';
import type { Card, Pack } from '@/features/questions/types';
import { makeCardKey, isSeen, markSeen } from './antiRepeat';
import { shuffleInPlace } from './shuffler';

export function useDeck(pack: Pack | null, seed?: number) {
    const [index, setIndex] = useState(0);

    const deck = useMemo<Card[]>(() => {
        if (!pack) return [];
        const filtered = pack.cards.filter(c => !isSeen(pack.id, makeCardKey(pack.id, pack.version, c.id)));
        return shuffleInPlace([...filtered], seed);
    }, [pack, seed]);

    const remaining = deck.length - index;
    const current = deck[index] ?? null;

    function next() {
        if (!pack || !current) return;
        markSeen(pack.id, makeCardKey(pack.id, pack.version, current.id));
        setIndex(i => i + 1);
    }

    function resetPosition() {
        setIndex(0);
    }

    return { deck, index, current, next, remaining, resetPosition };
}
