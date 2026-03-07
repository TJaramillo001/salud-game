'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getPackByModeAndLanguage } from '@/features/questions/repository';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useTranslation } from '@/lib/i18n';
import { useBarSession } from '@/features/bars/useBarSession';
import { isModeAccessible, getModeAccessReason } from '@/features/bars/access';
import { MODES, type ModeKey } from '@/features/modes/types';
import type { Pack } from '@/features/questions/types';
import { trackBarEvent } from '@/lib/barAnalytics';

const COMING_SOON = [
    { key: 'couple', emoji: '💑' },
    { key: 'afterparty', emoji: '🌅' },
    { key: 'bar', emoji: '🍻' },
];

export default function ModePage() {
    const router = useRouter();
    const { t } = useTranslation();

    const {
        state: { players, selectedMode, selectedLanguage },
        setMode,
        startNewSession,
    } = useGameStore();

    const { barSession, isBarActive } = useBarSession();

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
        if (!isModeAccessible(key, barSession)) return;
        if (isBarActive && barSession) {
            trackBarEvent('mode_selected', barSession.slug, null, {
                mode: key,
                bar_name: barSession.name,
            });
        }
        setMode(key);
        startNewSession();
        router.push('/game/play');
    }

    return (
        <main className="min-h-dvh p-6">
            <h1 className="text-2xl font-semibold mb-4">{t.setup.mode.title}</h1>

            {isBarActive && barSession && (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-sm font-medium text-amber-300">
                        {t.bar.session.activeBanner.replace('{barName}', barSession.name)}
                    </p>
                    <p className="text-xs text-amber-400/70">{t.bar.session.allUnlocked}</p>
                </div>
            )}

            {loading ? (
                <div className="text-sm text-neutral-500">{t.setup.mode.loading}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    {modeEntries.map(({ key, pack }) => {
                        const isSelected = selectedMode === key;
                        const accessible = isModeAccessible(key, barSession);
                        const reason = getModeAccessReason(key, barSession);
                        const modeT = t.modes[key as keyof typeof t.modes];
                        const label = modeT?.label ?? key;
                        const description = modeT?.description;

                        return (
                            <button
                                key={key}
                                disabled={!accessible}
                                className={[
                                    'rounded-xl border p-4 text-left transition',
                                    accessible ? 'hover:shadow' : 'opacity-50 cursor-not-allowed',
                                    isSelected ? 'border-white/30 ring-2 ring-white/10' : 'border-neutral-700',
                                ].join(' ')}
                                onClick={() => choose(key)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-medium">{label}</span>
                                            {reason === 'locked' && (
                                                <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-300">
                                                    {t.mode.locked}
                                                </span>
                                            )}
                                            {reason === 'bar' && (
                                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                                                    🍻
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {t.setup.mode.cards.replace('{count}', String(pack.cards.length))}
                                        </div>
                                    </div>
                                    {isSelected && accessible && (
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                {accessible && description && (
                                    <p className="mt-2 text-sm text-neutral-400">{description}</p>
                                )}
                                {!accessible && (
                                    <p className="mt-2 text-sm text-neutral-500">{t.mode.lockedDesc}</p>
                                )}
                            </button>
                        );
                    })}

                    {/* Coming soon placeholders */}
                    {COMING_SOON.map(({ key, emoji }) => {
                        const modeT = t.modes[key as keyof typeof t.modes];
                        const label = modeT?.label ?? key;
                        const description = modeT?.description;

                        return (
                            <div
                                key={key}
                                className="rounded-xl border border-neutral-800 p-4 text-left opacity-50 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{emoji}</span>
                                    <span className="text-lg font-medium">{label}</span>
                                    <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-300">
                                        {t.mode.comingSoon}
                                    </span>
                                </div>
                                {description && (
                                    <p className="mt-2 text-sm text-neutral-500">{description}</p>
                                )}
                            </div>
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
