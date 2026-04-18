// features/gameplay/useRuleLifecycle.ts
//
// Extracted hook: manages the rule lifecycle (rule_on / rule_off processing)
// for the currently visible card. Previously inlined in app/game/play/page.tsx.
//
// Design decisions:
// - Uses a Set ref to track processed card IDs (prevents double-firing).
// - Resets the processed set on reshuffle (runId change).
// - The hook reads from useActiveRules() and calls addRule/clearRule/clearAll.
// - Accepts the current card as a parameter so it can work with both
//   online and offline deck flows.

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useActiveRules } from '@/features/rules/useActiveRules';
import type { Card } from '@/features/questions/types';

export function useRuleLifecycle(activeCard: Card | null | undefined, runId: number) {
    const { addRule, clearRule, clearAll } = useActiveRules();
    const processed = useRef<Set<string>>(new Set());

    // Reset processed set on reshuffle
    useEffect(() => {
        processed.current.clear();
        clearAll();
    }, [runId, clearAll]);

    // Process rule cards as they appear
    useEffect(() => {
        if (!activeCard || !activeCard.ruleId) return;
        const isOn = activeCard.kind === 'rule_on';
        const isOff = activeCard.kind === 'rule_off';
        if (!isOn && !isOff) return;
        if (processed.current.has(activeCard.id)) return;
        processed.current.add(activeCard.id);

        if (isOn) {
            addRule({ ruleId: activeCard.ruleId, params: { phase: 'on' } });
        } else {
            clearRule(activeCard.ruleId);
        }
    }, [activeCard, addRule, clearRule]);

    const clearAllRules = useCallback(() => {
        clearAll();
    }, [clearAll]);

    return { clearAllRules };
}
