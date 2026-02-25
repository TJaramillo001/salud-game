'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/providers/GameStoreProvider';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

export default function PlayersPage() {
    const { players, addPlayer, removePlayer, clearPlayers, state: { selectedLanguage } } = useGameStore();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const router = useRouter();

    // Guard: must have selected a language first
    useEffect(() => {
        if (!selectedLanguage) {
            router.replace('/game/setup/language');
        }
    }, [selectedLanguage, router]);

    function add() {
        if (!name.trim()) return;
        addPlayer(name.trim());
        setName('');
    }

    return (
        <main className="min-h-dvh flex flex-col items-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">{t.setup.players.title}</h1>

            <div className="flex gap-2">
                <input
                    className="border rounded px-3 py-2"
                    value={name}
                    placeholder={t.setup.players.placeholder}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                />
                <Button onClick={add}>{t.setup.players.add}</Button>
            </div>

            <ul className="w-full max-w-md">
                {players.map((p) => (
                    <li key={p.id} className="flex justify-between items-center border-b py-2">
                        <span>{p.name}</span>
                        <button className="text-sm underline" onClick={() => removePlayer(p.id)}>
                            {t.setup.players.remove}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="flex gap-3">
                <Button variant="secondary" onClick={clearPlayers}>
                    {t.setup.players.clearAll}
                </Button>
                <Button onClick={() => router.push('/game/setup/mode')} disabled={players.length === 0}>
                    {t.setup.players.continue}
                </Button>
            </div>
        </main>
    );
}