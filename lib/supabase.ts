// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** Browser client (anon key) — for inserting events from the client. */
export function getSupabaseClient(): SupabaseClient | null {
    if (!url || !anonKey) return null;
    return createClient(url, anonKey);
}

/** Server-only admin client (service role) — for cron aggregation queries. */
export function getSupabaseAdmin(): SupabaseClient | null {
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey);
}
