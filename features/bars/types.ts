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
