'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/providers/GameStoreProvider';
import { LANGUAGES, type LanguageKey } from '@/features/languages/types';
import { getTranslations } from '@/lib/i18n';

// Language tile colors (one per language)
const LANG_COLORS: Record<LanguageKey, string> = {
    es_la: 'emerald',
    es_eu: 'red',
    it:    'green',
    en:    'blue',
};

export default function LanguagePage() {
    const router = useRouter();
    const { state: { selectedLanguage }, setLanguage } = useGameStore();

    function choose(key: LanguageKey) {
        setLanguage(key);
        router.push('/game/setup/players');
    }

    // Use a neutral fallback translation for the screen title
    // (no language selected yet → default to es_la)
    const t = getTranslations(selectedLanguage);

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6 py-12">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{t.language.screenTitle}</h1>
                <p className="text-neutral-400 text-sm">{t.language.screenSubtitle}</p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-3">
                {(Object.keys(LANGUAGES) as LanguageKey[]).map((key) => {
                    const meta = LANGUAGES[key];
                    const color = LANG_COLORS[key];
                    const selected = selectedLanguage === key;
                    // Show the native name of each language (always in that language)
                    const nativeT = getTranslations(key);

                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => choose(key)}
                            className={[
                                'w-full text-left rounded-2xl p-4 transition',
                                'border shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-4',
                                selected
                                    ? `bg-${color}-50 border-${color}-300 ring-${color}-400/50`
                                    : 'bg-white/5 border-neutral-700 hover:border-neutral-500',
                            ].join(' ')}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl" aria-hidden>{meta.flag}</span>
                                <div className="flex-1">
                                    <div className="font-semibold text-lg text-neutral-100">
                                        {meta.nativeName}
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                        {nativeT.language.screenSubtitle}
                                    </div>
                                </div>
                                <div
                                    className={[
                                        'h-5 w-5 rounded-full border flex-shrink-0',
                                        selected
                                            ? `bg-${color}-500 border-${color}-600`
                                            : 'bg-transparent border-neutral-600',
                                    ].join(' ')}
                                    aria-hidden
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </main>
    );
}