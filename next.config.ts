// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        // On Vercel this resolves to the commit SHA; locally it falls back to a timestamp.
        NEXT_PUBLIC_BUILD_ID:
            process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()),
    },
    async headers() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline'",
                            `connect-src 'self' ${supabaseUrl}`,
                            "img-src 'self' data:",
                            "font-src 'self'",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
