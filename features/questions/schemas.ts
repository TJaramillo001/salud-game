// features/questions/schemas.ts
import type { Card, CardKind } from './types';

const VALID_MODES = new Set(['pre', 'night_out', 'couple']);
const VALID_KINDS = new Set<CardKind>([
    'action',
    'question',
    'group',
    'versus',
    'wildcard',
    'rule_on',
    'rule_off',
]);

/**
 * Returns true if the given value is a structurally valid Card.
 * Emits a console.warn in development for each failed check.
 */
export function validateCard(card: unknown): card is Card {
    if (!card || typeof card !== 'object') {
        warn('not an object', card);
        return false;
    }

    const c = card as Record<string, unknown>;

    if (typeof c.id !== 'string' || !c.id) {
        warn('missing or empty id', c.id);
        return false;
    }
    if (!VALID_MODES.has(c.mode as string)) {
        warn(`invalid mode "${c.mode}" on card ${c.id}`);
        return false;
    }
    if (!VALID_KINDS.has(c.kind as CardKind)) {
        warn(`invalid kind "${c.kind}" on card ${c.id}`);
        return false;
    }
    if (typeof c.text !== 'string' || !c.text.trim()) {
        warn(`empty or missing text on card ${c.id}`);
        return false;
    }
    if (typeof c.spice !== 'number' || c.spice < 1 || c.spice > 3) {
        warn(`spice out of range (${c.spice}) on card ${c.id}`);
        return false;
    }
    if (typeof c.weight !== 'number' || c.weight <= 0) {
        warn(`invalid weight (${c.weight}) on card ${c.id}`);
        return false;
    }
    if ((c.kind === 'rule_on' || c.kind === 'rule_off') && !c.ruleId) {
        warn(`rule card ${c.id} is missing ruleId`);
        return false;
    }

    return true;
}

function warn(msg: string, value?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`[salud:schema] Card validation failed — ${msg}`, value ?? '');
    }
}
