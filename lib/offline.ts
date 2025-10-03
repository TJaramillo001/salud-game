// lib/offline.ts
'use client';

import type { Card } from '@/features/questions/types';

const LAST_DECK_KEY = 'SALUD_LAST_DECK_V1';

export function saveLastDeck(deck: Card[]) {
    try {
        const payload = { cards: deck, savedAt: Date.now() };
        localStorage.setItem(LAST_DECK_KEY, JSON.stringify(payload));
    } catch { /* ignore quota errors */ }
}

export function getLastDeck(): Card[] | null {
    try {
        const raw = localStorage.getItem(LAST_DECK_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
            return parsed.cards as Card[];
        }
    } catch { /* ignore parse errors */ }
    return null;
}

export function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
}
