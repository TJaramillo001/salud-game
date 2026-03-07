// app/bar/layout.tsx
import { GameStoreProvider } from '@/providers/GameStoreProvider';
import { ActiveRulesProvider } from '@/features/rules/useActiveRules';

export default function BarLayout({ children }: { children: React.ReactNode }) {
    return (
        <GameStoreProvider>
            <ActiveRulesProvider>
                {children}
            </ActiveRulesProvider>
        </GameStoreProvider>
    );
}
