'use client';

import * as React from 'react';
import type { Card } from '@/features/questions/types';
import type { Player } from '@/features/players/types';
import { renderText } from '@/lib/render';

type KindLabels = {
    rule_on: string;
    rule_off: string;
    group: string;
    wildcard: string;
    action: string;
    question: string;
    versus: string;
    default: string;
};

type RenderFallbacks = {
    playerA?: string;
    playerB?: string;
    playerC?: string;
    starter?: string;
};

type Props = {
    card: Card;
    subtitle?: string;
    dx?: number; // swipe offset
    players?: Player[];
    actors?: Partial<Record<string, number>>;
    kindLabels?: KindLabels;
    altPrefix?: string;
    renderFallbacks?: RenderFallbacks;
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

const DEFAULT_KIND_LABELS: KindLabels = {
    rule_on: 'Nueva regla',
    rule_off: 'Fin de regla',
    group: 'Ronda',
    wildcard: 'Wildcard',
    action: 'Acción',
    question: 'Pregunta',
    versus: 'Duelo',
    default: 'Carta',
};

function kindLabel(kind: Card['kind'], labels: KindLabels): string {
    return labels[kind as keyof KindLabels] ?? labels.default;
}

// ...imports unchanged

export const QuestionCard = React.memo(function QuestionCard({ card, subtitle, dx = 0, players = [], actors = {}, kindLabels, altPrefix = 'Alt:', renderFallbacks }: Props) {
    const rotation = Math.max(Math.min(dx / 20, 8), -8);
    const translate = Math.max(Math.min(dx, 120), -120);

    const renderedText = React.useMemo(
        () => renderText(card.text, actors, players, renderFallbacks),
        [card.text, actors, players, renderFallbacks]
    );
    const renderedAlt = React.useMemo(
        () => 'altText' in card && card.altText ? renderText(card.altText, actors, players, renderFallbacks) : null,
        [card, actors, players, renderFallbacks]
    );

    const cat = categoryOf(card.kind);
    const theme = THEMES[cat];
    const labels = kindLabels ?? DEFAULT_KIND_LABELS;

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
                    {kindLabel(card.kind, labels)}
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
                        {altPrefix} {renderedAlt}
                    </div>
                ) : null}
            </div>
        </div>
    );
});

export default QuestionCard;
