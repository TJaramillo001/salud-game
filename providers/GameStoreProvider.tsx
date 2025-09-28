'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { Pack } from '@/features/questions/types';
import { getPackById } from '@/features/questions/repository';
import { resetPackSeen } from '@/features/deck/antiRepeat';

type GameStore = {
    players: string[];
    addPlayer: (name: string) => void;
    removePlayer: (name: string) => void;
    clearPlayers: () => void;

    mode: Pack['id'] | null;
    setMode: (m: Pack['id']) => Promise<void>;

    pack: Pack | null;

    /** Clears the anti-repeat store for the currently selected pack */
    resetSeen: () => void;
};

const Ctx = createContext<GameStore | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<string[]>([]);
    const [mode, setModeState] = useState<Pack['id'] | null>(null);
    const [pack, setPack] = useState<Pack | null>(null);

    function addPlayer(name: string) {
        const n = name.trim();
        if (!n) return;
        setPlayers(prev => (prev.includes(n) ? prev : [...prev, n]));
    }
    function removePlayer(name: string) {
        setPlayers(prev => prev.filter(p => p !== name));
    }
    function clearPlayers() {
        setPlayers([]);
    }

    async function setMode(m: Pack['id']) {
        setModeState(m);
        const p = await getPackById(m);
        setPack(p ?? null);
    }

    function resetSeen() {
        if (mode) {
            resetPackSeen(mode);
        }
    }

    const value = useMemo(
        () => ({
            players,
            addPlayer,
            removePlayer,
            clearPlayers,
            mode,
            setMode,
            pack,
            resetSeen,
        }),
        [players, mode, pack]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGameStore() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
    return ctx;
}
