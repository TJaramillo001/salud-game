// app/game/layout.tsx
// Providers (GameStoreProvider + ActiveRulesProvider) are in the root layout.
// This layout adds game-specific metadata, error boundary, and the SW registration script.

import { GameErrorBoundary } from '@/components/ErrorBoundary';

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
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID;

    return (
        <GameErrorBoundary>
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
        </GameErrorBoundary>
    );
}
