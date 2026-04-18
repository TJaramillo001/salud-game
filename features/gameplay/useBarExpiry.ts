// features/gameplay/useBarExpiry.ts
//
// Extracted hook: manages bar session expiry detection and modal state
// during gameplay. Previously inlined in app/game/play/page.tsx.
//
// Design decisions:
// - Tracks whether the bar was active when gameplay started (wasBarActive ref).
// - When bar transitions from active -> expired, shows the expiry modal.
// - handleDismiss checks if the current mode requires bar access and redirects
//   if needed.
// - This hook is purely UI state -- the actual bar session expiry is handled
//   by useBarSession's interval in features/bars/useBarSession.ts.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBarSession } from '@/features/bars/useBarSession';
import { isModeAccessible } from '@/features/bars/access';
import type { ModeKey } from '@/features/modes/types';

export function useBarExpiry(selectedMode: ModeKey | null) {
    const router = useRouter();
    const { barSession, isBarActive } = useBarSession();

    const [showBarExpired, setShowBarExpired] = useState(false);
    const wasBarActive = useRef(false);

    useEffect(() => {
        if (isBarActive) wasBarActive.current = true;
        if (wasBarActive.current && !isBarActive && barSession === null) {
            setShowBarExpired(true);
        }
    }, [isBarActive, barSession]);

    const handleBarExpiredDismiss = useCallback(() => {
        setShowBarExpired(false);
        if (selectedMode && !isModeAccessible(selectedMode, null)) {
            router.replace('/game/setup/mode');
        }
    }, [selectedMode, router]);

    return {
        barSession,
        isBarActive,
        showBarExpired,
        handleBarExpiredDismiss,
    };
}
