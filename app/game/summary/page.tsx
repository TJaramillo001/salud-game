// app/game/summary/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useActiveRules } from '@/features/rules/useActiveRules';
import { useTranslation } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function SummaryPage() {
    const router = useRouter();
    const {
        startNewSession,
        state: { selectedMode },
    } = useGameStore();
    const { t } = useTranslation();
    const { clearAll } = useActiveRules();
    const sent = useRef(false);

    // Telemetry once
    useEffect(() => {
        if (!sent.current) {
            trackEvent('session_end', { mode: selectedMode });
            sent.current = true;
        }
    }, [selectedMode]);

    // Clear any active rules once
    useEffect(() => {
        clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function playAgain() {
        clearAll(); // safety
        startNewSession();
        router.replace('/game/play');
    }

    function rate() {
        window.open('https://forms.gle/9GrR3mFqjQCTqoB89', '_blank');
    }

    function changeSetup() {
        router.replace('/game/setup/players');
    }

    // Resolve mode label from i18n (falls back to 'unknown' translation)
    const modeLabel =
        selectedMode && selectedMode in t.summary.mode
            ? t.summary.mode[selectedMode as keyof typeof t.summary.mode]
            : t.summary.mode.unknown;

    return (
        <main className="min-h-dvh px-6 pb-10 pt-8 flex flex-col items-center">
            <div className="w-full max-w-sm text-center space-y-5">
                <h1 className="text-2xl font-semibold">{t.summary.title}</h1>

                <p className="text-sm text-neutral-400">
                    {t.summary.thanks.replace('{mode}', modeLabel)}
                </p>

                {/* Actions: single-column stack on mobile */}
                <div className="pt-2 space-y-3">
                    <Button size="lg" className="w-full" onClick={playAgain}>
                        {t.summary.btn.playAgain}
                    </Button>

                    <Button size="lg" variant="secondary" className="w-full" onClick={changeSetup}>
                        {t.summary.btn.changeSetup}
                    </Button>

                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => router.replace('/')}>
                            {t.summary.btn.home}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={rate}>
                            {t.summary.btn.rate}
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}