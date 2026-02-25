// features/questions/repository.ts
import type { Pack } from './types';
import type { ModeKey } from '@/features/modes/types';
import type { LanguageKey } from '@/features/languages/types';
import { validateCard } from './schemas';

// Latin American Spanish
import preEsLaRaw from '@/data/packs/pre_es_la.json';
import nightOutEsLaRaw from '@/data/packs/night_out_es_la.json';

// Spain Spanish (Erasmus)
import preEsEuRaw from '@/data/packs/pre_es_eu.json';
import nightOutEsEuRaw from '@/data/packs/night_out_es_eu.json';

// Italian
import preItRaw from '@/data/packs/pre_it.json';
import nightOutItRaw from '@/data/packs/night_out_it.json';

// English
import preEnRaw from '@/data/packs/pre_en.json';
import nightOutEnRaw from '@/data/packs/night_out_en.json';

type PackRegistryEntry = {
    raw: unknown;
    id: string;
    name: string;
    mode: ModeKey;
    language: LanguageKey;
};

/** All packs indexed by mode + language. */
const PACK_REGISTRY: PackRegistryEntry[] = [
    { raw: preEsLaRaw,      id: 'pre_es_la',      name: 'Pre (Latino)',          mode: 'pre',      language: 'es_la' },
    { raw: preEsEuRaw,      id: 'pre_es_eu',      name: 'Pre (España)',           mode: 'pre',      language: 'es_eu' },
    { raw: preItRaw,        id: 'pre_it',         name: 'Pre (Italiano)',         mode: 'pre',      language: 'it'    },
    { raw: preEnRaw,        id: 'pre_en',         name: 'Pre (English)',          mode: 'pre',      language: 'en'    },
    { raw: nightOutEsLaRaw, id: 'night_out_es_la', name: 'Rumba (Latino)',        mode: 'night_out', language: 'es_la' },
    { raw: nightOutEsEuRaw, id: 'night_out_es_eu', name: 'Rumba (España)',         mode: 'night_out', language: 'es_eu' },
    { raw: nightOutItRaw,   id: 'night_out_it',   name: 'Notte Fuori (Italiano)', mode: 'night_out', language: 'it'    },
    { raw: nightOutEnRaw,   id: 'night_out_en',   name: 'Night Out (English)',    mode: 'night_out', language: 'en'    },
];

/**
 * Normalize arbitrary JSON into a Pack.
 * - If raw is already a Pack, return it.
 * - If raw is an array of Card, wrap it into a Pack using inferred defaults.
 */
function asPack(raw: unknown, fallbackId: string, fallbackName: string): Pack {
    let id = fallbackId;
    let name = fallbackName;
    let version = 1;
    let description: string | undefined;
    let rawCards: unknown[];

    if (Array.isArray(raw)) {
        rawCards = raw;
        const firstMode = (raw[0] as Record<string, unknown>)?.mode;
        if (firstMode === 'pre' || firstMode === 'night_out') id = firstMode;
    } else {
        const maybe = raw as Partial<Pack>;
        if (
            maybe &&
            typeof maybe === 'object' &&
            typeof maybe.id === 'string' &&
            Array.isArray(maybe.cards)
        ) {
            id = maybe.id;
            name = maybe.name ?? fallbackName;
            version = maybe.version ?? 1;
            description = maybe.description;
            rawCards = maybe.cards;
        } else {
            // Last resort: return an empty pack so the app doesn't crash
            return { id: fallbackId, name: fallbackName, version: 1, cards: [] };
        }
    }

    const cards = rawCards!.filter(validateCard);

    return { id, name, version, description, cards };
}

const PACKS: (Pack & { mode: ModeKey; language: LanguageKey })[] = PACK_REGISTRY.map(
    ({ raw, id, name, mode, language }) => ({
        ...asPack(raw, id, name),
        id,   // always use the registry id (e.g. 'pre_es_la'), not the inferred mode
        mode,
        language,
    })
);

export async function listPacks(): Promise<Pack[]> {
    return PACKS.map((p) => ({
        ...p,
        id: String(p.id),
        name: p.name ?? String(p.id),
        version: p.version ?? 1,
        cards: Array.isArray(p.cards) ? p.cards : [],
        description: p.description,
    }));
}

export async function getPackById(id: Pack['id']): Promise<Pack | undefined> {
    const packs = await listPacks();
    const needle = String(id).toLowerCase();
    return packs.find((p) => String(p.id).toLowerCase() === needle);
}

/** Primary lookup for gameplay: resolves the correct pack for a mode + language pair. */
export async function getPackByModeAndLanguage(
    mode: ModeKey,
    language: LanguageKey
): Promise<Pack | undefined> {
    const entry = PACKS.find((p) => p.mode === mode && p.language === language);
    if (!entry) return undefined;
    return {
        id: entry.id,
        name: entry.name,
        version: entry.version,
        description: entry.description,
        cards: Array.isArray(entry.cards) ? entry.cards : [],
    };
}

export async function listPackIds(): Promise<string[]> {
    const packs = await listPacks();
    return packs.map((p) => String(p.id));
}