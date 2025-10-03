// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        // On Vercel this resolves to the commit SHA; locally it falls back to a timestamp.
        NEXT_PUBLIC_BUILD_ID:
            process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()),
    },
};

export default nextConfig;
