# 📘 Salud — Source of Truth (SOT)

*Last updated: 2025‑09‑28*

## 0) TL;DR

* **MVP scope:** two modes only — **Pre** and **Night‑Out**. Mobile‑first, single‑device, swipeable card game. No accounts, no multiplayer.
* **Core loop:** Scan (QR) → Add players → Choose mode → Play (swipe/tap through deck) → End → Play Again.
* **Key mechanic:** **Rule cards** are cards themselves. A rule becomes **active** when drawn, and later a corresponding **repeal** card ends it. Players don’t manually delete rules.
* **Stack:** Next.js 15 + Turbopack, Tailwind, Vercel, optional Supabase for analytics/content.
* **Target:** “Bar‑ready” MVP in 4 weeks at ~30–45 min/day.

---

## 1) Vision & Purpose

**Salud** is a lightweight social catalyst: a fast, fun drinking game for friends before or during a night out. It removes friction (no sign‑ups, no rules reading) and adds momentum to social settings.

* **Audience:** 18–35, Spanish‑first (Colombia focus), friends & couples pre‑gaming or at bars.
* **Promise:** Open, add names, start swiping; the game drives the night’s energy.
* **Non‑goals:** No cross‑device sync, no real‑time chat, no social network hooks. QR invites are okay (single‑device per group), but **not** multi‑device sessions.

---

## 2) Game Overview & Flow

**Loop:** `Scan → Add Players → Select Mode (Pre / Night‑Out) → Cards → End → Replay`

* **Cards:** short prompts/challenges with local flavor; intensity escalates.
* **Navigation:** tap anywhere → next; swipe gesture supported. No back button in MVP (reduces coordination fights).
* **Progress:** simple counter `X / N`, end screen with replay & rating CTA.
* **Replay:** reshuffle from full deck; session‑scoped “seen” set reset.

## 3) Card System

### 3.1 Card Types (MVP)

All cards are **targeted** to one or more players so every turn involves active participation. Cards can be directed at a single player, a pair, or a subgroup (e.g., by gender). Questions exist only when they’re directed to a specific player — no broad, drawn‑out prompts.

1. **Targeted Prompt/Question:** directed at one player, fast response (e.g., reveal something, quick answer).
2. **Action/Dare:** immediate physical or social action between one or more players.
3. **Pair / Versus:** two specific players must compete or interact (e.g., rock‑paper‑scissors loser drinks).
4. **Gender / Attribute‑based:** all of one gender or characteristic perform action (e.g., “all men drink once”).
5. **Group Challenge (with starter):** everyone plays a quick round‑robin challenge; specify a starting player. Must be simple enough to go around quickly. Example: topic chain games.
6. **Rule — Activate:** introduces a temporary rule (persists until its paired repeal card appears).
7. **Rule — Repeal:** explicitly disables a previously introduced rule.
8. **Wildcard:** rare, disruptive events (e.g., “The Drink Wizard casts a spell — everyone take a shot”).
9. **Exclusion (“everyone but one”):** tasks that involve all except a chosen player (e.g., take a picture of Player 1, last one to do it drinks).
10. **Nudge/CTA:** soft commercial or flow nudge (e.g., featured drink).

### 3.2 Rule Cards — Lifecycle & Mechanics

* **Activation:** When a **Rule — Activate** card appears, mark `rules[ruleId] = active` and show badge(s) on HUD.
* **Persistence:** Remains **active** across subsequent cards within the **current session**.
* **Repeal:** A later **Rule — Repeal** card (paired by `ruleId`) sets `rules[ruleId] = inactive` and removes the HUD badge.
* **Reappearance strategy:**

    * Place repeal cards on a schedule/cadence (e.g., appear within the next 8–15 cards) or via weighted random after a **cooldown** to avoid instant cancellation.
    * If deck ends and a rule is still active → auto‑repeal at end screen.
* **UX surfacing:** small sticky HUD with active rule icons + tap for descriptions. Minimal friction.

### 3.3 Content Schema (JSON)

```json
{
  "id": "pre-001",
  "mode": "pre", // or "night_out"
  "kind": "targeted", // targeted | pair | group | gender | rule_on | rule_off | wildcard | exclusion | nudge
  "text": "Jugador 2: imita a un influencer por 10s o bebe.",
  "target": "playerId" | "random" | "pair" | "all_men" | "all_women" | etc.,
  "spice": 1,
  "weight": 1,
  "ruleId": null,
  "meta": { "locale": "es-CO" }
}
```

### 3.4 Samples

