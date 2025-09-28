'use client';

import type { Card } from '@/features/questions/types';

export function QuestionCard({ card, subtitle, dx = 0 }: { card: Card; subtitle?: string | null; dx?: number }) {
    const rotate = Math.max(-12, Math.min(12, dx / 8));
    return (
        <div
            className="w-full max-w-md rounded-2xl shadow p-6 bg-white text-black will-change-transform select-none"
            style={{ transform: `translateX(${dx}px) rotate(${rotate}deg)` }}
        >
            <div className="text-xs uppercase tracking-wide mb-2 text-neutral-500">
                {card.type === 'rule' ? 'Nueva regla' : card.type === 'scenario' ? 'Escenario' : 'Pregunta'}
            </div>
            {subtitle && <div className="mb-2 text-sm text-neutral-600">{subtitle}</div>}
            <div className="text-lg leading-snug">{card.text}</div>
        </div>
    );
}
