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
        description: 'Warm-up vibes. Light, social, easy starters.',
        emoji: '🥂',
        color: 'emerald',
    },
    night_out: {
        key: 'night_out',
        label: 'Night-Out',
        description: 'Higher energy, spicier prompts—keep it moving.',
        emoji: '🌃',
        color: 'violet',
    },
} satisfies Record<ModeKey, ModeMeta>;

/** Type guard for anything coming from query/localStorage */
export function isModeKey(v: unknown): v is ModeKey {
    return v === 'pre' || v === 'night_out';
}

export const MODE_STORAGE_KEY = 'salud:selectedMode';