* **Targeted Prompt:** *“Jugador 4: confiesa tu peor excusa para cancelar un plan.”*
* **Action/Dare:** *“Jugador 2 y Jugador 5: hagan pulseo, el perdedor bebe 2.”*
* **Pair / Versus:** *“Jugador 1 vs Jugador 3: piedra, papel o tijera. Pierde = trago.”*
* **Gender:** *“Todas las mujeres beben 1.”*
* **Group Challenge:** *“Tema: Países en Europa. Empieza Jugador 3. El que repita o no sepa, bebe 3.”*
* **Exclusion:** *“Tomen una foto a Jugador 1. El último en hacerlo bebe 3.”*
* **Rule — Activate:** *“Nueva regla: no puedes decir nombres propios. Quien falle bebe.”*
* **Rule — Repeal:** *“Regla terminada: puedes decir nombres otra vez.”*
* **Wildcard:** *“El Mago de los Tragos lanza un hechizo: ¡todos toman un shot!”*
* **Nudge/CTA:** *“Perdedor pide una Paloma 🍹.”*

### 3.5 Deck Assembly & Fairness

* Build deck server‑side (or client‑side for MVP) with:

    * Mode filter + venue theming.
    * Deterministic PRNG seeded by `(sessionId || tableId || time bucket)`.
    * **Seen set** per session to avoid repeats; cleared on Replay.
    * Place CTA cards at fixed indices (e.g., 4 and 9) unless deck shorter.
    * When a Rule — Activate is included, schedule its matching Repeal within the remaining window with weighted probability.

---


## 4) Reset & Persistence Rules

* **Session scope:** players, deck seed, seen set, and active rules live only until End/Replay.
* **Play Again:** full reset of seen set and rule state; fresh shuffle with new seed.
* **LocalStorage:** store player names (persist across sessions) and last selected mode; **don’t** persist active rules or seen set.
* **Bug guard:** if a stale seen set ever leaks, force a **sessionId** increment on Replay and rebuild deck.

---

## 5) Technical Foundation

* **Framework:** Next.js 15 (App Router) with Turbopack; TypeScript; ESLint + Prettier.
* **Styling:** Tailwind CSS; motion/light haptics later if needed.
* **Hosting:** Vercel (connected to GitHub main); Preview deploys from PRs optional.
* **Data (optional in MVP):** Supabase (Postgres + edge functions) for event logging and content delivery.
* **PWA:** Manifest + SW to cache shell and last deck (installable; offline last session ok).

---

## 6) Adjusted MVP Development Itinerary (2 modes only)

> Pacing: ~30–45 minutes/day. All days refer to **Pre** and **Night‑Out** only.

### Week 1 — Skeleton & Single‑mode game loop

**Day 1 – Repo + deploy (30m)**
Tasks: `npx create-next-app@latest --ts`; add Tailwind; push to GitHub; connect to Vercel; deploy.
Done: Live URL renders “Hello”.

**Day 2 – Routes & frame (30m)**
Tasks: Create `/[venue]/play` page; stub: “Add players → Start”.
Done: Visiting `/demo/play` shows form.

**Day 3 – Player entry (45m)**
Tasks: Form with add/remove names (2–12). Persist to localStorage.
Done: Refresh keeps names; validation works.

**Day 4 – One mode, static deck (45m)**
Tasks: Hardcode JSON for **Pre** (25 cards). Swipe UI using touch; next on swipe/tap.
Done: You can play through a deck locally.

**Day 5 – Mode selector (30m)**
Tasks: Add **2** mode buttons (Pre, Night‑Out); load separate JSON per mode.
Done: Each mode swaps decks.

**Day 6 – Progress + end screen (30m)**
Tasks: Progress (e.g., “6/25”), simple End screen (Play again / Rate).
Done: Flow feels complete.

**Day 7 – PWA shell (45m)**
Tasks: Add manifest + service worker (Workbox or next‑pwa). Precache shell + last deck.
Done: Lighthouse shows installable PWA; offline last deck works.

### Week 2 — Content, nudges, theming, Supabase

**Day 8 – Content pass 1 (45m)**
Tasks: Write **10 cards/mode** (→ **20 total**). Keep short; tag `spice`.
Done: Real content replaces placeholders.

**Day 9 – Nudges (30m)**
Tasks: Insert CTA cards at positions 4 and 9 (“Perdedor pide Paloma 🍹”). Parameterize featured drink.
Done: Nudges show deterministically.

**Day 10 – Venue theming (30m)**
Tasks: Read venue slug from URL; theme (color, featured drink) via local config map.
Done: `/demo/play` is teal; `/rockhouse/play` is red.

**Day 11 – Supabase project (45m)**
Tasks: Create Supabase; set env vars in Vercel; create tables `venues, modes, cards, sessions, events`.
Done: DB reachable local + Vercel.

**Day 12 – Event logging (45m)**
Tasks: Next.js API `POST /api/track` → insert `scan, session_start, card_shown, session_end`.
Done: Cards emit `card_shown` (throttled ≤ 1/sec).

