// lib/barAnalytics.ts — Client-side bar analytics with batched inserts
import { getSupabaseClient } from './supabase';

type BarEventType =
    | 'session_start'
    | 'card_swipe'
    | 'bar_card_shown'
    | 'mode_selected'
    | 'game_end';

type BarEvent = {
    bar_slug: string;
    event_type: BarEventType;
    session_id: string | null;
    metadata: Record<string, unknown>;
};

const queue: BarEvent[] = [];
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
        if (!supabase) return;
        await supabase.from('bar_events').insert(batch);
    } catch {
        // Analytics should never break gameplay — silently drop on failure
    }
}

/**
 * Track a bar analytics event. Events are batched and flushed every 5s
 * or on page unload. Fails silently if Supabase is not configured.
 */
export function trackBarEvent(
    eventType: BarEventType,
    barSlug: string,
    sessionId: string | null,
    metadata: Record<string, unknown> = {},
) {
    queue.push({
        bar_slug: barSlug,
        event_type: eventType,
        session_id: sessionId,
        metadata,
    });
    scheduleFlush();
}

/** Flush any remaining events immediately (call on page unload). */
export function flushBarEvents() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    flush();
}

// Flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushBarEvents();
    });
}
