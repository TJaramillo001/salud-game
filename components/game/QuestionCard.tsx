// components/game/QuestionCard.tsx
'use client';

import * as React from 'react';
import type { Card } from '@/features/questions/types';

type Props = {
    card: Card;
    subtitle?: string;
    dx?: number; // swipe offset
};

function kindLabel(kind: Card['kind']): string {
    switch (kind) {
        case 'rule_on':
            return 'Nueva regla';
        case 'rule_off':
            return 'Fin de regla';
        case 'group':
            return 'Ronda';
        case 'versus':
            return 'Duelo';
        case 'wildcard':
            return 'Wildcard';
        case 'action':
            return 'Acción';
        case 'question':
            return 'Pregunta';
        default:
            return 'Carta';
    }
}

export function QuestionCard({ card, subtitle, dx = 0 }: Props) {
    const rotation = Math.max(Math.min(dx / 20, 8), -8); // subtle tilt
    const translate = Math.max(Math.min(dx, 120), -120);

    return (
        <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white/80 shadow-md backdrop-blur p-4 md:p-5 transition-transform"
            style={{
                transform: `translateX(${translate}px) rotate(${rotation}deg)`,
            }}
        >
            <div className="text-xs uppercase tracking-wide mb-2 text-neutral-500">
                {kindLabel(card.kind)}
            </div>

            {subtitle ? (
                <div className="mb-2 text-sm text-neutral-600">{subtitle}</div>
            ) : null}

            <div className="text-lg leading-snug">{card.text}</div>

            {/* Optional: show altText for fallback contexts */}
            {'altText' in card && card.altText ? (
                <div className="mt-3 text-xs text-neutral-500">Alt: {card.altText}</div>
            ) : null}
        </div>
    );
}

export default QuestionCard;
