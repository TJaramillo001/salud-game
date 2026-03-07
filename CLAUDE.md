# CLAUDE.md — Salud Game

AI assistant reference for the **Salud** codebase. Read this before making any changes.

---


Most recent: claude --resume 1fdf9452-d21e-4a5d-97da-9b55a3cb128c


## Project Overview

**Salud** is a mobile-first social card game targeting 18–25 year olds (Erasmus students, Latin Americans, Spaniards, Italians, English speakers). It runs in the browser as a PWA with no sign-up required. Players gather around one shared device and advance through cards by tapping. The stack is **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**, deployed to Vercel.

- Single-device gameplay (no real-time networking)
- Two active game modes: `pre` (celebration) and `night_out` (party)
- Four languages: Latin American Spanish (`es_la`), Spain Spanish (`es_eu`), Italian (`it`), English (`en`)
- UI strings and card content switch per language; source code and comments in English
- **B2B bar system:** Bars get a QR code (`/bar/<slug>`) that grants players a time-limited premium session with all modes unlocked + bar-specific cards injected into the deck. Analytics tracked to Supabase with weekly email reports to bar owners via Resend.

---

## Commands

```bash
npm run dev      # Development server with Turbopack (http://localhost:3000)
npm run build    # Production build with Turbopack
npm run start    # Start production server
npm run lint     # Run ESLint (eslint.config.mjs)
```

There is no test runner script in `package.json`. Test files exist under `tests/` but no Jest/Vitest config is present — do not assume tests run via `npm test`.

---

## Directory Structure

