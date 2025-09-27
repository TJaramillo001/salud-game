'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/providers/GameStoreProvider';
import { Button } from '@/components/ui/Button';

export default function PlayersPage() {
    const { players, addPlayer, removePlayer, clearPlayers } = useGameStore();
    const [name, setName] = useState('');
    const router = useRouter();

    function add() {
        addPlayer(name);
        setName('');
    }

    return (
        <main className="min-h-dvh flex flex-col items-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">Add Players</h1>
            <div className="flex gap-2">
                <input
                    className="border rounded px-3 py-2"
                    value={name}
                    placeholder="Player name"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                />
                <Button onClick={add}>Add</Button>
            </div>

            <ul className="w-full max-w-md">
                {players.map(p => (
                    <li key={p} className="flex justify-between items-center border-b py-2">
                        <span>{p}</span>
                        <button className="text-sm underline" onClick={() => removePlayer(p)}>remove</button>
                    </li>
                ))}
            </ul>

            <div className="flex gap-3">
                <Button variant="secondary" onClick={clearPlayers}>Clear</Button>
                <Button onClick={() => router.push('/game/setup/mode')} disabled={players.length === 0}>
                    Continue
                </Button>
            </div>
        </main>
    );
}
