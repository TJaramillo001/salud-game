// data/bars/index.ts — Bar registry (static imports for build-time bundling)

import type { BarConfig } from '@/features/bars/types';
import type { LanguageKey } from '@/features/languages/types';

import pilotConfig from './pilot/config.json';
import pilotCardsEsEu from './pilot/cards_es_eu.json';
import pilotCardsEsLa from './pilot/cards_es_la.json';

export type BarRegistryEntry = {
    config: BarConfig;
    cards: Partial<Record<LanguageKey, unknown>>;
};

export const BAR_REGISTRY: Record<string, BarRegistryEntry> = {
    pilot: {
        config: pilotConfig as BarConfig,
        cards: {
            es_eu: pilotCardsEsEu,
            es_la: pilotCardsEsLa,
        },
    },
};