```
/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Marketing homepage
│   ├── layout.tsx              # Root layout (header + footer)
│   ├── globals.css             # Tailwind imports + design tokens
│   ├── game/
│   │   ├── setup/
│   │   │   ├── language/page.tsx  # Step 1: Pick language
│   │   │   ├── players/page.tsx   # Step 2: Enter player names
│   │   │   └── mode/page.tsx      # Step 3: Pick game mode
│   │   ├── play/page.tsx          # Core gameplay screen
│   │   └── summary/page.tsx       # End-game / replay screen
│   ├── bar/
│   │   ├── layout.tsx             # Bar route layout (providers wrapper)
│   │   └── [slug]/page.tsx        # QR landing page for bar sessions
│   ├── marketing/              # Additional marketing pages
│   └── api/
│       ├── telemetry/route.ts     # Analytics event endpoint
│       └── cron/weekly-bar-report/route.ts  # Weekly bar analytics email (Vercel Cron)
│
├── components/
│   ├── game/                   # Game-specific display components
│   │   ├── QuestionCard.tsx    # Card renderer (supports barBadge prop)
│   │   ├── BarExpiredModal.tsx # Bar session expiry overlay
│   │   ├── ModeTile.tsx        # Mode selection tile
│   │   └── PlayerPill.tsx      # Player chip
│   ├── layout/                 # AppHeader, AppFooter
│   ├── primitives/             # Card, Badge, Modal base components
│   └── ui/                     # Button and other shared UI
│
├── features/                   # Domain logic (no UI)
│   ├── deck/
│   │   ├── useDeck.ts          # Hook: deck loading + navigation
│   │   ├── shuffler.ts         # Fisher-Yates + rule-pair scheduler
│   │   └── antiRepeat.ts       # Prevent card repeats
│   ├── questions/
│   │   ├── types.ts            # Card, Pack, CardKind, TargetRole types
│   │   ├── repository.ts       # Pack loaders (JSON → Pack), getPackByModeAndLanguage()
│   │   ├── normalize.ts        # Card normalization
│   │   ├── filters.ts          # Player-count / spice / gender filters
│   │   └── schemas.ts          # Validation schemas
│   ├── gameplay/
│   │   ├── turn.ts             # Weighted-decay player pick + resolveTargetName
│   │   ├── useGameFlow.ts      # Game flow hook
│   │   └── timers.ts           # Timing utilities
│   ├── languages/
│   │   └── types.ts            # LanguageKey, LangMeta, LANGUAGES, LANGUAGE_STORAGE_KEY
│   ├── modes/
│   │   ├── types.ts            # ModeKey ('pre' | 'night_out'), MODE_STORAGE_KEY
│   │   └── useModes.ts         # Mode management hook
│   ├── players/
│   │   ├── types.ts            # Player, PlayerId, newPlayerId
│   │   └── usePlayers.ts       # Player management hook
│   ├── bars/
│   │   ├── types.ts            # BarSlug, BarConfig, BarSession, validation
│   │   ├── repository.ts       # getBarConfig(), getBarCards(), isValidBarSlug()
│   │   ├── useBarSession.ts    # Hook: bar session state + expiry timer
│   │   └── access.ts           # isModeAccessible(), getModeAccessReason()
│   └── rules/
│       ├── engine.ts           # Rule execution
│       ├── types.ts            # Rule types
│       └── useActiveRules.tsx  # Active rules context/hook
│
├── providers/
│   ├── GameStoreProvider.tsx   # Central context store (reducer pattern)
│   └── ThemeProvider.tsx       # Stub for future theming
│
├── lib/
│   ├── deck.ts                 # Deck building + card resolution
│   ├── prng.ts                 # Mulberry32 PRNG
│   ├── render.ts               # Template renderer ({A}, {B}, {STARTER}) + language fallbacks
│   ├── analytics.ts            # Event tracking helpers
│   ├── barAnalytics.ts         # Bar event tracking (batched → Supabase)
│   ├── supabase.ts             # Supabase client factories (anon + admin)
│   ├── haptics.ts              # Vibration API wrapper
│   ├── offline.ts              # PWA offline deck cache (localStorage)
│   ├── types.ts                # Shared lib types
│   └── i18n/
│       ├── index.ts            # getTranslations(), useTranslation() hook, interpolate()
│       └── translations/
│           ├── es_la.ts        # Latin American Spanish (base/fallback)
│           ├── es_eu.ts        # Spain Spanish
│           ├── it.ts           # Italian
│           └── en.ts           # English
│
├── hooks/
│   ├── useSwipe.ts             # Touch gesture detection
│   └── useHydrated.ts          # SSR hydration guard
│
├── utils/
│   ├── array.ts                # Array helpers
│   ├── strings.ts              # String helpers
│   └── random.ts               # Random selection helpers
│
├── data/
│   ├── packs/                     # Card packs: {mode}_{language}.json
│   │   ├── pre_es_la.json         # 320 cards — Latin American Spanish Pre
│   │   ├── pre_en.json            # 200 cards — English Pre
│   │   ├── pre_it.json            # 200 cards — Italian Pre
│   │   ├── pre_es_eu.json         # 200 cards — Spain Spanish Pre
│   │   ├── night_out_es_la.json   # 100 cards — Latin American Spanish Night Out
│   │   ├── night_out_en.json      # 110 cards — English Night Out
│   │   ├── night_out_it.json      # 115 cards — Italian Night Out
│   │   ├── night_out_es_eu.json   # 100 cards — Spain Spanish Night Out
│   │   ├── couple.json            # Empty (planned)
│   │   ├── afterparty.json        # Empty (planned)
│   │   └── bar.json               # Empty (planned)
│   └── bars/                      # Bar-specific data (static JSON)
│       ├── index.ts               # BAR_REGISTRY barrel export
│       └── pilot/                 # Pilot bar (Salamanca)
│           ├── config.json        # Bar config (name, city, session duration)
│           ├── cards_es_eu.json   # 15 bar cards — Spain Spanish
│           └── cards_es_la.json   # 15 bar cards — Latin American Spanish
│
├── tests/
│   ├── setupTests.ts
│   ├── features/deck_test.ts
│   └── features/rules_test.ts
│
├── scripts/                    # Content validation utilities
├── styles/                     # Global CSS + animation helpers
├── public/                     # PWA manifest, icons, service worker (sw.js)
├── vercel.json                 # Vercel cron schedule config
└── docs/
    ├── MASTER_SOT.md           # Comprehensive product/technical source of truth
    └── supabase-schema.sql     # SQL to create bar_events + bar_owners tables
```

---

## Key Architecture Decisions

### State Management

`GameStoreProvider.tsx` is the single source of truth for runtime game state. It uses `useReducer` with a Context — a Redux-style pattern without any external library.

