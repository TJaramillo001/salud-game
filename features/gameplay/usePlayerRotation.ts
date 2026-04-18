// features/gameplay/usePlayerRotation.ts
//
// Extracted hook: manages weighted-decay player selection.
// Previously inlined in app/game/play/page.tsx (weights state, currentPlayerIdx,
// applyDecay/weightedPickIndex calls).
//
// Design decisions:
// - Uses seeded PRNG for deterministic player rotation (fixes Bug 8 where
//   Math.random in weightedPickIndex broke session reproducibility on refresh).
// - Accepts a seed parameter so that the same seed + same advance sequence
//   always produces the same player order.
// - Exposes `advance()` which returns the next player index and updates weights.
// - `actors` is memoized and only changes when currentPlayerIdx or player count changes.

'use client';

import { useState, useMemo, useCallback } from 'react';
import { applyDecay } from './turn';
import { mulberry32 } from '@/lib/prng';

export type Actors = {
    A: number;
    B: number;
    STARTER: number;
};

/**
 * Seeded weighted pick. Uses mulberry32 instead of Math.random
 * so player rotation is deterministic given the same seed.
 */
function seededWeightedPick(weights: number[], rng: () => number): number {
    if (weights.length === 0) return 0;
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

export function usePlayerRotation(playerCount: number, seed: number) {
    const [weights, setWeights] = useState<number[]>(() => Array(playerCount).fill(1));
    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

    // Track the advance count to feed into the seeded PRNG.
    // Each advance increments this, so we get a different but deterministic
    // random value for each card.
    const [advanceCount, setAdvanceCount] = useState(0);

    // Reset when player count or seed changes (new game / reshuffle)
    const resetRotation = useCallback((newPlayerCount: number) => {
        setWeights(Array(newPlayerCount).fill(1));
        setCurrentPlayerIdx(0);
        setAdvanceCount(0);
    }, []);

    // Advance to the next player. Returns the new player index.
    const advance = useCallback(() => {
        setWeights(prev => {
            const nextWeights = applyDecay(prev, currentPlayerIdx);
            // Use a deterministic PRNG seeded from the game seed + advance count
            // so that the same sequence of advances always picks the same players.
            const rng = mulberry32(seed ^ (advanceCount + 1));
            const nextIdx = seededWeightedPick(nextWeights, rng);
            setCurrentPlayerIdx(nextIdx);
            setAdvanceCount(c => c + 1);
            return nextWeights;
        });
    }, [currentPlayerIdx, seed, advanceCount]);

    const actors = useMemo((): Actors | Record<string, never> => {
        if (playerCount === 0) return {} as Record<string, never>;
        return {
            A: currentPlayerIdx,
            B: (currentPlayerIdx + 1) % playerCount,
            STARTER: currentPlayerIdx,
        };
    }, [currentPlayerIdx, playerCount]);

    return {
        currentPlayerIdx,
        actors,
        weights,
        advance,
        resetRotation,
    };
}
