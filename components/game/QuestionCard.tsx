'use client';

import * as React from 'react';
import type { Card } from '@/features/questions/types';
import type { Player } from '@/features/players/types';
import { renderText } from '@/lib/render';

type Props = {
    card: Card;
    subtitle?: string;
    dx?: number; // swipe offset
    players?: Player[];
    actors?: Partial<Record<string, number>>;
};

function categoryOf(kind: Card['kind']): 'normal' | 'group' | 'rule' | 'wildcard' {
    if (kind === 'group') return 'group';
    if (kind === 'rule_on' || kind === 'rule_off') return 'rule';
    if (kind === 'wildcard') return 'wildcard';
    return 'normal';
}

const THEMES = {
    normal:   { bg: '#7DD3FC', border: '#0284C7', label: '#075985' },
    group:    { bg: '#A5B4FC', border: '#4F46E5', label: '#3730A3' },
    rule:     { bg: '#FCD34D', border: '#D97706', label: '#92400E' },
    wildcard: { bg: '#F0ABFC', border: '#C026D3', label: '#86198F' },
} as const;

function kindLabel(kind: Card['kind']): string {
    switch (kind) {
        case 'rule_on': return 'Nueva regla';
        case 'rule_off': return 'Fin de regla';
        case 'group': return 'Ronda';
        case 'wildcard': return 'Wildcard';
        case 'action': return 'Acción';
        case 'question': return 'Pregunta';
        case 'versus': return 'Duelo';
        //case 'exclusion': return 'Exclusión';
        //case 'nudge': return 'Nudge';
        default: return 'Carta';
    }
}

// ...imports unchanged

export const QuestionCard = React.memo(function QuestionCard({ card, subtitle, dx = 0, players = [], actors = {} }: Props) {
    const rotation = Math.max(Math.min(dx / 20, 8), -8);
    const translate = Math.max(Math.min(dx, 120), -120);

    const renderedText = React.useMemo(
        () => renderText(card.text, actors, players),
        [card.text, actors, players]
    );
    const renderedAlt = React.useMemo(
        () => 'altText' in card && card.altText ? renderText(card.altText, actors, players) : null,
        [card, actors, players]
    );

    const cat = categoryOf(card.kind);
    const theme = THEMES[cat];

    return (
        <div
            className="rounded-3xl border-2 shadow-md transition-transform overflow-hidden select-none"
            style={{
                transform: `translateX(${translate}px) rotate(${rotation}deg)`,
                backgroundColor: theme.bg,
                borderColor: theme.border,
                width: 'min(92vw, 560px)',
                aspectRatio: '3 / 4',
            }}
        >
            {/* rest identical */}
            <div className="h-full flex flex-col p-6 md:p-8">
                <div
                    className="text-xs md:text-sm uppercase tracking-wide mb-3 font-semibold"
                    style={{ color: theme.label }}
                    title={cat}
                >
                    {kindLabel(card.kind)}
                </div>

                {subtitle ? (
                    <div className="mb-3 text-base md:text-lg font-semibold text-neutral-900">
                        {subtitle}
                    </div>
                ) : null}

                <div className="text-2xl md:text-3xl font-bold leading-tight text-black break-words">
                    {renderedText}
                </div>

                {renderedAlt ? (
                    <div className="mt-auto pt-4 text-sm md:text-base text-neutral-800">
                        Alt: {renderedAlt}
                    </div>
                ) : null}
            </div>
        </div>
    );
});

export default QuestionCard;
