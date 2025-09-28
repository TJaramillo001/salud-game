// app/api/telemetry/route.ts

// Optional: simple CORS helper (useful if you ever call this from the client)
function cors(res: Response) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
}

// Handle preflight (if the browser sends it)
export function OPTIONS() {
    return cors(new Response(null, { status: 204 }));
}

// Minimal POST handler — accept JSON, do nothing, return 204
export async function POST(req: Request) {
    try {
        // Consume body so Node/Edge doesn’t complain; ignore the contents for now
        await req.json().catch(() => null);
    } catch {
        // ignore
    }
    return cors(new Response(null, { status: 204 }));
}
