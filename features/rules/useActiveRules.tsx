// features/rules/useActiveRules.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type ActiveRule = { ruleId: string; params?: Record<string, any> };

const RulesCtx = createContext<{
    rules: ActiveRule[];
    addRule: (r: ActiveRule) => void;
    clearRule: (ruleId: string) => void;
    clearAll: () => void;
    isActive: (ruleId: string) => boolean;
} | null>(null);

export function ActiveRulesProvider({ children }: { children: ReactNode }) {
    const [rules, setRules] = useState<ActiveRule[]>([]);

    const addRule = useCallback((r: ActiveRule) => {
        setRules((prev) => (prev.some((x) => x.ruleId === r.ruleId) ? prev : [...prev, r]));
    }, []);

    const clearRule = useCallback((ruleId: string) => {
        setRules((prev) => prev.filter((r) => r.ruleId !== ruleId));
    }, []);

    const clearAll = useCallback(() => {
        setRules([]);
    }, []);

    // keep function identity stable; it reads latest rules internally
    const isActive = useCallback(
        (ruleId: string) => rules.some((r) => r.ruleId === ruleId),
        [rules]
    );

    const value = useMemo(
        () => ({ rules, addRule, clearRule, clearAll, isActive }),
        [rules, addRule, clearRule, clearAll, isActive]
    );

    return <RulesCtx.Provider value={value}>{children}</RulesCtx.Provider>;
}

export function useActiveRules() {
    const ctx = useContext(RulesCtx);
    if (!ctx) throw new Error('useActiveRules must be used within ActiveRulesProvider');
    return ctx;
}

