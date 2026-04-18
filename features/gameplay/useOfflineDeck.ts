// features/gameplay/useOfflineDeck.ts
//
// Extracted hook: manages the offline fallback deck. Previously inlined in
// app/game/play/page.tsx.
//
// Design decisions:
// - Separate from useDeck to keep the primary deck hook clean.
// - Only activates when the primary deck is empty (isEmptyDeck flag).
// - Saves the last valid deck on every successful load for future offline use.
// - The offline deck is a flat array navigated by index.
// - The hook exposes the current offline card and an advance function.

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Card } from '@/features/questions/types';
import { saveLastDeck, getLastDeck } from '@/lib/offline';

export function useOfflineDeck(
    primaryDeck: Card[] | undefined | null,
    isEmptyPrimaryDeck: boolean,
    runId: number,
) {
    const [offlineDeck, setOfflineDeck] = useState<Card[] | null>(null);
    const [offlineIndex, setOfflineIndex] = useState(0);

    // PATCH (CoderB): Track the last saved deck by reference to avoid
    // re-serializing to localStorage when the deck object is the same.
    // Previously, every state change that caused useDeck to re-render would
    // pass the same deck array down and trigger a ~60KB localStorage write.
    const lastSavedDeck = useRef<Card[] | null>(null);

    // Save the primary deck for offline use only when the deck identity changes
    useEffect(() => {
        try {
            if (primaryDeck && primaryDeck.length > 0 && primaryDeck !== lastSavedDeck.current) {
                lastSavedDeck.current = primaryDeck;
                saveLastDeck(primaryDeck as Card[]);
            }
        } catch { /* ignore */ }
    }, [primaryDeck]);

    // Load offline fallback when primary deck is empty
    useEffect(() => {
        if (!isEmptyPrimaryDeck) {
            setOfflineDeck(null);
            setOfflineIndex(0);
            return;
        }
        const cached = getLastDeck();
        if (cached && cached.length > 0) {
            setOfflineDeck(cached);
            setOfflineIndex(0);
        }
    }, [isEmptyPrimaryDeck, runId]);

    const usingOffline = isEmptyPrimaryDeck && offlineDeck != null && offlineDeck.length > 0;
    const offlineCurrent = usingOffline ? offlineDeck![offlineIndex] : null;

    const advanceOffline = useCallback(() => {
        setOfflineIndex((i) => (i + 1 < (offlineDeck?.length ?? 0) ? i + 1 : i));
    }, [offlineDeck]);

    return {
        usingOffline,
        offlineCurrent,
        offlineDeck,
        advanceOffline,
    };
}
