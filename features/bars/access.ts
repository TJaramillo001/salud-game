// features/bars/access.ts

import type { ModeKey } from '@/features/modes/types';
import type { BarSession } from './types';
import { isBarSessionValid } from './types';

const FREE_MODES: Set<ModeKey> = new Set(['pre']);

export function isModeAccessible(
    mode: ModeKey,
    barSession: BarSession | null,
    passwordUnlocked?: boolean,
): boolean {
    if (passwordUnlocked) return true;
    if (isBarSessionValid(barSession)) return true;
    return FREE_MODES.has(mode);
}

export type AccessReason = 'free' | 'bar' | 'password' | 'locked';

export function getModeAccessReason(
    mode: ModeKey,
    barSession: BarSession | null,
    passwordUnlocked?: boolean,
): AccessReason {
    if (passwordUnlocked) return 'password';
    if (isBarSessionValid(barSession)) return 'bar';
    if (FREE_MODES.has(mode)) return 'free';
    return 'locked';
}
