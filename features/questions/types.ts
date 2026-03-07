// features/questions/types.ts

export type TargetRole = 'A' | 'B' | 'C' | 'STARTER';
export type Target = {
    roles: TargetRole[];
    constraints?: {
        distinct?: boolean;
        genderOfA?: 'M' | 'F' | 'X';
        // extend as needed…
    };
};

export type CardKind =
    | 'action'
    | 'question'
    | 'group'
    | 'versus'
    | 'wildcard'
    | 'rule_on'
    | 'rule_off';

export type Card = {
    id: string;
    mode: 'pre' | 'night_out'; // add more modes as you introduce them
    kind: CardKind;
    target?: Target;
    text: string;
    altText?: string;
    spice: number;   // 1–3+, your scale
    weight: number;  // deck weighting
    ruleId?: string; // present for rule_on / rule_off
    source?: string; // 'bar' for bar-injected cards; undefined for standard cards
};

export type Pack = {
    id: string;
    name: string;
    version: number;
    description?: string;  // ← add this
    cards: Card[];
};
