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
        if (!name.trim()) return;
        addPlayer(name.trim());
        setName('');
    }

    return (
        <main className="min-h-dvh flex flex-col items-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">Añadir jugadores</h1>

            <div className="flex gap-2">
                <input
                    className="border rounded px-3 py-2"
                    value={name}
                    placeholder="Nombre del jugador"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                />
                <Button onClick={add}>Agregar</Button>
            </div>

            <ul className="w-full max-w-md">
                {players.map((p) => (
                    <li key={p.id} className="flex justify-between items-center border-b py-2">
                        <span>{p.name}</span>
                        <button className="text-sm underline" onClick={() => removePlayer(p.id)}>
                            Quitar
                        </button>
                    </li>
                ))}
            </ul>

            <div className="flex gap-3">
                <Button variant="secondary" onClick={clearPlayers}>
                    Borrar todos
                </Button>
                <Button onClick={() => router.push('/game/setup/mode')} disabled={players.length === 0}>
                    Continuar
                </Button>
            </div>
        </main>
    );
}
