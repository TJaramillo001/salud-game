'use client';

import type { Card } from '@/features/questions/types';

export function QuestionCard({ card }: { card: Card }) {
    return (
        <div className="w-full max-w-md rounded-2xl shadow p-6 bg-white text-black">
            {card.type === 'rule' ? (
                <div className="text-xs uppercase tracking-wide mb-2">New Rule</div>
            ) : (
                <div className="text-xs uppercase tracking-wide mb-2">
                    {card.type === 'scenario' ? 'Scenario' : 'Question'}
                </div>
            )}
            <div className="text-lg leading-snug">{card.text}</div>
        </div>
    );
}