**State shape (`GameState`):**
```ts
{
  sessionId: string | null;       // crypto-random hex ID per session
  seed: number | null;            // deterministic shuffle seed
  gameOver: boolean;
  players: Player[];              // [{id, name, gender?}]
  seen: string[];                 // card IDs already shown
  selectedMode: ModeKey | null;   // 'pre' | 'night_out'
  selectedLanguage: LanguageKey | null; // 'es_la' | 'es_eu' | 'it' | 'en'
  barSession: BarSession | null;  // active bar session (slug, name, expiresAt, startedAt)
}
```

**Actions:** `SET_MODE`, `SET_PLAYERS`, `SET_LANGUAGE`, `START_NEW_SESSION`, `END_GAME`, `RESET_RUNTIME`, `MARK_SEEN`, `SET_BAR_SESSION`, `CLEAR_BAR_SESSION`

**Persistence:** `selectedMode`, `players`, `selectedLanguage`, and `barSession` are persisted to localStorage. Keys are `MODE_STORAGE_KEY` (from `features/modes/types.ts`), `SALUD_PLAYERS_V1`, `LANGUAGE_STORAGE_KEY` (`'salud:selectedLanguage'`, from `features/languages/types.ts`), and `BAR_SESSION_STORAGE_KEY` (`'salud:barSession'`, from `features/bars/types.ts`). Bar session is validated on hydration — expired sessions are discarded.

Always use the `useGameStore()` hook to read or write game state. Never access localStorage directly for game data.

### Deck & Shuffling

1. Cards are loaded from JSON packs via `features/questions/repository.ts` using `getPackByModeAndLanguage(mode, language)`.
2. If a bar session is active, bar-specific cards are injected via `getBarCards(slug, mode, language)` from `features/bars/repository.ts`. Bar cards have `source: "bar"` and `weight: 1.5`.
3. They are filtered by mode, player count, and spice level (`features/questions/filters.ts`).
4. `shuffleInPlace()` in `features/deck/shuffler.ts` applies a seeded LCG Fisher-Yates shuffle.
5. `scheduleRulePairs()` then enforces the rule lifecycle: `rule_off` cards are removed from their original positions and re-inserted 8–15 cards after their matching `rule_on`.
6. `useDeck` hook manages the current index and exposes `current`, `remaining`, `next`, `deck`.

The **seed** is derived in `app/game/play/page.tsx` from: `mode | player names | runId`, hashed with `cyrb53`. This makes decks reproducible per session while allowing a "reshuffle" by incrementing `runId`.

### Internationalization (i18n)

Custom translation system in `lib/i18n/` — no external library. Four languages supported:

| Key | Label | Audience |
|-----|-------|----------|
| `es_la` | Español (Latino) | Colombian, Mexican, Argentinian/Chilean slang |
| `es_eu` | Español (España) | Salamanca/Erasmus Spain context |
| `it` | Italiano | Italian speakers |
| `en` | English | International/English speakers |

**`useTranslation()` hook** (from `lib/i18n/index.ts`): reads `selectedLanguage` from `useGameStore()`, returns `{ t, T, lang }`.
- `t` — the full translation dictionary object (access via `t.setup.players.title`)
- `T(path, vars?)` — interpolation helper for dynamic values
- `lang` — current `LanguageKey`
- Falls back to `es_la` if no language is set

**Translation files** are TypeScript dictionaries in `lib/i18n/translations/`. The `es_la.ts` file defines the `Translations` type; other files implement the same interface.

**Pack files** follow the `{mode}_{language}.json` naming convention. Language is a property of the pack, not individual cards.

### Card System

**Card types (`CardKind`):** `action`, `question`, `group`, `versus`, `wildcard`, `rule_on`, `rule_off`

**Target roles:** `A`, `B`, `C`, `STARTER` — placeholders resolved at render time by `lib/render.ts` to actual player names from the current `currentPlayerIdx`. `render.ts` accepts an optional `RenderFallbacks` parameter for language-aware fallback names (e.g., "Player A" in English, "Giocatore A" in Italian).

**Card JSON schema:**
```json
{
  "id": "pre-001",
  "mode": "pre",
  "kind": "action",
  "target": { "roles": ["A"], "constraints": { "distinct": true } },
  "text": "{A}, tómate 3 tragos",
  "spice": 1,
  "weight": 1,
  "ruleId": null
}
```

