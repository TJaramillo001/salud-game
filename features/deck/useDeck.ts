// features/deck/useDeck.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { buildDeck } from '@/lib/deck';
import type { BuiltCard, Player } from '@/lib/types';

// App-facing card type (what QuestionCard/turn logic expect)
export type GameCard = {
    id: string;
    type: 'question' | 'rule';        // normalize our kinds
    text: string;                     // what QuestionCard will render
    ruleId?: string;                  // for rule cards
    params?: Record<string, unknown>; // optional rule params
    // keep a bit of targeting info if resolveTargetName uses it
    __actors?: Record<string, number>;
    __kind?: string;                  // debug/telemetry
};

// Small helper to coerce your store players into our Player[]
function normalizePlayers(raw: string[] | { name: string; gender?: 'M'|'F'|'X' }[]): Player[] {
    return (raw as any[]).map((p: any, i) => {
        if (typeof p === 'string') return { id: String(i), name: p, gender: 'X' };
        return { id: String(i), name: p.name, gender: p.gender ?? 'X' };
    });
}

export function useDeck(pack: { id: string; name?: string } | null, seed: number) {
    const { players: storePlayers } = useGameStore();
    const players = useMemo(() => normalizePlayers(storePlayers as any), [storePlayers]);

    const [deck, setDeck] = useState<GameCard[]>([]);
    const [index, setIndex] = useState(0);

    // Build (or rebuild) the deck whenever inputs change
    useEffect(() => {
        if (!pack) {
            setDeck([]);
            setIndex(0);
            return;
        }

        // Map pack.id -> our mode name
        const mode = pack.id === 'pre' || pack.id === 'Pre' ? 'pre' : null;

        if (!mode) {
            // Unsupported pack for now; leave empty but not crashy
            setDeck([]);
            setIndex(0);
            return;
        }

        const built: BuiltCard[] = buildDeck({ players, mode: 'pre', seed });

        // Adapt our BuiltCard -> GameCard your UI expects
        // Adapt our BuiltCard -> GameCard your UI expects
        const mapped: GameCard[] = built.map((c) => {
            const isRule = c.kind === 'rule_on' || c.kind === 'rule_off';

            // Minimal target that matches your legacy type, for safety
            const target =
                c.kind === 'group'
                    ? { kind: 'all' as const, strategy: 'current' as const }
                    : { kind: 'single' as const, strategy: 'current' as const };

            return {
                id: c.id,
                type: isRule ? 'rule' : 'question',
                text: c.rendered,
                ruleId: c.ruleId ?? undefined,
                params: isRule ? { phase: c.kind === 'rule_on' ? 'on' : 'off' } : undefined,
                __actors: c.actors,  // used by resolveTargetName (new path)
                __kind: c.kind,      // used to detect group
                // @ts-expect-error allow target passthrough for legacy helpers
                target,
            };
        });


        setDeck(mapped);
        setIndex(0);
    }, [pack?.id, seed, players]); // <- critical: include seed & players

    const current = deck[index] ?? null;
    const remaining = Math.max(deck.length - (index + (current ? 1 : 0)), 0);
    const next = () => setIndex((i) => Math.min(i + 1, deck.length));

    return { deck, current, remaining, next };
}
