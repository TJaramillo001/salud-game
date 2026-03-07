// features/bars/useBarSession.ts
'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/providers/GameStoreProvider';
import { isBarSessionValid } from './types';

export function useBarSession() {
    const { state: { barSession }, clearBarSession } = useGameStore();

    // Check expiry on mount and every 60 seconds
    useEffect(() => {
        if (!barSession) return;

        function check() {
            if (barSession && !isBarSessionValid(barSession)) {
                clearBarSession();
            }
        }

        check();
        const interval = setInterval(check, 60_000);
        return () => clearInterval(interval);
    }, [barSession, clearBarSession]);

    const isBarActive = isBarSessionValid(barSession);

    const timeRemaining = barSession
        ? Math.max(0, barSession.expiresAt - Date.now())
        : 0;

    return { barSession, isBarActive, timeRemaining, clearBarSession };
}
