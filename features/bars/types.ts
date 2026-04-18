// features/bars/types.ts

import type { LanguageKey } from '@/features/languages/types';

export type BarSlug = string;

export interface BarConfig {
    slug: BarSlug;
    name: string;
    city: string;
    sessionDurationMs: number;
    languages: LanguageKey[];
    active: boolean;
}

// PATCH (CoderB): Removed `signature` field. HMAC-signing bar sessions
// defends a zero-value target (free access to party card modes with no
// payment gate). The fallback-on-failure design meant unsigned sessions
// were always accepted anyway. If real security is needed, it should come
// from the payment integration (Lemon Squeezy), not from signing
// ephemeral localStorage tokens.
export interface BarSession {
    slug: BarSlug;
    name: string;
    expiresAt: number;
    startedAt: number;
}

export const BAR_SESSION_STORAGE_KEY = 'salud:barSession';

export function isBarSessionValid(session: BarSession | null): boolean {
    if (!session) return false;
    return Date.now() < session.expiresAt;
}
