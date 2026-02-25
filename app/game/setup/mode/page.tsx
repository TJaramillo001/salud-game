'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getPackByModeAndLanguage } from '@/features/questions/repository';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useTranslation } from '@/lib/i18n';
import { MODES, type ModeKey } from '@/features/modes/types';
import type { Pack } from '@/features/questions/types';

export default function ModePage() {
    const router = useRouter();
    const { t } = useTranslation();

    const {
        state: { players, selectedMode, selectedLanguage },
        setMode,
        startNewSession,
    } = useGameStore();

    type ModeEntry = { key: ModeKey; pack: Pack };
    const [modeEntries, setModeEntries] = useState<ModeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Guard: must have players before picking a mode
    useEffect(() => {
        if (!players || players.length === 0) {
            router.replace('/game/setup/players');
        }
    }, [players, router]);

    // Load packs for the current language
    useEffect(() => {
        if (!selectedLanguage) return;
        let alive = true;
        (async () => {
            try {
                const modeKeys = Object.keys(MODES) as ModeKey[];
                const results = await Promise.all(
                    modeKeys.map(async (key) => {
                        const pack = await getPackByModeAndLanguage(key, selectedLanguage);
                        return pack ? { key, pack } : null;
                    })
                );
                if (alive) setModeEntries(results.filter(Boolean) as ModeEntry[]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [selectedLanguage]);

    function choose(key: ModeKey) {
        setMode(key);
        startNewSession();
        router.push('/game/play');
    }

    return (
        <main className="min-h-dvh p-6">
            <h1 className="text-2xl font-semibold mb-4">{t.setup.mode.title}</h1>

            {loading ? (
                <div className="text-sm text-neutral-500">{t.setup.mode.loading}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    {modeEntries.map(({ key, pack }) => {
                        const isSelected = selectedMode === key;
                        // Use i18n for mode labels/descriptions
                        const modeT = t.modes[key as keyof typeof t.modes];
                        const label = modeT?.label ?? key;
                        const description = modeT?.description;

                        return (
                            <button
                                key={key}
                                className={[
                                    'rounded-xl border p-4 text-left transition hover:shadow',
                                    isSelected ? 'border-white/30 ring-2 ring-white/10' : 'border-neutral-700',
                                ].join(' ')}
                                onClick={() => choose(key)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-lg font-medium">{label}</div>
                                        <div className="text-xs text-neutral-500">
                                            {t.setup.mode.cards.replace('{count}', String(pack.cards.length))}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                {description && (
                                    <p className="mt-2 text-sm text-neutral-400">{description}</p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="mt-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    {t.setup.mode.back}
                </Button>
            </div>
        </main>
    );
}