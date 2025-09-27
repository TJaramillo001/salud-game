'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { listPacks } from '@/features/questions/repository';
import type { Pack } from '@/features/questions/types';
import { useGameStore } from '@/providers/GameStoreProvider';

export default function ModePage() {
    const [packs, setPacks] = useState<Pack[]>([]);
    const { setMode } = useGameStore();
    const router = useRouter();

    useEffect(() => {
        (async () => setPacks(await listPacks()))();
    }, []);

    async function choose(id: Pack['id']) {
        await setMode(id);
        router.push('/game/play');
    }

    return (
        <main className="min-h-dvh p-6">
            <h1 className="text-2xl font-semibold mb-4">Choose Game Mode</h1>
            <div className="grid grid-cols-2 gap-4 max-w-md">
                {packs.map(p => (
                    <button
                        key={p.id}
                        className="rounded-xl border p-4 text-left hover:shadow"
                        onClick={() => choose(p.id)}
                    >
                        <div className="text-lg font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">Cards: {p.cards.length}</div>
                    </button>
                ))}
            </div>

            <div className="mt-6">
                <Button variant="ghost" onClick={() => router.back()}>Back</Button>
            </div>
        </main>
    );
}
