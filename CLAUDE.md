# CLAUDE.md — Salud Game

AI assistant reference for the **Salud** codebase. Read this before making any changes.

---

## Project Overview

**Salud** is a mobile-first social card game for Spanish-speaking audiences (Colombia-focused). It runs in the browser as a PWA with no sign-up required. Players gather around one shared device and advance through cards by tapping. The stack is **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**, deployed to Vercel.

- Single-device gameplay (no real-time networking)
- Two active game modes: `pre` (celebration) and `night_out` (party)
- All UI text in Spanish; source code and comments in English

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
│   │   │   ├── players/page.tsx   # Step 1: Enter player names
│   │   │   └── mode/page.tsx      # Step 2: Pick game mode
│   │   ├── play/page.tsx          # Core gameplay screen
│   │   └── summary/page.tsx       # End-game / replay screen
│   ├── marketing/              # Additional marketing pages
│   └── api/telemetry/route.ts  # Analytics event endpoint
│
├── components/
│   ├── game/                   # Game-specific display components
│   │   ├── QuestionCard.tsx    # Card renderer
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
│   │   ├── repository.ts       # Pack loaders (JSON → Pack)
│   │   ├── normalize.ts        # Card normalization
│   │   ├── filters.ts          # Player-count / spice / gender filters
│   │   └── schemas.ts          # Validation schemas
│   ├── gameplay/
│   │   ├── turn.ts             # Turn index + resolveTargetName
│   │   ├── useGameFlow.ts      # Game flow hook
│   │   └── timers.ts           # Timing utilities
│   ├── modes/
│   │   ├── types.ts            # ModeKey ('pre' | 'night_out'), MODE_STORAGE_KEY
│   │   └── useModes.ts         # Mode management hook
│   ├── players/
│   │   ├── types.ts            # Player, PlayerId, newPlayerId
│   │   └── usePlayers.ts       # Player management hook
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
│   ├── render.ts               # Template renderer ({A}, {B}, {STARTER})
│   ├── analytics.ts            # Event tracking helpers
│   ├── haptics.ts              # Vibration API wrapper
│   ├── offline.ts              # PWA offline deck cache (localStorage)
│   └── types.ts                # Shared lib types
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
├── data/packs/
│   ├── pre.json                # ~200+ cards for Pre mode
│   ├── night_out.json          # Night Out mode cards
│   ├── couple.json             # Empty (planned)
│   ├── afterparty.json         # Empty (planned)
│   └── bar.json                # Empty (planned)
│
├── tests/
│   ├── setupTests.ts
│   ├── features/deck_test.ts
│   └── features/rules_test.ts
│
├── scripts/                    # Content validation utilities
├── styles/                     # Global CSS + animation helpers
├── public/                     # PWA manifest, icons, service worker (sw.js)
└── docs/
    └── MASTER_SOT.md           # Comprehensive product/technical source of truth