- `spice`: 1–3 (mild → hot). **Never 0** — cards with `spice: 0` fail `validateCard()`.
- `weight`: deck weighting multiplier (bar cards use `1.5` for slightly higher frequency)
- `ruleId`: required for `rule_on` / `rule_off` cards (must match between the pair)
- `source`: optional string — `"bar"` for bar-injected cards (used for badge rendering + analytics)

### Rule Lifecycle

- Drawing a `rule_on` card calls `addRule({ ruleId, params })`.
- The deck builder (`scheduleRulePairs`) automatically schedules the matching `rule_off` card 8–15 cards later.
- Drawing `rule_off` calls `clearRule(ruleId)`.
- If the deck ends with active rules, they are auto-cleared.
- Processed rule card IDs are tracked in a `useRef<Set>` in the play page to prevent double-firing.

### Player Distribution

Player assignment uses a **weighted-decay random** system (not round-robin).

- State in `app/game/play/page.tsx`: `weights: number[]` (one per player, all start at `1`) and `currentPlayerIdx: number`.
- On every card advance, `applyDecay(weights, currentPlayerIdx)` drops the current player's weight to `minWeight=0.1` and redistributes the surplus equally to all others, keeping the total weight sum constant.
- `weightedPickIndex(nextWeights)` then picks the next player probabilistically.
- Both card text placeholders (`{A}`, `{B}`) and the subtitle use `currentPlayerIdx` — they always refer to the same player.
- Weights reset to `1` on reshuffle (`runId` change) or player list change.

Key functions in `features/gameplay/turn.ts`:
- `weightedPickIndex(weights: number[]): number`
- `applyDecay(weights: number[], picked: number, minWeight?: number): number[]`

### Offline / PWA

- `lib/offline.ts` saves the last valid deck to localStorage (`saveLastDeck`) on every successful load.
- If `useDeck` returns an empty deck and the device is offline, the play page falls back to the cached deck (`getLastDeck`).
- The service worker (`public/sw.js`) handles asset caching with cache-busting via `NEXT_PUBLIC_BUILD_ID`.

### Bar Session System (B2B)

Bars get a QR code linking to `/bar/<slug>`. Scanning it opens a landing page that starts a time-limited premium session.

**Flow:** `/bar/pilot` → sets `barSession` in GameStore → redirects to `/game/setup/language` → all modes unlocked → bar cards injected into deck → analytics tracked.

**Key files:**
- `features/bars/types.ts` — `BarConfig`, `BarSession`, `BAR_SESSION_STORAGE_KEY`
- `features/bars/repository.ts` — `getBarConfig()`, `getBarCards()`, `isValidBarSlug()`
- `features/bars/useBarSession.ts` — hook with 60s expiry check timer, returns `{ barSession, isBarActive, timeRemaining, clearBarSession }`
- `features/bars/access.ts` — `isModeAccessible(mode, barSession)` (only `pre` is free without bar session), `getModeAccessReason()`
- `data/bars/index.ts` — `BAR_REGISTRY` mapping slug → config + cards
- `data/bars/<slug>/` — per-bar config.json + cards per language
- `app/bar/[slug]/page.tsx` — QR landing page
- `components/game/BarExpiredModal.tsx` — expiry overlay

**Mode gating:** Without a bar session, only `pre` mode is accessible (free). Bar sessions unlock all modes. Locked modes show a "Premium" badge on the mode selection screen.

**Session expiry:** When a bar session expires mid-game, `BarExpiredModal` appears. If the current mode requires bar access, the user is redirected to mode selection.

**Bar cards:** Stored as static JSON in `data/bars/<slug>/cards_<language>.json`. They use existing modes (`pre`, `night_out`) — not a separate mode. Tagged with `"source": "bar"` and rendered with a beer badge in `QuestionCard`.

### Bar Analytics

Client-side batched event tracking via Supabase with weekly email reports via Resend.

**Event pipeline:** `trackBarEvent()` → in-memory queue → flush every 5s or on `visibilitychange` → `supabase.from('bar_events').insert(batch)`

**Event types:** `session_start`, `card_swipe`, `bar_card_shown`, `mode_selected`, `game_end`

