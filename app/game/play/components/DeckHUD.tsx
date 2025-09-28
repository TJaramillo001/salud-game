'use client';

import { useActiveRules } from '@/features/rules/useActiveRules';

export function DeckHUD({ remaining, currentPlayer }: { remaining: number; currentPlayer?: string | null }) {
    const { rules, clearRule } = useActiveRules();

    return (
        <div className="w-full max-w-md flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-neutral-300">
                <span>Restantes: <strong className="text-white">{remaining}</strong></span>
                <span>Turno: <strong className="text-white">{currentPlayer ?? '—'}</strong></span>
            </div>

            {rules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {rules.map(r => (
                        <button
                            key={r.ruleId}
                            onClick={() => clearRule(r.ruleId)}
                            className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/20"
                            title="Quitar regla"
                        >
                            ⛓️ {r.ruleId}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
