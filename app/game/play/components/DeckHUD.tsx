//app/game/play/components/DeckHUD.tsx
'use client';

import { useActiveRules } from '@/features/rules/useActiveRules';

/**
 * DeckHUD with NO progress and NO manual rule clearing.
 * Shows only active rules as passive badges (tap-tooltips can be added later).
 */
export function DeckHUD() {
    const { rules } = useActiveRules();

    return (
        <div className="w-full max-w-md flex flex-col gap-2">
            {/* No progress / remaining / turn info */}
            {rules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {rules.map((r) => (
                        <span
                            key={r.ruleId}
                            className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
                            title={`Regla activa: ${r.ruleId}`}
                        >
              ⛓️ {r.ruleId}
            </span>
                    ))}
                </div>
            )}
        </div>
    );
}
