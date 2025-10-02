// lib/types.ts
export type Gender = "M" | "F" | "X" | undefined;

// lib/types.ts
export type { Player, PlayerId } from '@/features/players/types';
// keep other lib types as-is


export type TargetSpec = {
    roles: string[]; // e.g., ["A","B"], ["STARTER"], etc.
    constraints?: {
        distinct?: boolean;
        genderOfA?: "M" | "F"; // optional constraint for role A
    };
};

export type CardSource = {
    id: string;
    mode: "pre";
    kind: "action" | "versus" | "group" | "wildcard" | "rule_on" | "rule_off" | "question";
    target: TargetSpec;
    text: string;
    altText?: string;
    spice: number; // 1-3 for now
    weight: number; // keep 1 for MVP
    ruleId?: string | null; // only for rule_on/off
};

export type BuiltCard = CardSource & {
    actors: Record<string, number>; // role -> player index
    rendered: string;
};