**Key files:**
- `lib/barAnalytics.ts` — `trackBarEvent()`, `flushBarEvents()`, batched queue
- `lib/supabase.ts` — `getSupabaseClient()` (browser/anon), `getSupabaseAdmin()` (server/service role)
- `app/api/cron/weekly-bar-report/route.ts` — Vercel Cron (Sundays 10:00 UTC), aggregates events per bar, sends HTML email via Resend
- `vercel.json` — cron schedule config
- `docs/supabase-schema.sql` — SQL to create `bar_events` and `bar_owners` tables with RLS

**Analytics instrumentation locations:**
- `app/bar/[slug]/page.tsx` — `session_start`
- `app/game/play/page.tsx` — `card_swipe`, `bar_card_shown` (in `onAdvance`)
- `app/game/setup/mode/page.tsx` — `mode_selected`
- `app/game/summary/page.tsx` — `game_end`

Analytics are designed to never break gameplay: silent failures, null checks on Supabase client, batched inserts. If Supabase env vars are not set, all tracking is silently no-op.

---

## Path Aliases

The `@/` alias maps to the repository root (configured in `tsconfig.json`).

```ts
import { useGameStore } from '@/providers/GameStoreProvider';
import type { Card } from '@/features/questions/types';
```

Always use `@/` for cross-directory imports. Avoid relative `../../` paths.

---

## Code Conventions

- **Language:** TypeScript strict mode. Avoid `any`; use proper types from `features/*/types.ts`.
- **Styling:** Tailwind CSS v4 utility classes only. No inline `style={}` props unless absolutely necessary. Dark-first design (background `neutral-950`).
- **Components:** React functional components with hooks. No class components.
- **Client vs Server:** Mark components `'use client'` only when they use browser APIs, hooks, or interactivity. Prefer server components for static content.
- **Classnames:** Use `clsx()` for conditional class merging.
- **Card content:** Card `text` is in the pack's language. Placeholders are `{A}`, `{B}`, `{C}`, `{STARTER}`.
- **IDs:** Card IDs follow the pattern `<mode>-[<lang>-]<three-digit-number>`. Base `es_la` omits the lang infix (e.g., `pre-001`). Other languages include it (e.g., `pre-en-001`, `pre-it-001`, `pre-eu-001`, `night-en-001`).
- **No external state library:** Do not introduce Redux, Zustand, Jotai, etc. Use `GameStoreProvider` and local `useState`/`useReducer`.
- **No test runner config:** Do not add or run test commands unless a test framework is explicitly configured.

---

## Game Flow (User Journey)

**Normal flow:**
```
/                         → Marketing homepage
/game/setup/language      → Pick language (es_la / es_eu / it / en)
/game/setup/players       → Enter player names (stored in GameStore)
/game/setup/mode          → Select mode (pre / night_out — non-bar users only get pre)
/game/play                → Card gameplay loop (tap/swipe to advance)
/game/summary             → End screen with replay CTA
```

**Bar flow (QR scan):**
```
/bar/<slug>               → Bar landing page (start/continue session)
/game/setup/language      → Pick language (bar session persisted)
/game/setup/players       → Enter player names
/game/setup/mode          → All modes unlocked (bar badge shown)
/game/play                → Cards include bar-specific content
/game/summary             → End screen (bar analytics tracked)
```

Navigation is handled with `next/navigation`'s `useRouter`. Guards in each page redirect back if required state is missing:
- `players` → redirects to `/game/setup/language` if no language selected
- `mode` → redirects to `/game/setup/players` if no players set
- `play` → requires both mode and language to load a deck

---

## Adding New Cards

1. Open the appropriate pack file in `data/packs/` (e.g., `pre_es_la.json`). Pack files follow the `{mode}_{language}.json` naming convention.
2. Add a new entry to the cards array following the schema above.
3. Use a unique `id` continuing the sequence (check the last ID in the file). ID format: `<mode>-[<lang>-]<NNN>`.
4. Validate `kind`, `spice` (1–3, **never 0**), and `weight` (typically 1).
5. For `rule_on` / `rule_off` pairs: both must share the same non-null `ruleId` and both must exist in the pack.
6. Card `text` must be in the pack's language.

---

## Adding a New Game Mode

