// lib/render.ts
import type { Player } from '@/features/players/types';

/**
 * Render text placeholders to actual player names.
 * Supports {A}, {B}, {C}, {STARTER}.
 * Missing mappings fall back to a sensible label.
 */
export function renderText(
    text: string,
    actors: Partial<Record<string, number>>, // role -> index in players array
    players: Player[]
) {
    const get = (role: string, fallback: string) => {
        const idx = actors[role];
        return typeof idx === 'number' && players[idx]?.name ? players[idx].name : fallback;
    };

    return text
        .replaceAll('{A}', get('A', 'Jugador A'))
        .replaceAll('{B}', get('B', 'Jugador B'))
        .replaceAll('{C}', get('C', 'Jugador C'))
        .replaceAll('{STARTER}', get('STARTER', 'Cualquiera'));
}
