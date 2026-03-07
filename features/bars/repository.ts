// features/bars/repository.ts

import { BAR_REGISTRY } from '@/data/bars';
import type { BarConfig, BarSlug } from './types';
import type { Card } from '@/features/questions/types';
import type { ModeKey } from '@/features/modes/types';
import type { LanguageKey } from '@/features/languages/types';
import { validateCard } from '@/features/questions/schemas';

export function getBarConfig(slug: BarSlug): BarConfig | undefined {
    return BAR_REGISTRY[slug]?.config;
}

export function getBarCards(
    slug: BarSlug,
    mode: ModeKey,
    language: LanguageKey,
): Card[] {
    const entry = BAR_REGISTRY[slug];
    if (!entry) return [];

    const rawCards = entry.cards[language];
    if (!rawCards || !Array.isArray(rawCards)) return [];

    return (rawCards as unknown[])
        .filter(validateCard)
        .filter((c: Card) => c.mode === mode);
}

export function isValidBarSlug(slug: string): boolean {
    const entry = BAR_REGISTRY[slug];
    return !!entry && entry.config.active;
}
