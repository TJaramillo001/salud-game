// features/questions/repository.ts
import type { Pack, Card } from './types';

// These may be either a Pack object OR an array<Card> depending on your JSON files.
import preRaw from '@/data/packs/pre.json';
import nightOutRaw from '@/data/packs/night_out.json';

/**
 * Normalize arbitrary JSON into a Pack.
 * - If raw is already a Pack, return it.
 * - If raw is an array of Card, wrap it into a Pack using inferred defaults.
 */
function asPack(raw: unknown, fallbackId: string, fallbackName: string): Pack {
    if (Array.isArray(raw)) {
        const cards = raw as Card[];
        const firstMode = cards[0]?.mode;
        const id =
            firstMode === 'pre' || firstMode === 'night_out'
                ? firstMode
                : fallbackId;

        return {
            id,
            name: fallbackName,
            version: 1,
            cards,
        };
    }

    // Assume it's already a Pack; do a shallow runtime check to be safe
    const maybe = raw as Partial<Pack>;
    if (
        maybe &&
        typeof maybe === 'object' &&
        typeof maybe.id === 'string' &&
        Array.isArray(maybe.cards)
    ) {
        return {
            id: maybe.id,
            name: maybe.name ?? fallbackName,
            version: maybe.version ?? 1,
            cards: maybe.cards as Card[],
            description: maybe.description,
        };
    }

    // Last resort: return an empty pack so the app doesn't crash
    return {
        id: fallbackId,
        name: fallbackName,
        version: 1,
        cards: [],
    };
}

const PACKS: Pack[] = [
    asPack(preRaw, 'pre', 'Pre'),
    asPack(nightOutRaw, 'night_out', 'Rumba'),
];

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
