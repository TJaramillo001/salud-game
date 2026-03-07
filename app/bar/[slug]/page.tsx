// app/bar/[slug]/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useBarSession } from '@/features/bars/useBarSession';
import { getBarConfig, isValidBarSlug } from '@/features/bars/repository';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { trackBarEvent } from '@/lib/barAnalytics';

export default function BarLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const { t } = useTranslation();
    const { setBarSession } = useGameStore();
    const { barSession, isBarActive } = useBarSession();

    const barConfig = isValidBarSlug(slug) ? getBarConfig(slug) : undefined;

    if (!barConfig) {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">{t.bar.notFound}</h1>
                <p className="text-neutral-400 mb-6">{t.bar.notFoundDesc}</p>
                <Button onClick={() => router.push('/')}>
                    {t.bar.goHome}
                </Button>
            </main>
        );
    }

    const hasActiveSession = isBarActive && barSession?.slug === slug;

    function handleStart() {
        const now = Date.now();
        setBarSession({
            slug: barConfig!.slug,
            name: barConfig!.name,
            expiresAt: now + barConfig!.sessionDurationMs,
            startedAt: now,
        });
        trackBarEvent('session_start', barConfig!.slug, null, {
            bar_name: barConfig!.name,
        });
        router.push('/game/setup/language');
    }

    function handleContinue() {
        router.push('/game/setup/language');
    }

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
            <div className="mb-8">
                <div className="text-5xl mb-4">🍻</div>
                <h1 className="text-3xl font-bold mb-2">
                    {t.bar.landing.welcome.replace('{barName}', barConfig.name)}
                </h1>
                <p className="text-neutral-400 text-lg">
                    {t.bar.landing.subtitle}
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                {hasActiveSession ? (
                    <>
                        <Button onClick={handleContinue}>
                            {t.bar.landing.continueSession}
                        </Button>
                        <Button variant="ghost" onClick={handleStart}>
                            {t.bar.landing.newSession}
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleStart}>
                        {t.bar.landing.startPlaying}
                    </Button>
                )}
            </div>

            {hasActiveSession && barSession && (
                <p className="mt-4 text-sm text-neutral-500">
                    {t.bar.session.expiresIn.replace('{time}', formatTimeRemaining(barSession.expiresAt - Date.now()))}
                </p>
            )}
        </main>
    );
}

function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return '0 min';
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
}
