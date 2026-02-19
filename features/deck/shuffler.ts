// features/deck/shuffler.ts
import type { Card } from '@/features/questions/types';
import { mulberry32 } from '@/lib/prng';

export function shuffleInPlace<T>(arr: T[], seed?: number): T[] {
    // Fisher–Yates with mulberry32 PRNG for determinism, or Math.random if no seed
    const random = typeof seed === 'number' ? mulberry32(seed) : Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export type RuleWindow = { min: number; max: number };

/**
 * Enforces rule lifecycle ordering in a shuffled deck:
 * - Never place `rule_off` before its matching `rule_on`.
 * - When a `rule_on` appears, schedule its `rule_off` within [min, max] cards after it (clamped to deck end).
 * - If an `off` has no prior `on` in the deck, it is dropped.
 * Deterministic given the seed.
 */
export function scheduleRulePairs(
    deck: Card[],
    seed: number,
    // Place rule_off 8–15 cards after its rule_on: long enough for the rule to matter,
    // short enough that it never dominates an entire game session.
    window: RuleWindow = { min: 8, max: 15 }
): Card[] {
    const rnd = mulberry32(seed);
    const out: Card[] = [];

    // Index remaining OFFs by ruleId so we can pull/move them when an ON appears
    const remainingOffs: Record<string, Card[]> = {};
    for (const c of deck) {
        if (c.kind === 'rule_off' && c.ruleId) {
            (remainingOffs[c.ruleId] ||= []).push(c);
        }
    }

    // For stable insertion later: [{ pos, card }]
    const scheduledInserts: Array<{ pos: number; card: Card }> = [];
    const seenOn = new Set<string>(); // ruleIds already activated

    // First pass: walk shuffled deck, push everything except OFFs (we'll insert OFFs later)
    for (const c of deck) {
        if (c.kind === 'rule_off') {
            // Skip here; it will be inserted when its ON is processed (if any)
            continue;
        }

        out.push(c);

        if (c.kind === 'rule_on' && c.ruleId) {
            const ruleId = c.ruleId;
            if (seenOn.has(ruleId)) {
                // Already active once; ignore duplicate ONs until OFF occurs
                continue;
            }
            seenOn.add(ruleId);

            // Find a matching OFF card (if author provided one)
            const pool = remainingOffs[ruleId];
            const offCard = pool && pool.length ? pool.shift()! : undefined;
            if (!offCard) {
                // No OFF provided in content; rely on end-of-deck auto-clear (state) and move on.
                continue;
            }

            const span = Math.max(0, window.max - window.min + 1);
            const offset = window.min + Math.floor(rnd() * (span || 1));
            // Insert position is relative to current out length (right after we pushed ON)
            const targetPos = out.length - 1 + offset; // clamped to actual deck bounds at insert time

            scheduledInserts.push({ pos: targetPos, card: offCard });
        }
    }

    // Second pass: insert OFFs at their scheduled positions in ascending order
    scheduledInserts.sort((a, b) => a.pos - b.pos);
    for (const { pos, card } of scheduledInserts) {
        const insertAt = Math.min(Math.max(0, pos), out.length);
        out.splice(insertAt, 0, card);
    }

    // Any OFFs left in remainingOffs had no ON → drop them (prevents OFF-before-ON)
    return out;
}
