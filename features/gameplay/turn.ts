// features/gameplay/turn.ts
import type { Card } from '@/features/questions/types';

export function nextTurnIndex(current: number, total: number) {
    if (total <= 0) return 0;
    return (current + 1) % total;
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
