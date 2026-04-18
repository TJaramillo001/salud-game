// providers/GameStoreProvider.tsx
'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    useEffect,
} from 'react';
import {
    ModeKey,
    MODE_STORAGE_KEY,
    isModeKey,
} from '@/features/modes/types';
import {
    LanguageKey,
    LANGUAGE_STORAGE_KEY,
    isLanguageKey,
} from '@/features/languages/types';
import type { Player, PlayerId } from '@/features/players/types';
import { newPlayerId } from '@/features/players/types';
import type { BarSession } from '@/features/bars/types';
import { BAR_SESSION_STORAGE_KEY, isBarSessionValid } from '@/features/bars/types';

// ---------- Storage keys ----------
const PLAYERS_STORAGE_KEY = 'SALUD_PLAYERS_V1';
const PLAY_PROGRESS_KEY = 'salud:playProgress';

// ---------- Domain state ----------
export type GameState = {
    // Core session
    sessionId: string | null;
    seed: number | null;
    gameOver: boolean;

    // Roster
    players: Player[];

    // Seen cards -- stored as a Set internally for O(1) lookup.
    // The Set is serialized to/from arrays at persistence boundaries only.
    seen: Set<string>;

    // Mode selection
    selectedMode: ModeKey | null;

    // Language selection
    selectedLanguage: LanguageKey | null;

    // Bar session (QR-activated premium)
    barSession: BarSession | null;

    // Session counters
    cardsSwiped: number;
    drinksNudged: number;

    // Hydration flag -- true once localStorage values have been loaded
    hydrated: boolean;
};

export type GameAction =
    | { type: 'SET_MODE'; mode: ModeKey }
    | { type: 'SET_LANGUAGE'; language: LanguageKey }
    | { type: 'SET_PLAYERS'; players: Player[] }
    | { type: 'ADD_PLAYER'; name: string }
    | { type: 'REMOVE_PLAYER'; id: PlayerId }
    | { type: 'CLEAR_PLAYERS' }
    | { type: 'START_NEW_SESSION'; sessionId: string; seed: number }
    | { type: 'END_GAME' }
    | { type: 'RESET_RUNTIME' }
    | { type: 'MARK_SEEN'; cardId: string }
    | { type: 'SET_BAR_SESSION'; session: BarSession }
    | { type: 'CLEAR_BAR_SESSION' }
    | { type: 'INCREMENT_COUNTERS'; cards: number; drinks: number }
    | { type: 'HYDRATE'; payload: Partial<Pick<GameState, 'selectedMode' | 'selectedLanguage' | 'players' | 'barSession'>> }
    | { type: 'RESTORE_PROGRESS'; seen: Set<string>; cardsSwiped: number; drinksNudged: number; sessionId: string; seed: number };

type GameDispatch = (action: GameAction) => void;

// ---------- Store shape ----------
// PATCH (CoderB): Reverted from split Dispatch/State contexts to a single
// context. Rationale: audited all 9 consumers of useGameStore() -- exactly
// ONE (app/bar/[slug]/page.tsx) is dispatch-only, and it also reads state
// via useBarSession(). The split added two contexts, three hooks, and a
// useMemo merge in useGameStore() for zero measurable re-render savings.
export type GameStore = {
    dispatch: GameDispatch;
    state: GameState;
    players: Player[];
    setLanguage: (language: LanguageKey) => void;
    setMode: (mode: ModeKey) => void;
    setPlayers: (players: Player[]) => void;
    addPlayer: (name: string) => void;
    removePlayer: (id: PlayerId) => void;
    clearPlayers: () => void;
    startNewSession: (opts?: { forceMode?: ModeKey }) => void;
    endGame: () => void;
    resetRuntime: () => void;
    markSeen: (cardId: string) => void;
    setBarSession: (session: BarSession) => void;
    clearBarSession: () => void;
};

// ---------- Initial state ----------
const initialState: GameState = {
    sessionId: null,
    seed: null,
    gameOver: false,
    players: [],
    seen: new Set(),
    selectedMode: null,
    selectedLanguage: null,
    barSession: null,
    cardsSwiped: 0,
    drinksNudged: 0,
    hydrated: false,
};

