// lib/render.ts
import type { Player } from '@/features/players/types';

type RenderFallbacks = {
    playerA?: string;
    playerB?: string;
    playerC?: string;
    starter?: string;
};

/**
 * Render text placeholders to actual player names.
 * Supports {A}, {B}, {C}, {STARTER}.
 * Missing mappings fall back to the provided labels (or Spanish defaults).
 */
export function renderText(
    text: string,
    actors: Partial<Record<string, number>>, // role -> index in players array
    players: Player[],
    fallbacks?: RenderFallbacks
) {
    const fb = {
        A: fallbacks?.playerA ?? 'Jugador A',
        B: fallbacks?.playerB ?? 'Jugador B',
        C: fallbacks?.playerC ?? 'Jugador C',
        STARTER: fallbacks?.starter ?? 'Cualquiera',
    };

    const get = (role: string, fallback: string) => {
        const idx = actors[role];
        return typeof idx === 'number' && players[idx]?.name ? players[idx].name : fallback;
    };

    return text
        .replaceAll('{A}', get('A', fb.A))
        .replaceAll('{B}', get('B', fb.B))
        .replaceAll('{C}', get('C', fb.C))
        .replaceAll('{STARTER}', get('STARTER', fb.STARTER));
}