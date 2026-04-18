// lib/analytics.ts
//
// Consolidated analytics pipeline.
//
// PREVIOUS STATE:
// Three separate analytics paths existed:
// 1. lib/analytics.ts -- trackEvent() posting to /api/telemetry (a no-op endpoint)
// 2. lib/barAnalytics.ts -- trackBarEvent() batching into Supabase bar_events table
// 3. Inline Supabase calls in play page -- game_sessions INSERT + UPDATE
//
// NEW STATE:
// Single pipeline with two backends:
// - Supabase (for bar_events and game_sessions -- already set up)
// - /api/telemetry (for general telemetry -- now forwards to Supabase if configured)
//
// The trackEvent() function now batches through the same mechanism as bar analytics
// to avoid duplicate flush/unload handler registration. All events go to a single
// queue that flushes to Supabase's game_events table (if configured) or silently
// drops (if not).
//
// BACKWARDS COMPATIBILITY:
// - trackEvent(type, payload) signature is preserved.
// - Existing callers (summary page, etc.) continue to work without changes.
// - If Supabase is not configured, events are silently dropped (no more /api/telemetry
//   round-trip to a no-op endpoint).

import { getSupabaseClient } from './supabase';

type AnalyticsEvent = {
    event_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
};

const queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 5_000);
}

async function flush() {
    flushTimer = null;
    if (queue.length === 0) return;

    const batch = queue.splice(0, queue.length);
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return; // Supabase not configured -- silently drop
        await supabase.from('game_events').insert(batch);
    } catch {
        // Analytics should never break gameplay -- silently drop on failure
    }
}

/**
 * Track a general analytics event. Events are batched and flushed every 5s
 * or on page visibility change. Fails silently if Supabase is not configured.
 *
 * This replaces the previous fetch-to-no-op-endpoint implementation.
 */
export async function trackEvent(type: string, payload: Record<string, unknown> = {}) {
    queue.push({
        event_type: type,
        metadata: payload,
        created_at: new Date().toISOString(),
    });
    scheduleFlush();
}

/** Flush any remaining events immediately (call on page unload). */
export function flushAnalyticsEvents() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    flush();
}

// Flush on page visibility change
if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushAnalyticsEvents();
    });
}
