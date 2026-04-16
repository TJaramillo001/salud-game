// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

let _browserClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

/** Browser client (anon key) — singleton, safe to call repeatedly. */
export function getSupabaseClient(): SupabaseClient | null {
    if (!url || !anonKey) return null;
    if (!_browserClient) _browserClient = createClient(url, anonKey);
    return _browserClient;
}

/** Server-only admin client (service role) — singleton. */
export function getSupabaseAdmin(): SupabaseClient | null {
    if (!url || !serviceKey) return null;
    if (!_adminClient) _adminClient = createClient(url, serviceKey);
    return _adminClient;
}
