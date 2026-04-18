// app/bar/layout.tsx
// Providers (GameStoreProvider + ActiveRulesProvider) are in the root layout,
// so bar routes and game routes share the same store instance.
// This ensures barSession set on /bar/[slug] is visible in /game/setup/*.

export default function BarLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
