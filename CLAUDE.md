# CLAUDE.md — Salud Game

AI assistant reference for the **Salud** codebase. Read this before making any changes.

---

## Project Overview

**Salud** is a mobile-first social card game targeting 18–25 year olds (Erasmus students, Latin Americans, Spaniards, Italians, English speakers). It runs in the browser as a PWA with no sign-up required. Players gather around one shared device and advance through cards by tapping. The stack is **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**, deployed to Vercel.

- Single-device gameplay (no real-time networking)
- Two active game modes: `pre` (celebration) and `night_out` (party)
- Four languages: Latin American Spanish (`es_la`), Spain Spanish (`es_eu`), Italian (`it`), English (`en`)
- UI strings and card content switch per language; source code and comments in English

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
├── data/packs/                    # Card packs: {mode}_{language}.json
│   ├── pre_es_la.json             # 274 cards — Latin American Spanish Pre
│   ├── pre_en.json                # 200 cards — English Pre
│   ├── pre_it.json                # 200 cards — Italian Pre
│   ├── pre_es_eu.json             # 200 cards — Spain Spanish Pre
│   ├── night_out_es_la.json       # 25 cards — Latin American Spanish Night Out
│   ├── night_out_en.json          # 110 cards — English Night Out
│   ├── night_out_it.json          # 115 cards — Italian Night Out
│   ├── night_out_es_eu.json       # 100 cards — Spain Spanish Night Out
│   ├── couple.json                # Empty (planned)
│   ├── afterparty.json            # Empty (planned)
│   └── bar.json                   # Empty (planned)
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
  sessionId: string | null;       // crypto-random hex ID per session
  seed: number | null;            // deterministic shuffle seed
  gameOver: boolean;
  players: Player[];              // [{id, name, gender?}]
  seen: string[];                 // card IDs already shown
  selectedMode: ModeKey | null;   // 'pre' | 'night_out'
  selectedLanguage: LanguageKey | null; // 'es_la' | 'es_eu' | 'it' | 'en'
}
```

**Actions:** `SET_MODE`, `SET_PLAYERS`, `SET_LANGUAGE`, `START_NEW_SESSION`, `END_GAME`, `RESET_RUNTIME`, `MARK_SEEN`

**Persistence:** `selectedMode`, `players`, and `selectedLanguage` are persisted to localStorage. Keys are `MODE_STORAGE_KEY` (from `features/modes/types.ts`), `SALUD_PLAYERS_V1`, and `LANGUAGE_STORAGE_KEY` (`'salud:selectedLanguage'`, from `features/languages/types.ts`).

Always use the `useGameStore()` hook to read or write game state. Never access localStorage directly for game data.

### Deck & Shuffling

1. Cards are loaded from JSON packs via `features/questions/repository.ts` using `getPackByModeAndLanguage(mode, language)`.
2. They are filtered by mode, player count, and spice level (`features/questions/filters.ts`).
3. `shuffleInPlace()` in `features/deck/shuffler.ts` applies a seeded LCG Fisher-Yates shuffle.
4. `scheduleRulePairs()` then enforces the rule lifecycle: `rule_off` cards are removed from their original positions and re-inserted 8–15 cards after their matching `rule_on`.
5. `useDeck` hook manages the current index and exposes `current`, `remaining`, `next`, `deck`.

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
- `weight`: deck weighting multiplier
- `ruleId`: required for `rule_on` / `rule_off` cards (must match between the pair)

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

```
/                         → Marketing homepage
/game/setup/language      → Pick language (es_la / es_eu / it / en)
/game/setup/players       → Enter player names (stored in GameStore)
/game/setup/mode          → Select mode (pre / night_out)
/game/play                → Card gameplay loop (tap/swipe to advance)
/game/summary             → End screen with replay CTA
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

---

## Deployment

The project deploys to **Vercel** automatically on push to the main branch (`master`). The `next.config.ts` injects `NEXT_PUBLIC_BUILD_ID` from the Vercel `VERCEL_GIT_COMMIT_SHA` env var (falls back to `Date.now()` for local builds).

---

## Pending Work (from Multilingual Expansion plan)

The i18n infrastructure and card content are complete. The following items from the original plan remain:

- **`app/layout.tsx` — dynamic `lang` attribute:** The `<html lang>` attribute should update based on `selectedLanguage`. This requires making the root layout language-aware (e.g., reading from a cookie/header or making it a client component).
- **`app/page.tsx` — marketing copy translation:** The homepage links were updated to `/game/setup/language`, but the marketing copy text (hero, features, etc.) is still hardcoded in Spanish. It should use `useTranslation()` or a similar approach to render in the visitor's language.
- **`npm run lint` verification:** Lint has not been run since the multilingual changes. Run `npm run lint` and fix any issues.
- **Night Out deck parity:** The `night_out_es_la.json` pack only has 25 cards while the other languages have 100–115. It should be expanded to match.

---

## Documentation

- `docs/MASTER_SOT.md` — The authoritative product + technical specification. Read this for full context on game design, card types, rule mechanics, and the MVP roadmap before making significant architectural changes.
- `docs/ARCHITECTURE.md` — Currently empty; intended for architecture decision records.
- `docs/CONTENT_GUIDE.md` — Currently empty; intended for card content guidelines.
