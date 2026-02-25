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

// ---------- Storage keys ----------
const PLAYERS_STORAGE_KEY = 'SALUD_PLAYERS_V1';

// ---------- Domain state ----------
export type GameState = {
    // Core session
    sessionId: string | null;
    seed: number | null;
    gameOver: boolean;

    // Roster (future-proof: full Player objects)
    players: Player[];

    // Seen cards (by stable card id)
    seen: string[];

    // Mode selection
    selectedMode: ModeKey | null;

    // Language selection
    selectedLanguage: LanguageKey | null;
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
    | { type: 'MARK_SEEN'; cardId: string };

type GameDispatch = (action: GameAction) => void;

type GameStore = {
    // State and dispatcher
    state: GameState;
    dispatch: GameDispatch;

    // Convenience mirrors so components can destructure directly
    players: Player[];

    // Helpers (stable API for components)
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
};

// ---------- Initial state ----------
const initialState: GameState = {
    sessionId: null,
    seed: null,
    gameOver: false,
    players: [],
    seen: [],
    selectedMode: null,
    selectedLanguage: null,
};

// ---------- Reducer ----------
function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_MODE': {
            return { ...state, selectedMode: action.mode };
        }
        case 'SET_LANGUAGE': {
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
            // Fresh run: clear runtime state
            return {
                ...state,
                sessionId: action.sessionId,
                seed: action.seed,
                gameOver: false,
                seen: [],
                // Keep selectedMode as chosen prior to play
            };
        }
        case 'END_GAME': {
            return { ...state, gameOver: true };
        }
        case 'RESET_RUNTIME': {
            // For "Replay" from end screen
            return {
                ...state,
                gameOver: false,
                seen: [],
            };
        }
        case 'MARK_SEEN': {
            if (state.seen.includes(action.cardId)) return state;
            return { ...state, seen: [...state.seen, action.cardId] };
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

    // ---- Hydrate selectedLanguage from localStorage (client only)
    useEffect(() => {
        try {
            const raw =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
                    : null;
            if (raw && isLanguageKey(raw) && state.selectedLanguage == null) {
                dispatch({ type: 'SET_LANGUAGE', language: raw });
            }
        } catch {
            // ignore storage failures
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Hydrate selectedMode from localStorage (client only)
    useEffect(() => {
        try {
            const raw =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem(MODE_STORAGE_KEY)
                    : null;
            if (raw && isModeKey(raw) && state.selectedMode == null) {
                dispatch({ type: 'SET_MODE', mode: raw });
            }
        } catch {
            // ignore storage failures
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Hydrate players from localStorage with migration (strings[] -> Player[])
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const raw = window.localStorage.getItem(PLAYERS_STORAGE_KEY);

            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Expect [{id, name}] but be tolerant
                    const asPlayers: Player[] = parsed
                        .map((p: any): Player | null => {
                            if (p && typeof p.name === 'string') {
                                return {
                                    id: typeof p.id === 'string' ? p.id : newPlayerId(),
                                    name: p.name,
                                    gender: p.gender,
                                };
                            }
                            return null;
                        })
                        .filter(Boolean) as Player[];

                    if (asPlayers.length > 0) {
                        dispatch({ type: 'SET_PLAYERS', players: asPlayers });
                    }
                }
            } else {
                // Legacy migration: if someone previously stored string[] elsewhere, migrate here.
                // (No legacy key known; if you had one, check and transform to Player[])
            }
        } catch {
            // ignore storage failures
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Persist selectedLanguage
    useEffect(() => {
        try {
            if (state.selectedLanguage) {
                window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.selectedLanguage);
            } else {
                window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
            }
        } catch {
            // ignore storage failures
        }
    }, [state.selectedLanguage]);

    // ---- Persist selectedMode
    useEffect(() => {
        try {
            if (state.selectedMode) {
                window.localStorage.setItem(MODE_STORAGE_KEY, state.selectedMode);
            } else {
                window.localStorage.removeItem(MODE_STORAGE_KEY);
            }
        } catch {
            // ignore storage failures
        }
    }, [state.selectedMode]);

    // ---- Persist players whenever they change
    useEffect(() => {
        try {
            window.localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(state.players));
        } catch {
            // ignore storage failures
        }
    }, [state.players]);

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

    // ---------- Context value ----------
    const value = useMemo<GameStore>(
        () => ({
            state,
            dispatch,
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
        }),
        [state, setLanguage, setMode, setPlayers, addPlayer, removePlayer, clearPlayers, startNewSession, endGame, resetRuntime, markSeen],
    );

    return (
        <GameStoreContext.Provider value={value}>
            {children}
        </GameStoreContext.Provider>
    );
}

// ---------- Hook ----------
export function useGameStore() {
    const ctx = useContext(GameStoreContext);
    if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
    return ctx;
}

// ---------- Utilities ----------
function cryptoRandomId(): string {
    // 16-byte random hex id (safe for client only)
    const arr = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
    } else {
        // Fallback: Math.random (non-crypto). Acceptable for game sessions.
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
