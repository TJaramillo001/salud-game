// providers/GameStoreProvider.tsx
'use client';

import React, {
    createContext,
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

// ---------- Domain types (extend as needed) ----------
export type PlayerId = string;

export type GameState = {
    // Core session
    sessionId: string | null;
    seed: number | null;
    gameOver: boolean;

    // Roster
    players: PlayerId[];

    // Seen cards (by stable card id)
    seen: string[];

    // New (Step 1): mode selection
    selectedMode: ModeKey | null;
};

export type GameAction =
    | { type: 'SET_MODE'; mode: ModeKey }
    | { type: 'SET_PLAYERS'; players: PlayerId[] }
    | { type: 'START_NEW_SESSION'; sessionId: string; seed: number }
    | { type: 'END_GAME' }
    | { type: 'RESET_RUNTIME' }
    | { type: 'MARK_SEEN'; cardId: string };

type GameDispatch = (action: GameAction) => void;

type GameStore = {
    // State and raw dispatcher
    state: GameState;
    dispatch: GameDispatch;

    // Convenience mirrors so components can destructure directly
    players: PlayerId[];

    // Convenience helpers (stable API for components)
    setMode: (mode: ModeKey) => void;
    setPlayers: (players: PlayerId[]) => void;
    addPlayer: (name: string) => void;
    removePlayer: (name: string) => void;
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
};

// ---------- Reducer ----------
function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_MODE': {
            return { ...state, selectedMode: action.mode };
        }
        case 'SET_PLAYERS': {
            return { ...state, players: action.players };
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

    // Hydrate selectedMode from localStorage (client only)
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

    // Persist selectedMode whenever it changes
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

    // Convenience helpers (keep these stable for components)
    const value = useMemo<GameStore>(
        () => ({
            state,
            dispatch,

            // expose for direct destructuring
            players: state.players,

            setMode: (mode: ModeKey) => dispatch({ type: 'SET_MODE', mode }),
            setPlayers: (players: PlayerId[]) =>
                dispatch({ type: 'SET_PLAYERS', players }),

            addPlayer: (name: string) => {
                const trimmed = name.trim();
                if (!trimmed) return;
                // Avoid duplicates (case-insensitive)
                const exists = state.players.some(
                    (p) => p.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
                );
                if (exists) return;
                dispatch({ type: 'SET_PLAYERS', players: [...state.players, trimmed] });
            },

            removePlayer: (name: string) => {
                const needle = name.toLocaleLowerCase();
                const next = state.players.filter(
                    (p) => p.toLocaleLowerCase() !== needle,
                );
                if (next.length !== state.players.length) {
                    dispatch({ type: 'SET_PLAYERS', players: next });
                }
            },

            clearPlayers: () => {
                if (state.players.length > 0) {
                    dispatch({ type: 'SET_PLAYERS', players: [] });
                }
            },

            startNewSession: (opts?: { forceMode?: ModeKey }) => {
                if (opts?.forceMode) {
                    dispatch({ type: 'SET_MODE', mode: opts.forceMode });
                }
                const sessionId = cryptoRandomId();
                const seed = cryptoRandomSeed();
                dispatch({ type: 'START_NEW_SESSION', sessionId, seed });
            },

            endGame: () => dispatch({ type: 'END_GAME' }),
            resetRuntime: () => dispatch({ type: 'RESET_RUNTIME' }),

            markSeen: (cardId: string) => dispatch({ type: 'MARK_SEEN', cardId }),
        }),
        [state],
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
