// features/languages/types.ts

export type LanguageKey = 'es_la' | 'es_eu' | 'it' | 'en';

export interface LangMeta {
    key: LanguageKey;
    /** Display name (in the language itself) */
    nativeName: string;
    /** Emoji flag */
    flag: string;
    /** HTML lang attribute value */
    htmlLang: string;
}

export const LANGUAGES: Record<LanguageKey, LangMeta> = {
    es_la: {
        key: 'es_la',
        nativeName: 'Español (Latino)',
        flag: '🌎',
        htmlLang: 'es',
    },
    es_eu: {
        key: 'es_eu',
        nativeName: 'Español (España)',
        flag: '🇪🇸',
        htmlLang: 'es',
    },
    it: {
        key: 'it',
        nativeName: 'Italiano',
        flag: '🇮🇹',
        htmlLang: 'it',
    },
    en: {
        key: 'en',
        nativeName: 'English',
        flag: '🇬🇧',
        htmlLang: 'en',
    },
};

/** Type guard for anything coming from localStorage / URL */
export function isLanguageKey(v: unknown): v is LanguageKey {
    return v === 'es_la' || v === 'es_eu' || v === 'it' || v === 'en';
}

export const LANGUAGE_STORAGE_KEY = 'salud:selectedLanguage';