// features/gameplay/useSessionAnalytics.ts
//
// Extracted hook: manages all analytics for a game session.
// Previously spread across app/game/play/page.tsx (3 different analytics paths:
//   1. game_sessions INSERT on mount
//   2. game_sessions UPDATE via Supabase client on end
//   3. game_sessions UPDATE via raw fetch+keepalive on unload/visibilitychange
//   4. bar_events tracking via trackBarEvent
// )
//
// This hook consolidates into a single pipeline:
// - Session start tracking (Supabase insert)
// - Per-card analytics (bar events batched)
// - Session end flush (tries Supabase client first, falls back to fetch+keepalive)
// - Visibility/unload handlers for data survival
//
// Design decisions:
// - Uses refs for counters to avoid stale closures in event handlers.
// - Single flushed flag prevents duplicate writes (fixes Bug 5 race condition).
// - keepalive fetch is the primary unload mechanism (better browser support than sendBeacon
//   for JSON payloads).
// - The hook returns stable callbacks so the play page does not need to manage any
//   analytics state.

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { trackBarEvent } from '@/lib/barAnalytics';
import type { Card } from '@/features/questions/types';
import type { ModeKey } from '@/features/modes/types';
import type { LanguageKey } from '@/features/languages/types';
import type { BarSession } from '@/features/bars/types';

type SessionAnalyticsConfig = {
    sessionId: string | null;
    selectedMode: ModeKey | null;
    selectedLanguage: LanguageKey | null;
    playerCount: number;
    barSession: BarSession | null;
    isBarActive: boolean;
};

export function useSessionAnalytics(config: SessionAnalyticsConfig) {
    const {
        sessionId,
        selectedMode,
        selectedLanguage,
        playerCount,
        barSession,
        isBarActive,
    } = config;

    // Refs for counters -- avoids stale closures in event handlers
    const cardsSwiped = useRef(0);
    const drinksNudged = useRef(0);
    const sessionIdRef = useRef(sessionId);
    const flushed = useRef(false);

    // Keep sessionId ref current
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    // Track session start in Supabase (once per session)
    const sessionTracked = useRef(false);
    useEffect(() => {
        if (sessionTracked.current || !sessionId || !selectedMode || !selectedLanguage) return;
        sessionTracked.current = true;
        const supabase = getSupabaseClient();
        if (!supabase) return;
        supabase.from('game_sessions').insert({
            session_id: sessionId,
            mode: selectedMode,
            language: selectedLanguage,
            player_count: playerCount,
            bar_slug: barSession?.slug ?? null,
        }).then(({ error }) => {
            if (error) console.warn('[analytics] game_sessions insert failed:', error.message);
        });
    }, [sessionId, selectedMode, selectedLanguage, playerCount, barSession]);

    // Fire-and-forget flush using fetch+keepalive (survives page navigation/unload)
    const flushBeacon = useCallback(() => {
        const sid = sessionIdRef.current;
        if (flushed.current || !sid || cardsSwiped.current === 0) return;
        flushed.current = true;
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!sbUrl || !sbKey) return;
        const payload = {
            cards_swiped: cardsSwiped.current,
            drinks_nudged: drinksNudged.current,
            ended_at: new Date().toISOString(),
        };
        try {
            fetch(`${sbUrl}/rest/v1/game_sessions?session_id=eq.${sid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': sbKey,
                    'Authorization': `Bearer ${sbKey}`,
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify(payload),
                keepalive: true,
            });
        } catch { /* analytics never break gameplay */ }
    }, []);

    // Async flush via Supabase client (used by explicit End button)
    const flushSessionStats = useCallback(async () => {
        const sid = sessionIdRef.current;
        if (flushed.current || !sid) return;
        flushed.current = true;
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const payload = {
            cards_swiped: cardsSwiped.current,
            drinks_nudged: drinksNudged.current,
            ended_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('game_sessions')
            .update(payload)
            .eq('session_id', sid);
        if (error) console.warn('[analytics] game_sessions update failed:', error.message);
    }, []);

    // Register visibility/unload handlers
    useEffect(() => {
        const onVisChange = () => {
            if (document.visibilityState === 'hidden') flushBeacon();
        };
        const onUnload = () => flushBeacon();
        document.addEventListener('visibilitychange', onVisChange);
        window.addEventListener('beforeunload', onUnload);
        return () => {
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('beforeunload', onUnload);
            flushBeacon(); // component unmount (navigation, redirect guards)
        };
    }, [flushBeacon]);

    // Track a card advance (counters + bar events)
    const trackCardAdvance = useCallback((card: Card | undefined) => {
        cardsSwiped.current += 1;
        if (card?.drink_count) {
            drinksNudged.current += card.drink_count;
        }

        // Bar analytics
        if (isBarActive && barSession) {
            trackBarEvent('card_swipe', barSession.slug, null, {
                card_id: card?.id,
                card_kind: card?.kind,
                mode: selectedMode,
            });
            if (card?.source === 'bar') {
                trackBarEvent('bar_card_shown', barSession.slug, null, {
                    card_id: card.id,
                    card_text: card.text?.slice(0, 80),
                });
            }
        }
    }, [isBarActive, barSession, selectedMode]);

    // Reset counters (for reshuffle)
    const resetCounters = useCallback(() => {
        cardsSwiped.current = 0;
        drinksNudged.current = 0;
        flushed.current = false;
        sessionTracked.current = false;
    }, []);

    return {
        cardsSwiped,
        drinksNudged,
        trackCardAdvance,
        flushSessionStats,
        resetCounters,
    };
}
