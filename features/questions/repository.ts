// features/questions/repository.ts
//
// PATCH (CoderB): Converted from static imports to dynamic import() for pack
// JSON files. This is the single largest bundle optimization in the codebase.
//
// Previous state: All 12 pack JSONs were statically imported at module load,
// adding ~622KB (uncompressed) to the client JS bundle. A user who picks
// English + Pre mode downloads 232KB of Spanish cards they never see.
//
// New state: Each pack is loaded lazily via dynamic import() only when the
// user selects that mode+language pair. Webpack/Turbopack splits each JSON
// into its own chunk. Typical payload drops from ~622KB to ~30-70KB (1 pack).
//
// Also removed dead code: listPacks(), getPackById(), listPackIds() had zero
// callers in the codebase.

import type { Pack } from './types';
import type { ModeKey } from '@/features/modes/types';
import type { LanguageKey } from '@/features/languages/types';
import { validateCard } from './schemas';

// ---------- Lazy pack loaders ----------
// Each entry maps a `${mode}_${language}` key to a dynamic import thunk.
// The import() calls are split by bundler into separate chunks.

type PackMeta = {
    id: string;
    name: string;
    loader: () => Promise<{ default: unknown }>;
};

const PACK_LOADERS: Record<string, PackMeta> = {
    'pre_es_la':       { id: 'pre_es_la',       name: 'Pre (Latino)',           loader: () => import('@/data/packs/pre_es_la.json') },
    'pre_es_eu':       { id: 'pre_es_eu',       name: 'Pre (Espana)',           loader: () => import('@/data/packs/pre_es_eu.json') },
    'pre_it':          { id: 'pre_it',          name: 'Pre (Italiano)',         loader: () => import('@/data/packs/pre_it.json') },
    'pre_en':          { id: 'pre_en',          name: 'Pre (English)',          loader: () => import('@/data/packs/pre_en.json') },
    'night_out_es_la': { id: 'night_out_es_la', name: 'Rumba (Latino)',         loader: () => import('@/data/packs/night_out_es_la.json') },
    'night_out_es_eu': { id: 'night_out_es_eu', name: 'Rumba (Espana)',         loader: () => import('@/data/packs/night_out_es_eu.json') },
    'night_out_it':    { id: 'night_out_it',    name: 'Notte Fuori (Italiano)', loader: () => import('@/data/packs/night_out_it.json') },
    'night_out_en':    { id: 'night_out_en',    name: 'Night Out (English)',    loader: () => import('@/data/packs/night_out_en.json') },
    'couple_es_la':    { id: 'couple_es_la',    name: 'Pareja (Latino)',        loader: () => import('@/data/packs/couple_es_la.json') },
    'couple_es_eu':    { id: 'couple_es_eu',    name: 'Pareja (Espana)',        loader: () => import('@/data/packs/couple_es_eu.json') },
    'couple_it':       { id: 'couple_it',       name: 'Coppia (Italiano)',      loader: () => import('@/data/packs/couple_it.json') },
    'couple_en':       { id: 'couple_en',       name: 'Couples (English)',      loader: () => import('@/data/packs/couple_en.json') },
};

// ---------- Pack cache ----------
// Once loaded, a pack is cached in memory for the rest of the session.
// This avoids re-importing on reshuffle (same mode+language, different seed).
const packCache = new Map<string, Pack>();

// ---------- Pack normalization ----------

/**
 * Normalize arbitrary JSON into a Pack.
 * - If raw is already a Pack shape, extract fields.
 * - If raw is an array of Card, wrap it into a Pack.
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
        if (firstMode === 'pre' || firstMode === 'night_out' || firstMode === 'couple') id = firstMode;
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
            return { id: fallbackId, name: fallbackName, version: 1, cards: [] };
        }
    }

    const cards = rawCards!.filter(validateCard);

    return { id, name, version, description, cards };
}

// ---------- Public API ----------

/** Primary lookup for gameplay: resolves the correct pack for a mode + language pair.
 *  Loads the pack JSON lazily on first access, then caches in memory. */
export async function getPackByModeAndLanguage(
    mode: ModeKey,
    language: LanguageKey
): Promise<Pack | undefined> {
    const key = `${mode}_${language}`;

    // Check in-memory cache
    const cached = packCache.get(key);
    if (cached) return cached;

    // Look up the loader
    const meta = PACK_LOADERS[key];
    if (!meta) return undefined;

    // Dynamic import -- bundler splits this into a separate chunk
    const imported = await meta.loader();
    const raw = imported.default;
    const pack = asPack(raw, meta.id, meta.name);

    packCache.set(key, pack);
    return pack;
}

/** Get metadata for all known packs (used by mode selection page to show
 *  card counts). This loads all packs for the given language eagerly, which
 *  is acceptable because the mode page needs counts for all modes. */
export async function getPacksForLanguage(
    language: LanguageKey
): Promise<Array<{ mode: ModeKey; pack: Pack }>> {
    const modes: ModeKey[] = ['pre', 'night_out', 'couple'];
    const results: Array<{ mode: ModeKey; pack: Pack }> = [];

    for (const mode of modes) {
        const pack = await getPackByModeAndLanguage(mode, language);
        if (pack && pack.cards.length > 0) {
            results.push({ mode, pack });
        }
    }

    return results;
}
