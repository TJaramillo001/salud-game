// features/questions/repository.ts
import type { Pack } from './types';
import { validateCard } from './schemas';

// These may be either a Pack object OR an array<Card> depending on your JSON files.
import preRaw from '@/data/packs/pre.json';
import nightOutRaw from '@/data/packs/night_out.json';

/** Add new packs here — one entry per game mode. */
const PACK_REGISTRY = [
    { raw: preRaw,      id: 'pre',       name: 'Pre' },
    { raw: nightOutRaw, id: 'night_out', name: 'Rumba' },
] as const;

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

const PACKS: Pack[] = PACK_REGISTRY.map(({ raw, id, name }) => asPack(raw, id, name));

export async function listPacks(): Promise<Pack[]> {
    // Shallow normalization to keep callers safe
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

export async function listPackIds(): Promise<string[]> {
    const packs = await listPacks();
    return packs.map((p) => String(p.id));
}
