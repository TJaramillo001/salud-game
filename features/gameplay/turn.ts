import type { Card } from '@/features/questions/types';

export function nextTurnIndex(current: number, total: number) {
    if (total <= 0) return 0;
    return (current + 1) % total;
}

export function resolveTargetName(card: Card, players: string[], turnIndex: number): string | null {
    if (card.type === 'rule') return null;
    if (card.target.kind === 'all') return 'Todos';
    if (players.length === 0) return null;

    if (card.target.strategy === 'current') {
        return players[turnIndex % players.length] ?? null;
    }
    if (card.target.strategy === 'next') {
        const idx = (turnIndex + 1) % players.length;
        return players[idx] ?? null;
    }
    // random
    const idx = Math.floor(Math.random() * players.length);
    return players[idx] ?? null;
}
