'use client';

import { useActiveRules } from '@/features/rules/useActiveRules';

const RULE_THEME = {
    bg: 'rgba(252,211,77,0.18)', // FCD34D @ ~18% for subtle badge
    border: '#D97706',           // amber-600
    text: '#92400E',             // amber-800
};

export function DeckHUD() {
    const { rules } = useActiveRules();

    return (
        <div className="w-full max-w-md flex flex-col gap-2">
            {rules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {rules.map((r) => (
                        <span
                            key={r.ruleId}
                            className="rounded-full px-3 py-1 text-xs"
                            title={`Regla activa: ${r.ruleId}`}
                            style={{
                                backgroundColor: RULE_THEME.bg,
                                border: `1px solid ${RULE_THEME.border}`,
                                color: RULE_THEME.text,
                            }}
                        >
              ⛓️ {r.ruleId}
            </span>
                    ))}
                </div>
            )}
        </div>
    );
}
