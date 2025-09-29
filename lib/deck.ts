// lib/deck.ts
import type { Player, CardSource, BuiltCard } from "./types";
import { mulberry32, randInt } from "./prng";
import { renderText } from "./render";
import pre from "../data/packs/pre.json";

export function buildDeck({
                              players,
                              mode,
                              seed,
                          }: {
    players: Player[];
    mode: "pre";
    seed: number;
}): BuiltCard[] {
    const rng = mulberry32(seed);
    const source: CardSource[] = mode === "pre" ? (pre as unknown as CardSource[]) : [];
    const out: BuiltCard[] = [];

    for (const card of source) {
        const actors = tryResolve(card, players, rng);
        if (!actors) continue;
        out.push({
            ...card,
            actors,
            rendered: renderText(card.text, actors, players),
        });
    }

    // Fisher–Yates shuffle using rng
    for (let i = out.length - 1; i > 0; i--) {
        const j = randInt(rng, 0, i);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function tryResolve(
    card: CardSource,
    players: Player[],
    rng: () => number
): Record<string, number> | null {
    const roles = card.target.roles ?? [];
    const constraints = card.target.constraints ?? {};

    // Helper: eligible indices for a role
    const poolForRole = (role: string): number[] => {
        // For MVP, only gender constraint on A
        if (role === "A" && constraints.genderOfA) {
            const g = constraints.genderOfA;
            return players
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => (p.gender ?? "X") === g)
                .map(({ i }) => i);
        }
        // default: everyone eligible
        return players.map((_, i) => i);
    };

    const picked: Record<string, number> = {};
    const used = new Set<number>();

    for (const role of roles) {
        const pool = poolForRole(role).filter((idx) =>
            constraints.distinct ? !used.has(idx) : true
        );
        if (pool.length === 0) {
            // try with no distinct if we only have 1 player?
            if (constraints.distinct && players.length === 1 && poolForRole(role).length === 1) {
                picked[role] = 0;
                used.add(0);
                continue;
            }
            return null; // cannot satisfy
        }
        const choice = pool[randInt(rng, 0, pool.length - 1)];
        picked[role] = choice;
        if (constraints.distinct) used.add(choice);
    }

    return picked;
}
