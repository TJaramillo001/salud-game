'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type ActiveRule = { ruleId: string; params?: Record<string, any> };

const RulesCtx = createContext<{
    rules: ActiveRule[];
    addRule: (r: ActiveRule) => void;
    clearRule: (ruleId: string) => void;
    isActive: (ruleId: string) => boolean;
} | null>(null);

export function ActiveRulesProvider({ children }: { children: ReactNode }) {
    const [rules, setRules] = useState<ActiveRule[]>([]);
    const addRule = (r: ActiveRule) =>
        setRules(prev => (prev.some(x => x.ruleId === r.ruleId) ? prev : [...prev, r]));
    const clearRule = (ruleId: string) => setRules(prev => prev.filter(r => r.ruleId !== ruleId));
    const isActive = (ruleId: string) => rules.some(r => r.ruleId === ruleId);

    return (
        <RulesCtx.Provider value={{ rules, addRule, clearRule, isActive }}>
    {children}
    </RulesCtx.Provider>
);
}

export function useActiveRules() {
    const ctx = useContext(RulesCtx);
    if (!ctx) throw new Error('useActiveRules must be used within ActiveRulesProvider');
    return ctx;
}
