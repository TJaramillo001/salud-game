// features/modes/types.ts

export type ModeKey = 'pre' | 'night_out';

export interface ModeMeta {
    key: ModeKey;
    label: string;
    description: string;
    emoji: string;        // small visual affordance in UI
    color: string;        // tailwind color token (bg-*/text-* usage)
}

export const MODES = {
    pre: {
        key: 'pre',
        label: 'Pre',
        description: 'Calentando los motores para una noche inolvidable.',
        emoji: '🥂',
        color: 'emerald',
    },
    night_out: {
        key: 'night_out',
        label: 'Rumba',
        description: 'Vibras altas, preguntas interesantes. Esta noche nos reímos',
        emoji: '🌃',
        color: 'violet',
    },
} satisfies Record<ModeKey, ModeMeta>;

/** Type guard for anything coming from query/localStorage */
export function isModeKey(v: unknown): v is ModeKey {
    return v === 'pre' || v === 'night_out';
}

export const MODE_STORAGE_KEY = 'salud:selectedMode';