**Day 13 – Content to DB (45m)**
Tasks: Seed script to upsert **modes + cards** from JSON.
Done: Frontend fetches deck from `/api/cards?mode=pre&venue=demo` (server selects/shuffles with rule scheduling).

**Day 14 – Mini analytics view (30m)**
Tasks: Protected `/ops` page listing yesterday’s counts by venue (sessions, median cards/session).
Done: You can show a bar owner something real.

### Week 3 — QR, signing, polish, pilot

**Day 15 – QR signature (30m)**
Tasks: Node script generates `https://play.yourbrand.co/{venue}/play?t={tableId}&s={sig}` with HMAC(secret).
Done: `/api/validate-qr` checks sig; logs `scan`.

**Day 16 – Sticker CTA + design (45m)**
Tasks: Two sticker variants (“Scan to Play • Drinking Games 🎉”; “Ready for Round 2? Scan”). Export print‑ready PDF.
Done: You can print a small batch.

**Day 17 – Performance (30m)**
Tasks: Lazy‑load font; trim bundle; test on mid Android. Goal TTI < 2.5s.
Done: Lighthouse ≥ 90 perf.

**Day 18 – Content pass 2 (45m)**
Tasks: Add **+15 cards/mode** (→ **25/mode**). Escalation light → spicy.
Done: **50 prompts total**.

**Day 19 – QA matrix (30m)**
Tasks: Test iPhone Safari + Android Chrome; fix tap targets; dark bar contrast.
Done: No obvious jank; 60fps swipes.

**Day 20 – Pilot prep (45m)**
Tasks: Provision `venue=rockhouse` theme + 3 custom cards; generate 20 QR links (tables 1–20).
Done: Ready to place stickers in one venue.

### Week 4 — Pilot, measure, iterate, close v1.0

**Day 21 – Pilot night (30m)**
Tasks: Install stickers at 5–10 tables. Verify scans while on site (`/ops`).
Done: ≥ 20 scans first evening is nice.

**Day 22 – Debrief + quick fixes (45m)**
Tasks: Tweak card order; fix any crash; reduce repeated feel via “seen” set per **session**.
Done: Better session length.

**Day 23 – Weekly email (30m)**
Tasks: CRON (Vercel scheduled function) to email owner: scans, sessions, median cards, top CTA exposure.
Done: Autopilot reporting.

**Day 24 – Pricing toggle (30m)**
Tasks: `venues.plan` (Starter/Standard) gating #custom cards or modes (future: more modes beyond MVP).
Done: You can upsell.

**Day 25 – Admin guardrails (45m)**
Tasks: Basic auth on `/ops`; rate‑limit `/api/track`; cap event size; error logging.
Done: Safer in the wild.

**Day 26 – Content pass 3 (45m)**
Tasks: Add **+5 cards/mode** (→ **30 each**). Mark a few “spicy” for future NSFW pack.
Done: **60 prompts total**.

**Day 27 – Second venue setup (30m)**
Tasks: Add `venue=speakeasy` theme + 3 custom cards; generate QR.
Done: Multi‑venue confirmed.

**Day 28 – v1.0 cut (45m)**
Tasks: Tag release, rotate secrets, backup DB, write 1‑pager pilot summary.
Done: “Bar‑ready” MVP.

---

## 7) Data Model (if Supabase used)

* **venues** `(id, slug, name, theme_color, featured_drink, plan)`
* **modes** `(id, key: pre|night_out, name, active)`
* **cards** `(id, mode_key, kind, text, target, spice, weight, rule_id, locale)`
* **sessions** `(id, venue_slug, mode_key, seed, created_at)`
* **events** `(id, session_id, type, payload, created_at)` where `type ∈ { scan, session_start, card_shown, rule_on, rule_off, session_end }`

**Notes:**

* Deck assembly endpoint should pair `rule_on` with a scheduled `rule_off` candidate window.
* Throttle `card_shown` events to ≤1/s.

---

## 8) Product & Content Guidelines

* **Tone:** playful, quick, Colombian flavor; avoid niche slang that doesn’t travel.
* **Length:** cards ≤ 120 chars ideal; readable in dim light.
* **Escalation:** early cards light; by 70% through deck, medium spice; near end, spicy but optional.
* **Safety:** allow “skip without penalty” for edge cases; avoid coercive content.

---

## 9) Non‑Goals & Future Bets

* **Won’t do:** multi‑device synchronization, online lobbies, real‑time chat, social graph.
* **Might add later:** additional modes (Couple, Afterparty, Hot & Sexy), custom user decks, paid packs.
* **QR invites (outside bars):** Allowed. Links open the same single‑device flow; no shared session state.

---

## 10) Acceptance Criteria (MVP)

