'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { listPacks } from '@/features/questions/repository';
import type { Pack } from '@/features/questions/types';
import { useGameStore } from '@/providers/GameStoreProvider';
import { isModeKey, ModeKey } from '@/features/modes/types';

export default function ModePage() {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const {
        state: { players, selectedMode },
        setMode,
        startNewSession,
    } = useGameStore();

    // Guard: must have players before selecting a mode
    useEffect(() => {
        if (!players || players.length === 0) {
            router.replace('/game/setup/players');
        }
    }, [players, router]);

    // Load available packs (e.g., 'pre', 'night_out')
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await listPacks();
                if (alive) setPacks(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    async function choose(id: Pack['id']) {
        // Ensure the pack id maps to a valid ModeKey
        if (!isModeKey(id)) {
            console.warn(`Pack id "${id}" is not a recognized mode key. Expected a ModeKey.`);
            return;
        }
        const mode = id as ModeKey;

        // Persist selection for convenience
        setMode(mode);

        // Start a fresh session (new sessionId/seed, clears runtime seen/gameOver)
        startNewSession();

        // Proceed to play
        router.push('/game/play');
    }

    return (
        <main className="min-h-dvh p-6">
            <h1 className="text-2xl font-semibold mb-4">Choose Game Mode</h1>

            {loading ? (
                <div className="text-sm text-gray-500">Loading modes…</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    {packs.map((p) => {
                        const isSelected = selectedMode === p.id;
                        return (
                            <button
                                key={p.id}
                                className={[
                                    'rounded-xl border p-4 text-left transition hover:shadow',
                                    isSelected ? 'border-black/50 ring-2 ring-black/10' : 'border-black/10',
                                ].join(' ')}
                                onClick={() => choose(p.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-lg font-medium">{p.name}</div>
                                        <div className="text-xs text-gray-500">Cards: {p.cards.length}</div>
                                    </div>
                                    {isSelected && (
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/20">
                      ✓
                    </span>
                                    )}
                                </div>
                                {p.description && (
                                    <p className="mt-2 text-sm text-gray-600">{p.description}</p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="mt-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    Back
                </Button>
            </div>
        </main>
    );
}