// ---------- Reducer ----------
function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_MODE': {
            if (state.selectedMode === action.mode) return state;
            return { ...state, selectedMode: action.mode };
        }
        case 'SET_LANGUAGE': {
            if (state.selectedLanguage === action.language) return state;
            return { ...state, selectedLanguage: action.language };
        }
        case 'SET_PLAYERS': {
            return { ...state, players: action.players };
        }
        case 'ADD_PLAYER': {
            const trimmed = action.name.trim();
            if (!trimmed || trimmed.length > 50) return state;
            const exists = state.players.some(
                (p) => p.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
            );
            if (exists) return state;
            return { ...state, players: [...state.players, { id: newPlayerId(), name: trimmed }] };
        }
        case 'REMOVE_PLAYER': {
            const next = state.players.filter((p) => p.id !== action.id);
            if (next.length === state.players.length) return state;
            return { ...state, players: next };
        }
        case 'CLEAR_PLAYERS': {
            if (state.players.length === 0) return state;
            return { ...state, players: [] };
        }
        case 'START_NEW_SESSION': {
            return {
                ...state,
                sessionId: action.sessionId,
                seed: action.seed,
                gameOver: false,
                seen: new Set(),
                cardsSwiped: 0,
                drinksNudged: 0,
            };
        }
        case 'END_GAME': {
            return { ...state, gameOver: true };
        }
        case 'RESET_RUNTIME': {
            return {
                ...state,
                gameOver: false,
                seen: new Set(),
                cardsSwiped: 0,
                drinksNudged: 0,
            };
        }
        case 'MARK_SEEN': {
            // O(1) Set check instead of O(n) Array.includes
            if (state.seen.has(action.cardId)) return state;
            const nextSeen = new Set(state.seen);
            nextSeen.add(action.cardId);
            return { ...state, seen: nextSeen };
        }
        case 'SET_BAR_SESSION': {
            return { ...state, barSession: action.session };
        }
        case 'CLEAR_BAR_SESSION': {
            return { ...state, barSession: null };
        }
        case 'INCREMENT_COUNTERS': {
            return {
                ...state,
                cardsSwiped: state.cardsSwiped + action.cards,
                drinksNudged: state.drinksNudged + action.drinks,
            };
        }
        case 'HYDRATE': {
            // Single atomic hydration from localStorage.
            // Only apply values for fields that are still null/empty (don't overwrite
            // in-flight state if a user action raced the hydration).
            const p = action.payload;
            return {
                ...state,
                selectedMode: state.selectedMode ?? (p.selectedMode ?? null),
                selectedLanguage: state.selectedLanguage ?? (p.selectedLanguage ?? null),
                players: state.players.length > 0 ? state.players : (p.players ?? []),
                barSession: state.barSession ?? (p.barSession ?? null),
                hydrated: true,
            };
        }
        case 'RESTORE_PROGRESS': {
            return {
                ...state,
                seen: action.seen,
                cardsSwiped: action.cardsSwiped,
                drinksNudged: action.drinksNudged,
                sessionId: action.sessionId,
                seed: action.seed,
                gameOver: false,
            };
        }
        default:
            return state;
    }
}

// ---------- Context ----------
const GameStoreContext = createContext<GameStore | null>(null);

