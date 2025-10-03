// app/layout.tsx
export const dynamic = 'force-dynamic';

import { GameStoreProvider } from '@/providers/GameStoreProvider';
import { ActiveRulesProvider } from '@/features/rules/useActiveRules';

export const metadata = {
    title: 'Salud',
    description: 'Party card game — offline-ready.',
    themeColor: '#0f172a',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/icons/icon-192.png', sizes: '192x192' },
            { url: '/icons/icon-512.png', sizes: '512x512' },
        ],
        apple: [
            { url: '/icons/icon-192.png', sizes: '192x192' },
            { url: '/icons/icon-512.png', sizes: '512x512' },
        ],
        other: [{ rel: 'maskable', url: '/icons/icon-512-maskable.png' }],
    },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
    // Inject the build id at render-time so the client script can use it.
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID;

    return (
        <GameStoreProvider>
            <ActiveRulesProvider>
                {children}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
            (function(){
              if ('serviceWorker' in navigator) {
                var buildId = ${JSON.stringify(buildId)};
                var url = '/sw.js' + (buildId ? ('?build=' + encodeURIComponent(buildId)) : '');
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register(url).catch(function(e){console.debug('SW register failed', e);});
                });
              }
            })();`,
                    }}
                />
            </ActiveRulesProvider>
        </GameStoreProvider>
    );
}
