export async function trackEvent(type: string, payload: Record<string, unknown> = {}) {
    try {
        await fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload }),
        });
    } catch (err) {
        console.warn('Telemetry failed', err);
    }
}
