// app/api/cron/weekly-bar-report/route.ts
// Vercel Cron job — runs every Sunday at 10:00 UTC
// Aggregates bar analytics from the past 7 days and emails each bar owner.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Verify cron secret (Vercel sets Authorization header)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    if (!RESEND_API_KEY) {
        return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
    }

    const resend = new Resend(RESEND_API_KEY);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
        // 1. Get all bar owners
        const { data: owners, error: ownersErr } = await supabase
            .from('bar_owners')
            .select('*')
            .eq('active', true);

        if (ownersErr) throw ownersErr;
        if (!owners || owners.length === 0) {
            return NextResponse.json({ message: 'No active bar owners' });
        }

        // 2. Fetch events for the past week with pagination.
        // Supabase JS defaults to 1000 rows. We paginate to handle high-volume bars.
        const PAGE_SIZE = 5000;
        const MAX_PAGES = 10; // safety cap: 50,000 events max
        let allEvents: Array<{ bar_slug: string; event_type: string }> = [];
        let page = 0;
        let hasMore = true;

        while (hasMore && page < MAX_PAGES) {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error: eventsErr } = await supabase
                .from('bar_events')
                .select('bar_slug, event_type')
                .gte('created_at', weekAgo)
                .range(from, to);

            if (eventsErr) {
                console.error('Error fetching weekly events (page ' + page + '):', eventsErr);
                break;
            }

            if (data && data.length > 0) {
                allEvents = allEvents.concat(data);
            }

            hasMore = (data?.length ?? 0) === PAGE_SIZE;
            page++;
        }

        if (page >= MAX_PAGES) {
            console.warn(`Weekly report: hit ${MAX_PAGES}-page limit (${allEvents.length} events). Some events may be excluded.`);
        }

        // Group events by bar_slug for O(1) lookup per owner
        const eventsByBar = new Map<string, Array<{ bar_slug: string; event_type: string }>>();
        for (const event of allEvents ?? []) {
            const list = eventsByBar.get(event.bar_slug) ?? [];
            list.push(event);
            eventsByBar.set(event.bar_slug, list);
        }

        let emailsSent = 0;

        for (const owner of owners) {
            const events = eventsByBar.get(owner.bar_slug) ?? [];

            const counts = {
                sessions: 0,
                card_swipes: 0,
                bar_cards_shown: 0,
                modes_selected: 0,
                games_ended: 0,
            };

            for (const e of events) {
                switch (e.event_type) {
                    case 'session_start': counts.sessions++; break;
                    case 'card_swipe': counts.card_swipes++; break;
                    case 'bar_card_shown': counts.bar_cards_shown++; break;
                    case 'mode_selected': counts.modes_selected++; break;
                    case 'game_end': counts.games_ended++; break;
                }
            }

            // 3. Build and send email
            const weekEnd = new Date().toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric',
            });
            const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long',
            });

            const html = buildReportEmail({
                barName: owner.bar_name,
                ownerName: owner.owner_name,
                weekStart,
                weekEnd,
                ...counts,
            });

            try {
                await resend.emails.send({
                    from: 'Salud Game <reports@saludgame.com>',
                    to: owner.email,
                    subject: `📊 Resumen semanal — ${owner.bar_name}`,
                    html,
                });
                emailsSent++;
            } catch (emailErr) {
                console.error(`Failed to email ${owner.email}:`, emailErr);
            }
        }

        return NextResponse.json({ message: `Sent ${emailsSent} reports` });
    } catch (err) {
        console.error('Weekly report cron failed:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

interface ReportData {
    barName: string;
    ownerName: string;
    weekStart: string;
    weekEnd: string;
    sessions: number;
    card_swipes: number;
    bar_cards_shown: number;
    modes_selected: number;
    games_ended: number;
}

function buildReportEmail(data: ReportData): string {
    const avgSwipesPerSession = data.sessions > 0
        ? Math.round(data.card_swipes / data.sessions)
        : 0;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#111;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:40px;">🍻</span>
      <h1 style="font-size:22px;font-weight:700;margin:8px 0 4px;">Salud Game</h1>
      <p style="color:#888;font-size:13px;margin:0;">Resumen semanal para ${data.barName}</p>
    </div>

    <p style="font-size:14px;color:#ccc;margin-bottom:20px;">
      Hola ${data.ownerName}, aquí tienes los números de la semana
      <strong>${data.weekStart}</strong> al <strong>${data.weekEnd}</strong>:
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px 8px 0 0;">
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${data.sessions}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Sesiones iniciadas</div>
        </td>
        <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px 8px 0 0;">
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${data.card_swipes}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Cartas jugadas</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#1a1a1a;">
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${data.bar_cards_shown}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Especiales del bar mostradas</div>
        </td>
        <td style="padding:12px 16px;background:#1a1a1a;">
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${avgSwipesPerSession}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Cartas promedio por sesión</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 16px;background:#1a1a1a;border-radius:0 0 8px 8px;">
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${data.games_ended}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">Partidas completadas</div>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#666;text-align:center;">
      Este reporte se genera automáticamente cada domingo.<br>
      ¿Preguntas? Responde a este email.
    </p>
  </div>
</body>
</html>`.trim();
}
