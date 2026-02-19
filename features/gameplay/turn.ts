// features/gameplay/turn.ts
import type { Card } from '@/features/questions/types';

/**
 * Weighted random pick. Higher weight = higher probability.
 */
export function weightedPickIndex(weights: number[]): number {
    if (weights.length === 0) return 0;
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

/**
 * Decays the picked player's weight and redistributes the surplus to others.
 * Keeps total weight sum constant (= weights.length).
 * minWeight prevents a player from ever reaching 0 probability.
 */
export function applyDecay(weights: number[], picked: number, minWeight = 0.1): number[] {
    const excess = weights[picked] - minWeight;
    if (excess <= 0) return weights;
    const boost = excess / (weights.length - 1);
    return weights.map((w, i) => (i === picked ? minWeight : w + boost));
}

/**
 * Works with BOTH shapes:
 * - legacy Card { type, target: { kind, strategy } }
 * - new GameCard adapter { type, __actors, __kind }
 */
export function resolveTargetName(
    card: any, // accept both shapes
    players: string[],
    turnIndex: number
): string | null {
    if (!card) return null;

    // rules never display subtitle
    const isRule =
        card.type === 'rule' ||
        card.kind === 'rule' ||
        card.kind === 'rule_on' ||
        card.kind === 'rule_off';
    if (isRule) return null;

    const getName = (idx: number) => players?.[idx] ?? `Jugador ${idx + 1}`;

    // NEW preferred path: use resolved actors from adapter
    const actors = card.__actors || card.actors || {};
    if (typeof actors.A === 'number' && typeof actors.B === 'number') {
        return `${getName(actors.A)} vs ${getName(actors.B)}`;
    }
    if (typeof actors.A === 'number') return getName(actors.A);
    if (typeof actors.STARTER === 'number') return `Empieza ${getName(actors.STARTER)}`;

    // If adapter flagged group cards
    if (card.__kind === 'group') return 'Todos';

    // LEGACY fallback: use target.kind/strategy if present
    const t = card.target;
    if (t?.kind === 'all') return 'Todos';
    if (!players?.length) return null;

    if (t?.strategy === 'current') {
        return getName(turnIndex % players.length);
    }
    if (t?.strategy === 'next') {
        const idx = (turnIndex + 1) % players.length;
        return getName(idx);
    }

    // default legacy random
    const idx = Math.floor(Math.random() * players.length);
    return getName(idx);
}