// ---------- Provider ----------
export function GameStoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // ---- Single atomic hydration from localStorage on mount ----
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;

            // Language
            let selectedMode: ModeKey | undefined;
            let selectedLanguage: LanguageKey | undefined;
            let players: Player[] | undefined;
            let barSession: BarSession | undefined;

            const rawLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (rawLang && isLanguageKey(rawLang)) {
                selectedLanguage = rawLang;
            }

            // Mode
            const rawMode = window.localStorage.getItem(MODE_STORAGE_KEY);
            if (rawMode && isModeKey(rawMode)) {
                selectedMode = rawMode;
            }

            // Players
            const rawPlayers = window.localStorage.getItem(PLAYERS_STORAGE_KEY);
            if (rawPlayers) {
                const parsed = JSON.parse(rawPlayers);
                if (Array.isArray(parsed)) {
                    const asPlayers: Player[] = parsed
                        .map((p: unknown): Player | null => {
                            if (p && typeof p === 'object' && 'name' in p && typeof (p as Record<string, unknown>).name === 'string') {
                                const rec = p as Record<string, unknown>;
                                return {
                                    id: typeof rec.id === 'string' ? rec.id : newPlayerId(),
                                    name: rec.name as string,
                                    gender: rec.gender as Player['gender'],
                                };
                            }
                            return null;
                        })
                        .filter(Boolean) as Player[];
                    if (asPlayers.length > 0) {
                        players = asPlayers;
                    }
                }
            }

            // Bar session
            const rawBar = window.localStorage.getItem(BAR_SESSION_STORAGE_KEY);
            if (rawBar) {
                const parsed = JSON.parse(rawBar) as BarSession;
                if (parsed && isBarSessionValid(parsed)) {
                    barSession = parsed;
                } else {
                    window.localStorage.removeItem(BAR_SESSION_STORAGE_KEY);
                }
            }

            dispatch({
                type: 'HYDRATE',
                payload: { selectedMode, selectedLanguage, players, barSession },
            });
        } catch {
            // If localStorage is unavailable, still mark hydrated so the app renders
            dispatch({
                type: 'HYDRATE',
                payload: {},
            });
        }
    }, []);

    // ---- Persist selectedLanguage ----
    useEffect(() => {
        if (!state.hydrated) return;
        try {
            if (state.selectedLanguage) {
                window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.selectedLanguage);
            } else {
                window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
            }
        } catch { /* ignore */ }
    }, [state.selectedLanguage, state.hydrated]);

    // ---- Persist selectedMode ----
    useEffect(() => {
        if (!state.hydrated) return;
        try {
            if (state.selectedMode) {
                window.localStorage.setItem(MODE_STORAGE_KEY, state.selectedMode);
            } else {
                window.localStorage.removeItem(MODE_STORAGE_KEY);
            }
        } catch { /* ignore */ }
    }, [state.selectedMode, state.hydrated]);

    // ---- Persist players whenever they change ----
    useEffect(() => {
        if (!state.hydrated) return;
        try {
            window.localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(state.players));
        } catch { /* ignore */ }
    }, [state.players, state.hydrated]);

    // ---- Persist barSession (single effect -- duplicate removed) ----
    useEffect(() => {
        if (!state.hydrated) return;
        try {
            if (state.barSession) {
                window.localStorage.setItem(BAR_SESSION_STORAGE_KEY, JSON.stringify(state.barSession));
            } else {
                window.localStorage.removeItem(BAR_SESSION_STORAGE_KEY);
            }
        } catch { /* ignore */ }
    }, [state.barSession, state.hydrated]);

    // ---- Persist play progress (seen cards, counters) for refresh survival ----
    useEffect(() => {
        if (!state.hydrated || !state.sessionId) return;
        try {
            const payload = {
                sessionId: state.sessionId,
                seed: state.seed,
                seen: Array.from(state.seen),
                cardsSwiped: state.cardsSwiped,
                drinksNudged: state.drinksNudged,
                savedAt: Date.now(),
            };
            window.localStorage.setItem(PLAY_PROGRESS_KEY, JSON.stringify(payload));
        } catch { /* ignore */ }
    }, [state.seen, state.cardsSwiped, state.drinksNudged, state.sessionId, state.seed, state.hydrated]);

    // ---------- Stable helpers (dispatch is stable from useReducer) ----------
    const setLanguage = useCallback(
        (language: LanguageKey) => dispatch({ type: 'SET_LANGUAGE', language }),
        [dispatch],
    );
    const setMode = useCallback(
        (mode: ModeKey) => dispatch({ type: 'SET_MODE', mode }),
        [dispatch],
    );
    const setPlayers = useCallback(
        (players: Player[]) => dispatch({ type: 'SET_PLAYERS', players }),
        [dispatch],
    );
    const addPlayer = useCallback(
        (name: string) => dispatch({ type: 'ADD_PLAYER', name }),
        [dispatch],
    );
    const removePlayer = useCallback(
        (id: PlayerId) => dispatch({ type: 'REMOVE_PLAYER', id }),
        [dispatch],
    );
    const clearPlayers = useCallback(
        () => dispatch({ type: 'CLEAR_PLAYERS' }),
        [dispatch],
    );
    const startNewSession = useCallback(
        (opts?: { forceMode?: ModeKey }) => {
            if (opts?.forceMode) dispatch({ type: 'SET_MODE', mode: opts.forceMode });
            dispatch({ type: 'START_NEW_SESSION', sessionId: cryptoRandomId(), seed: cryptoRandomSeed() });
        },
        [dispatch],
    );
    const endGame = useCallback(() => dispatch({ type: 'END_GAME' }), [dispatch]);
    const resetRuntime = useCallback(() => dispatch({ type: 'RESET_RUNTIME' }), [dispatch]);
    const markSeen = useCallback(
        (cardId: string) => dispatch({ type: 'MARK_SEEN', cardId }),
        [dispatch],
    );
    const setBarSession = useCallback(
        (session: BarSession) => dispatch({ type: 'SET_BAR_SESSION', session }),
        [dispatch],
    );
    const clearBarSession = useCallback(
        () => dispatch({ type: 'CLEAR_BAR_SESSION' }),
        [dispatch],
    );

    // ---------- Single context value ----------
    const storeValue = useMemo<GameStore>(
        () => ({
            dispatch,
            state,
            players: state.players,
            setLanguage,
            setMode,
            setPlayers,
            addPlayer,
            removePlayer,
            clearPlayers,
            startNewSession,
            endGame,
            resetRuntime,
            markSeen,
            setBarSession,
            clearBarSession,
        }),
        // state changes trigger a new value (this is the intended behavior --
        // consumers that read state need to re-render). Dispatch callbacks are
        // stable (useCallback with [dispatch]) so they don't contribute churn.
        [state, dispatch, setLanguage, setMode, setPlayers, addPlayer, removePlayer, clearPlayers, startNewSession, endGame, resetRuntime, markSeen, setBarSession, clearBarSession],
    );

    return (
        <GameStoreContext.Provider value={storeValue}>
            {children}
        </GameStoreContext.Provider>
    );
}

// ---------- Hooks ----------

/** Primary store hook used by all consumers. */
export function useGameStore(): GameStore {
    const ctx = useContext(GameStoreContext);
    if (!ctx) {
        throw new Error('useGameStore must be used within GameStoreProvider');
    }
    return ctx;
}

/** Expose the play progress storage key for the play page to restore from. */
export const PLAY_PROGRESS_STORAGE_KEY = PLAY_PROGRESS_KEY;

// ---------- Utilities ----------
function cryptoRandomId(): string {
    const arr = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
    } else {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function cryptoRandomSeed(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0] >>> 0;
    }
    return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
