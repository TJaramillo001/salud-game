// lib/i18n/index.ts
import { useGameStore } from '@/providers/GameStoreProvider';
import type { LanguageKey } from '@/features/languages/types';
import type { Translations } from './translations/es_la';
import es_la from './translations/es_la';
import es_eu from './translations/es_eu';
import it from './translations/it';
import en from './translations/en';

const TRANSLATIONS: Record<LanguageKey, Translations> = { es_la, es_eu, it, en };

/**
 * Get a translation dictionary for the given language.
 * Falls back to es_la for unknown keys.
 */
export function getTranslations(language: LanguageKey | null): Translations {
    return TRANSLATIONS[language ?? 'es_la'] ?? es_la;
}

/**
 * Simple template interpolation: replaces {key} placeholders in a string.
 * e.g. interpolate("Cards: {count}", { count: "42" }) → "Cards: 42"
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) =>
        key in vars ? String(vars[key]) : `{${key}}`
    );
}

/**
 * React hook — returns a translation function bound to the current language.
 *
 * Usage:
 *   const { t, T } = useTranslation();
 *   t.setup.players.title          → "Add players"
 *   T('play.empty.description', { mode: 'pre' }) → interpolated string
 */
export function useTranslation() {
    const { state: { selectedLanguage } } = useGameStore();
    const dict = getTranslations(selectedLanguage);

    /**
     * Interpolate a string from the dictionary by dot-notation path.
     * Falls back to es_la if the key is not found.
     */
    function T(path: string, vars?: Record<string, string | number>): string {
        const keys = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = dict;
        for (const k of keys) {
            if (val == null || typeof val !== 'object') { val = undefined; break; }
            val = val[k];
        }
        if (typeof val !== 'string') {
            // Fallback to es_la
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let fallback: any = es_la;
            for (const k of keys) {
                if (fallback == null || typeof fallback !== 'object') { fallback = undefined; break; }
                fallback = fallback[k];
            }
            val = typeof fallback === 'string' ? fallback : path;
        }
        return vars ? interpolate(val as string, vars) : (val as string);
    }

    return { t: dict, T, lang: selectedLanguage ?? 'es_la' };
}