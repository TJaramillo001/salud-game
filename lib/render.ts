// lib/render.ts
import type { Player } from "./types";

export function renderText(
    text: string,
    actors: Record<string, number>,
    players: Player[]
) {
    const get = (role: string, fallback: string) =>
        players[actors[role]]?.name ?? fallback;

    return text
        .replaceAll("{A}", get("A", "Jugador A"))
        .replaceAll("{B}", get("B", "Jugador B"))
        .replaceAll("{C}", get("C", "Jugador C"))
        .replaceAll("{STARTER}", get("STARTER", "Cualquiera"));
}
