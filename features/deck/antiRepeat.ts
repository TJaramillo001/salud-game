// LocalStorage-backed "seen cards" per pack
const KEY = 'salud_seen_v1';

type SeenMap = Record<string, true>;

function safeGet(): Record<string, SeenMap> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function safeSet(data: Record<string, SeenMap>) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(data));
}

export function makeCardKey(packId: string, packVersion: number, cardId: string) {
    return `${packId}@${packVersion}#${cardId}`;
}

export function markSeen(packId: string, key: string) {
    const all = safeGet();
    all[packId] = all[packId] || {};
    all[packId][key] = true;
    safeSet(all);
}

export function isSeen(packId: string, key: string): boolean {
    const all = safeGet();
    return !!all[packId]?.[key];
}

export function resetPackSeen(packId: string) {
    const all = safeGet();
    delete all[packId];
    safeSet(all);
}