```

---

## Key Architecture Decisions

### State Management

`GameStoreProvider.tsx` is the single source of truth for runtime game state. It uses `useReducer` with a Context — a Redux-style pattern without any external library.

**State shape (`GameState`):**
```ts
{
  sessionId: string | null;   // crypto-random hex ID per session
  seed: number | null;        // deterministic shuffle seed
  gameOver: boolean;
  players: Player[];          // [{id, name, gender?}]
  seen: string[];             // card IDs already shown
  selectedMode: ModeKey | null; // 'pre' | 'night_out'
}
```

**Actions:** `SET_MODE`, `SET_PLAYERS`, `START_NEW_SESSION`, `END_GAME`, `RESET_RUNTIME`, `MARK_SEEN`

**Persistence:** `selectedMode` and `players` are persisted to localStorage. Keys are `MODE_STORAGE_KEY` (from `features/modes/types.ts`) and `SALUD_PLAYERS_V1`.

Always use the `useGameStore()` hook to read or write game state. Never access localStorage directly for game data.

### Deck & Shuffling

1. Cards are loaded from JSON packs via `features/questions/repository.ts`.
2. They are filtered by mode, player count, and spice level (`features/questions/filters.ts`).
3. `shuffleInPlace()` in `features/deck/shuffler.ts` applies a seeded LCG Fisher-Yates shuffle.
4. `scheduleRulePairs()` then enforces the rule lifecycle: `rule_off` cards are removed from their original positions and re-inserted 8–15 cards after their matching `rule_on`.
5. `useDeck` hook manages the current index and exposes `current`, `remaining`, `next`, `deck`.

The **seed** is derived in `app/game/play/page.tsx` from: `mode | player names | runId`, hashed with `cyrb53`. This makes decks reproducible per session while allowing a "reshuffle" by incrementing `runId`.

### Card System

**Card types (`CardKind`):** `action`, `question`, `group`, `versus`, `wildcard`, `rule_on`, `rule_off`

**Target roles:** `A`, `B`, `C`, `STARTER` — placeholders resolved at render time by `lib/render.ts` to actual player names from the current `turnIndex`.

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

- `spice`: 1–3 (mild → hot)
- `weight`: deck weighting multiplier
- `ruleId`: required for `rule_on` / `rule_off` cards (must match between the pair)

### Rule Lifecycle

- Drawing a `rule_on` card calls `addRule({ ruleId, params })`.
- The deck builder (`scheduleRulePairs`) automatically schedules the matching `rule_off` card 8–15 cards later.
- Drawing `rule_off` calls `clearRule(ruleId)`.
- If the deck ends with active rules, they are auto-cleared.
- Processed rule card IDs are tracked in a `useRef<Set>` in the play page to prevent double-firing.

### Offline / PWA

- `lib/offline.ts` saves the last valid deck to localStorage (`saveLastDeck`) on every successful load.
- If `useDeck` returns an empty deck and the device is offline, the play page falls back to the cached deck (`getLastDeck`).
- The service worker (`public/sw.js`) handles asset caching with cache-busting via `NEXT_PUBLIC_BUILD_ID`.

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
- **Card content:** All card `text` values are in Spanish. Placeholders are `{A}`, `{B}`, `{C}`, `{STARTER}`.
- **IDs:** Card IDs follow the pattern `<mode>-<three-digit-number>` (e.g., `pre-001`).
- **No external state library:** Do not introduce Redux, Zustand, Jotai, etc. Use `GameStoreProvider` and local `useState`/`useReducer`.
- **No test runner config:** Do not add or run test commands unless a test framework is explicitly configured.

---

## Game Flow (User Journey)

```
/                         → Marketing homepage
/game/setup/players       → Enter player names (stored in GameStore)
/game/setup/mode          → Select mode (pre / night_out)
/game/play                → Card gameplay loop (tap/swipe to advance)
/game/summary             → End screen with replay CTA
```

Navigation is handled with `next/navigation`'s `useRouter`. Guards in each page redirect back if required state (mode, players) is missing.

---

## Adding New Cards

1. Open the appropriate pack file in `data/packs/` (e.g., `pre.json`).
2. Add a new entry to the `cards` array following the schema above.
3. Use a unique `id` continuing the sequence (check the last ID in the file).
4. Validate `kind`, `spice` (1–3), and `weight` (typically 1).
5. For `rule_on` / `rule_off` pairs: both must share the same non-null `ruleId` and both must exist in the pack.
6. All `text` in Spanish.

---

## Adding a New Game Mode

1. Add the new `ModeKey` to `features/modes/types.ts`.
2. Create a new pack JSON in `data/packs/<mode>.json`.
3. Register the pack in `features/questions/repository.ts`.
4. Add a `ModeTile` entry in the mode selection page.
5. Update card filters in `features/questions/filters.ts` if the mode has unique rules.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BUILD_ID` | Set automatically at build time (Vercel git SHA or timestamp). Used by the service worker for cache-busting. |

---

## Deployment

The project deploys to **Vercel** automatically on push to the main branch (`master`). The `next.config.ts` injects `NEXT_PUBLIC_BUILD_ID` from the Vercel `VERCEL_GIT_COMMIT_SHA` env var (falls back to `Date.now()` for local builds).

---

## Documentation

- `docs/MASTER_SOT.md` — The authoritative product + technical specification. Read this for full context on game design, card types, rule mechanics, and the MVP roadmap before making significant architectural changes.
- `docs/ARCHITECTURE.md` — Currently empty; intended for architecture decision records.
- `docs/CONTENT_GUIDE.md` — Currently empty; intended for card content guidelines.
