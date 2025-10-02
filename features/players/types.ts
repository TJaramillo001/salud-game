// features/players/types.ts

export type PlayerId = string;

export type Gender = 'M' | 'F' | 'O';
export type Player = { id: string; name: string; gender?: Gender };


// Simple id helper (not crypto; fine for client ids)
export function newPlayerId(): PlayerId {
    // 12-char base36
    return Math.random().toString(36).slice(2, 14);
}