* Load `/demo/play`, add 2–12 players, choose Pre or Night‑Out, play 25‑card deck end‑to‑end with at least one rule lifecycle (on→off) demonstrated in >50% of sessions.
* Replay fully resets deck, seen set, and rule state; no ghost “game over” on second run.
* PWA installable; last deck playable offline; Lighthouse PWA + Performance ≥ 90 on mid Android.
* `/ops` shows last‑day metrics; QR scan events record with valid signature.

---

## 11) Project Structure (tracked)

```
salud/
├─ .github/
├─ .idea/
├─ .next/                     # build output (ignored)
├─ app/                       # Next.js App Router
│  ├─ api/
│  │  └─ telemetry/
│  │     └─ route.ts         # POST /api/telemetry
│  ├─ game/
│  │  ├─ play/
│  │  │  ├─ components/
│  │  │  │  ├─ DeckHUD.tsx
│  │  │  │  └─ SwipeController.tsx
│  │  │  └─ page.tsx         # /game/play
│  │  ├─ setup/
│  │  │  ├─ mode/
│  │  │  │  └─ page.tsx      # /game/setup/mode
│  │  │  └─ players/
│  │  │     ├─ page.tsx      # /game/setup/players
│  │  │  └─ page.tsx      # setup page
│  │  └─ summary/
│  │     ├─ layout.tsx
│  │     └─ page.tsx         # /game/summary
│  ├─ marketing/
│  │  └─ page.tsx            # /marketing landing
│  ├─ globals.css
│  ├─ layout.tsx             # root layout
│  └─ page.tsx               # index
├─ components/
│  ├─ game/
│  │  ├─ ModeTile.tsx
│  │  ├─ PlayerPill.tsx
│  │  └─ QuestionCard.tsx
│  ├─ layout/
│  │  ├─ AppFooter.tsx
│  │  └─ AppHeader.tsx
│  ├─ primitives/
│  │  ├─ Badge.tsx
│  │  ├─ Card.tsx
│  │  └─ Modal.tsx
│  └─ ui/
│     └─ Button.tsx
├─ data/
│  ├─ packs/
│  │  ├─ afterparty.json
│  │  ├─ bar.json
│  │  ├─ couple.json
│  │  ├─ night_out.json
│  │  └─ pre.json
│  └─ index.ts               # export pack metadata/loaders
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ CONTENT_GUIDE.md
│  └─ MASTER_SOT.md
├─ features/
│  ├─ deck/
│  │  ├─ antiRepeat.ts
│  │  ├─ shuffler.ts
│  │  └─ useDeck.ts
│  ├─ gameplay/
│  │  ├─ timers.ts
│  │  └─ turn.ts
│  │  └─ useGameFlow.ts
│  ├─ modes/
│  │  ├─ types.ts
│  │  └─ useModes.ts
│  ├─ players/
│  │  ├─ types.ts
│  │  └─ usePlayers.ts
│  ├─ questions/
│  │  ├─ filters.ts
│  │  ├─ normalize.ts
│  │  ├─ repository.ts
│  │  ├─ schemas.ts
│  │  └─ types.ts
│  └─ rules/
│     ├─ engine.ts
│     ├─ types.ts
│     └─ useActiveRules.tsx
├─ hooks/
│  ├─ useHydrated.ts
│  └─ useSwipe.ts
├─ lib/
│  ├─ analytics.ts
│  ├─ deck.ts
│  ├─ haptics.ts
│  ├─ prng.ts
│  ├─ render.ts
│  └─ types.ts
├─ providers/
│  ├─ GameStoreProvider.tsx
│  └─ ThemeProvider.tsx
├─ public/
│  ├─ favicon.ico
│  ├─ images/
│  └─ icons/demo/
│     ├─ file.svg
│     ├─ globe.svg
│     ├─ next.svg
│     ├─ vercel.svg
│     └─ window.svg
├─ scripts/
│  └─ validate-content.ts
├─ styles/
│  └─ animation.css
├─ tests/
│  ├─ components/            # (add component tests here)
│  └─ features/
│     ├─ deck_test.ts
│     ├─ rules_test.ts
│     └─ setupTests.ts
├─ utils/
│  ├─ array.ts
│  ├─ random.ts
│  └─ strings.ts
├─ .eslintrc.cjs
├─ .prettierrc
├─ eslint.config.mjs
├─ next.config.ts
├─ next-env.d.ts
├─ package.json
├─ package-lock.json
├─ postcss.config.mjs
├─ README.md
└─ tsconfig.json

```

---

## 12) Open Questions / Decision Log

* **Rule scheduling strategy:** start with fixed window (e.g., repeal within next 8–15 cards), revisit based on playtest.
* **Offline behavior:** if API down, fallback to local `data/*.json` decks and local rule pairing.
* **Nudge ethics:** keep CTAs friendly; avoid paywalls or bait‑and‑switch.

---

## 13) How to Contribute / Update this SOT

* Treat this as the **single source of truth**. When a decision is made, update here.
* If sections get long, split into `/docs/*` and link from this file.
