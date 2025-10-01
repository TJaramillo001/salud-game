// components/game/ModeTile.tsx
'use client';

import * as React from 'react';
import { ModeMeta } from '@/features/modes/types';

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

type Props = {
    meta: ModeMeta;
    selected: boolean;
    onSelect: () => void;
};

export default function ModeTile({ meta, selected, onSelect }: Props) {
    const { label, description, emoji, color } = meta;

    // Tailwind ring/background tokens, e.g., 'ring-emerald-500/50'
    const ring = `ring-${color}-500/50`;
    const bg = selected ? `bg-${color}-50` : 'bg-white/50';

    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className={cx(
                'w-full text-left rounded-2xl p-4 md:p-5 transition',
                'border border-black/10 shadow-sm hover:shadow-md',
                'focus:outline-none focus-visible:ring-4',
                ring,
                bg
            )}
        >
            <div className="flex items-center gap-3">
                <div className="text-2xl">{emoji}</div>
                <div className="flex-1">
                    <div className="font-semibold text-lg">{label}</div>
                    <div className="text-sm text-black/70">{description}</div>
                </div>
                <div
                    className={cx(
                        'h-5 w-5 rounded-full border',
                        selected ? `bg-${color}-500 border-${color}-600` : 'bg-white border-black/20'
                    )}
                    aria-hidden
                />
            </div>
        </button>
    );
}