1. Add the new `ModeKey` to `features/modes/types.ts`.
2. Create one pack JSON per language in `data/packs/<mode>_<language>.json` (e.g., `bar_es_la.json`, `bar_en.json`, etc.).
3. Register all new packs in `features/questions/repository.ts` (`PACK_REGISTRY`).
4. Add a `ModeTile` entry in the mode selection page.
5. Add mode labels/descriptions to all translation files in `lib/i18n/translations/` (`t.modes.<key>`).
6. Update card filters in `features/questions/filters.ts` if the mode has unique rules.

## Adding a New Bar

1. Create a directory `data/bars/<slug>/` with:
   - `config.json` — `{ slug, name, city, sessionDurationMs, languages: [...], active: true }`
   - `cards_<language>.json` per supported language — array of cards using existing modes (`pre`, `night_out`), with `"source": "bar"` and `"weight": 1.5`
2. Bar card IDs follow the pattern `bar-<slug>-<lang>-<NNN>` (e.g., `bar-pilot-eu-001`).
3. Import the config and card files in `data/bars/index.ts` and add to `BAR_REGISTRY`.
4. Add a row to the `bar_owners` table in Supabase for weekly email reports.
5. The QR code should point to `https://yourdomain.com/bar/<slug>`.

## Adding a New Language

1. Add the new `LanguageKey` value to `features/languages/types.ts` (type, `LANGUAGES` map, `isLanguageKey()` guard).
2. Create a translation file in `lib/i18n/translations/<key>.ts` implementing the `Translations` type.
3. Import and register it in `lib/i18n/index.ts` (`TRANSLATION_MAP`).
4. Create one pack JSON per active mode in `data/packs/<mode>_<key>.json`.
5. Register new packs in `features/questions/repository.ts` (`PACK_REGISTRY`).
6. The language selection screen (`app/game/setup/language/page.tsx`) auto-renders from `LANGUAGES`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BUILD_ID` | Set automatically at build time (Vercel git SHA or timestamp). Used by the service worker for cache-busting. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for bar analytics). Optional — analytics silently no-op if unset. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side event inserts). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side cron aggregation). |
| `RESEND_API_KEY` | Resend API key (weekly email reports to bar owners). |
| `CRON_SECRET` | Vercel Cron secret for authenticating the weekly report endpoint. |

See `.env.local.example` for a template.

---

## Deployment

The project deploys to **Vercel** automatically on push to the main branch (`master`). The `next.config.ts` injects `NEXT_PUBLIC_BUILD_ID` from the Vercel `VERCEL_GIT_COMMIT_SHA` env var (falls back to `Date.now()` for local builds).

---

## Pending Work

### i18n (from Multilingual Expansion)
- **`app/layout.tsx` — dynamic `lang` attribute:** The `<html lang>` attribute should update based on `selectedLanguage`. This requires making the root layout language-aware (e.g., reading from a cookie/header or making it a client component).
- **`app/page.tsx` — marketing copy translation:** The homepage links were updated to `/game/setup/language`, but the marketing copy text (hero, features, etc.) is still hardcoded in Spanish. It should use `useTranslation()` or a similar approach to render in the visitor's language.

### Bar System (B2B)
- **Supabase setup:** Create a Supabase project and run `docs/supabase-schema.sql` to create `bar_events` + `bar_owners` tables. Add bar owner rows for each pilot bar.
- **Env vars:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` in Vercel.
- **Resend domain:** Configure a sending domain in Resend (the cron sends from `reports@saludgame.com`).
- **Real pilot bars:** Replace the `pilot` test bar in `data/bars/` with real Salamanca bar configs and cards.
- **B2C payment integration:** Freemium gating is in place (only `pre` mode free) but no payment flow exists yet.

### Completed
- ~~`npm run lint` verification~~ — Done. All 7 pre-existing issues fixed, lint is clean (0 errors, 0 warnings).
- ~~Night Out deck parity~~ — Done. `night_out_es_la.json` expanded to 100 cards with 5 rule pairs.

---

## Documentation

- `docs/MASTER_SOT.md` — The authoritative product + technical specification. Read this for full context on game design, card types, rule mechanics, and the MVP roadmap before making significant architectural changes.
- `docs/supabase-schema.sql` — SQL schema for bar analytics tables (`bar_events`, `bar_owners`). Run in Supabase SQL Editor before deploying analytics.
- `docs/ARCHITECTURE.md` — Currently empty; intended for architecture decision records.
- `docs/CONTENT_GUIDE.md` — Currently empty; intended for card content guidelines.
