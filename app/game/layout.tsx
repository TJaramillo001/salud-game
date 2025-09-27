export const dynamic = 'force-dynamic';
import { GameStoreProvider } from '@/providers/GameStoreProvider';
import { ActiveRulesProvider } from '@/features/rules/useActiveRules';

export default function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <GameStoreProvider>
            <ActiveRulesProvider>{children}</ActiveRulesProvider>
        </GameStoreProvider>
    );
}
