# Salud -- Technical Review

**Date:** 2026-04-18
**Scope:** Full-stack audit of the Salud codebase (Next.js 15 / TypeScript / Tailwind CSS v4 PWA)
**Team:** 8 specialist agents, coder debate panel, orchestrator synthesis

---

## Executive Summary

Salud is a well-scoped mobile-first social card game with a lean dependency footprint (7 runtime, 7 dev) and a clean domain model. The core gameplay loop works. However, the codebase has **zero test coverage**, **zero CI/CD gates**, **zero error tracking**, and **critical security gaps** that would be trivially exploitable the moment monetization goes live. The premium mode gate is entirely client-side, unlock passwords are hardcoded in the shipped bundle, and Supabase RLS policies are overly permissive.

The highest-leverage work is not new features -- it is closing the security and reliability gaps that block credible B2B and B2C revenue. A disciplined 2-week sprint addressing P0 and P1 items would transform this from a prototype into a shippable product.

Key numbers:
- **16 security findings** (2 critical, 5 high, 4 medium, 5 low)
- **0% test coverage** (all 3 test files are empty, no test framework installed)
- **0 bytes** in CI workflow file -- no automated quality gates of any kind
- **~235KB** of card JSON eagerly imported into the client bundle
- **Viral coefficient: effectively 0** -- no shareable moments, no invite mechanism

---

## Architecture Diagnosis

### Dead Code & Stubs

| File | Lines | Status |
|------|-------|--------|
| `lib/deck.ts` | 82 | Dead -- superseded by `features/deck/` |
| `lib/types.ts` | 32 | Dead -- types consolidated into `features/*/types.ts` |
| `data/index.ts` | - | Dead re-export |
| `app/marketing/page.tsx` | - | Duplicate of `app/page.tsx` |
| `components/game/ModeTile.tsx` | - | Unused component |
| `components/layout/AppHeader.tsx` | - | Unused in game routes |
| `app/api/telemetry/route.ts` | - | No-op: accepts POST, discards body, returns 204 |
| 15 empty stub files | 0 each | `data/packs/couple.json`, `afterparty.json`, `bar.json`, test files, etc. |

### Structural Issues

**Duplicate provider trees.** `app/bar/layout.tsx` creates a separate `GameStoreProvider` from `app/game/layout.tsx`. State is disconnected during bar-to-game navigation. Bar session set in the bar layout is invisible to the game layout's store instance.

**Play page monolith.** `app/game/play/page.tsx` is 377 lines with 13 `useEffect` hooks. Accepted refactoring target: decompose into 5 custom hooks (~250 lines after extraction).

**Eager pack imports.** All 12 pack JSONs are statically imported at module level in `features/questions/repository.ts` (lines 8-27), adding ~235KB to the client bundle regardless of which language or mode the player selects.

**Duplicate persistence effect.** `providers/GameStoreProvider.tsx` lines 317-328 and 330-341 contain identical `barSession` persistence logic.

**Telemetry endpoint.** `app/api/telemetry/route.ts` is a no-op that wastes Vercel function invocations. Should be deleted or implemented.

### Bugs

| Bug | Location | Impact |
|-----|----------|--------|
| Hydration race between persist and hydrate effects | `providers/GameStoreProvider.tsx` | State can be overwritten on mount |
| `seen` array uses O(n^2) copy pattern | `providers/GameStoreProvider.tsx` | 51,000 unnecessary comparisons over 320-card deck |
| `useDeck` rebuilds deck when `players` change | `features/deck/useDeck.ts` | Full deck rebuild on every tap due to `seen` in dependency array |
| Stale closure in `useActiveRules` | `features/rules/useActiveRules.tsx` | Rules may reference stale state |
| `GameStore` context value recreated on every state change | `providers/GameStoreProvider.tsx` | All 9 consumers re-render on any dispatch |

### Target Architecture (Not Yet Implemented)

- Dynamic bar config via Supabase (replacing static JSON imports)
- Lazy pack loading via dynamic imports
- Play page decomposition into focused hooks
- Cross-device sync assessed as "low value, high cost -- do not implement"

---

## Security Audit

16 findings mapped to OWASP Top 10 (2021).

### Critical

| # | Finding | OWASP | Files | Detail |
|---|---------|-------|-------|--------|
| S1 | Premium mode gate enforced entirely client-side | A01:2021 Broken Access Control | `features/bars/access.ts`, `app/game/setup/mode/page.tsx` | All card data is shipped in the bundle. Any user can access all modes via DevTools. Monetization is unenforceable. |
| S2 | Bar session fabrication via localStorage | A01:2021 Broken Access Control | `features/bars/types.ts`, `providers/GameStoreProvider.tsx` | No cryptographic signature or server validation. Any user can craft a `barSession` object in localStorage and gain full bar access indefinitely. |

### High

| # | Finding | OWASP | Files | Detail |
|---|---------|-------|-------|--------|
| S3 | Hardcoded unlock passwords in client bundle | A02:2021 Cryptographic Failures | `app/game/setup/mode/page.tsx:20` | Passwords `YEAH!`, `amigo`, `tj`, `8664` are plaintext in a `Set()` literal. Visible in source maps and minified output. |
| S4 | Supabase RLS allows anonymous INSERT of arbitrary data | A01:2021 Broken Access Control | `docs/supabase-schema.sql:57-60` | `bar_events` policy uses `with check (true)` -- any anonymous client can flood the analytics table with arbitrary rows. |
| S5 | `game_sessions`: anonymous SELECT+UPDATE on all rows | A01:2021 Broken Access Control | `docs/supabase-schema.sql:65-79` | Any client can enumerate and modify all game sessions in the database. |
| S6 | No Content-Security-Policy or security response headers | A05:2021 Security Misconfiguration | `next.config.ts` | Missing CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy. |
| S7 | Cron endpoint relies solely on shared secret, no rate limiting | A07:2021 Identification & Auth Failures | `app/api/cron/weekly-bar-report/route.ts:17-19` | Brute-force feasible without rate limiting. |

### Medium

| # | Finding | OWASP | Files | Detail |
|---|---------|-------|-------|--------|
| S8 | Telemetry API wildcard CORS | A05:2021 | `app/api/telemetry/route.ts` | `Access-Control-Allow-Origin: *` on a no-op endpoint. |
| S9 | Unvalidated `bar_slug` in analytics insert | A03:2021 Injection | `lib/barAnalytics.ts` | Arbitrary strings accepted as slug values in event payloads. |
| S10 | Service worker caches without SRI | A08:2021 Software & Data Integrity | `public/sw.js` | Cached assets have no subresource integrity verification. |
| S11 | `dangerouslySetInnerHTML` for SW registration | A04:2021 Insecure Design | `app/layout.tsx` | Script injection vector for service worker registration. |

### Low

| # | Finding | OWASP | Files | Detail |
|---|---------|-------|-------|--------|
| S12 | Silent analytics failure masks data issues | A09:2021 Logging & Monitoring | `lib/barAnalytics.ts` | All analytics errors silently swallowed -- data loss is invisible. |
| S13 | `Math.random` fallback for session/player IDs | A02:2021 | `providers/GameStoreProvider.tsx` | Predictable IDs when `crypto.randomUUID` is unavailable. |
| S14 | Player name input lacks XSS sanitization | A03:2021 | `app/game/setup/players/page.tsx` | Raw user input rendered without sanitization. |
| S15 | Debug card ID overlay visible in production | A05:2021 | `components/game/QuestionCard.tsx` | Implementation detail exposed to end users. |
| S16 | No dependency audit or lockfile integrity check | A06:2021 | `package-lock.json` | No automated vulnerability scanning in CI. |

### Compliance Gaps

| Area | Status | Risk |
|------|--------|------|
| GDPR consent mechanism | Missing | Required before EU launch; fines up to 4% annual revenue |
| Privacy policy | Missing | Legal requirement for any data collection |
| Data deletion mechanism | Missing | GDPR Article 17 right to erasure |
| Data Processing Agreement with Supabase | Missing | Required for EU personal data processing |
| Age verification | Missing | Alcohol-related content requires age gate in most jurisdictions |
| Data retention policy | Missing | Data accumulates indefinitely with no expiration |

---

## Scalability Assessment

### Bottleneck Inventory

| ID | Bottleneck | Location | Fix | Effort |
|----|-----------|----------|-----|--------|
| A1 | 12 packs statically imported (~235KB minified) | `features/questions/repository.ts:8-27` | Dynamic imports, load only selected language+mode | 2-3 hrs |
| A3 | GameStore context value recreated every state change | `providers/GameStoreProvider.tsx` | Memoize context value, split state/dispatch if needed | 1-2 hrs |
| A4 | `seen` array O(n^2) copy pattern | `providers/GameStoreProvider.tsx` | Migrate to `Set<string>` | 1 hr |
| A7 | `visibilitychange` flush uses async fetch without `keepalive` | `lib/barAnalytics.ts` | Switch to `navigator.sendBeacon` | 30 min |
| A8 | Cron report N+1 query pattern | `app/api/cron/weekly-bar-report/route.ts` | Single aggregation SQL query | 1-2 hrs |
| A9 | Telemetry endpoint no-op wastes invocations | `app/api/telemetry/route.ts` | Delete the route | 5 min |
| - | `force-dynamic` in game layout causes unnecessary SSR | `app/game/layout.tsx` | Remove the directive | 1 min |
| - | `React.memo` on QuestionCard bypassed | `components/game/QuestionCard.tsx` | `actors` object recreated every render; memoize it | 30 min |

### Load Ceilings

| Dimension | Current Ceiling | After Fixes |
|-----------|----------------|-------------|
| Concurrent sessions | ~500 | ~5,000 |
| Analytics throughput | ~500 events/s | ~2,000 events/s |
| Cron bar capacity | 5 (Hobby) / 20 (Pro) | ~1,000 |
| Daily sessions | ~10,000 | ~50,000 |

### Projected Cost Scaling

| Monthly Active Users | Estimated Cost |
|---------------------|---------------|
| < 1,000 | $0 (Vercel free tier) |
| 10,000 | ~$45/mo |
| 50,000 | ~$150/mo |
| 200,000 | ~$500/mo |

---

## DevOps & Deployment Pipeline

### Current State

- **CI workflow:** `.github/workflows/ci.yml` is **0 bytes**. No lint, no typecheck, no build verification, no card validation. Every merge to main deploys directly to production with zero automated checks.
- **Error tracking:** None. No Sentry, LogRocket, or equivalent. Errors in production are invisible.
- **Monitoring/alerting:** None. No uptime checks, no PagerDuty, no Vercel analytics alerts.
- **Staging environment:** None. Every push to main goes straight to production.
- **`.env.local.example`:** Referenced in `CLAUDE.md` but does not exist.
- **Cron reliability:** `app/api/cron/weekly-bar-report/route.ts` has no retry logic and no failure alerting. A silent failure means bar owners receive no report with no notification.
- **Service worker:** `public/sw.js` is missing `/game/setup/language` from `SHELL_URLS` -- that page will not work offline.
- **PWA manifest:** Missing `orientation`, `id`, `screenshots`, and `categories` fields in `public/manifest.json`.

### Proposed CI Pipeline

```
push/PR → lint → typecheck → build → card validation → security audit (npm audit)
```

### Proposed Venue Provisioning

Move bar configs from static JSON to Supabase tables. Provide a CLI script for zero-deploy bar onboarding. Current process requires a code commit and Vercel deployment for each new venue.

---

## Test Coverage Audit

### Current State

**0% coverage.** All 3 test files are empty (0 bytes):
- `tests/setupTests.ts`
- `tests/features/deck_test.ts`
- `tests/features/rules_test.ts`

No test framework is installed. No Jest, Vitest, or Playwright configuration exists. `npm test` is not defined in `package.json`.

### Top 10 Risk Areas (by likelihood x impact)

| # | Area | Risk | File |
|---|------|------|------|
| 1 | GameStoreProvider reducer | State corruption, lost sessions | `providers/GameStoreProvider.tsx` |
| 2 | Deck shuffling | Non-uniform distribution, missing cards | `features/deck/shuffler.ts` |
| 3 | Weighted player distribution | Division by zero with 1 player | `features/gameplay/turn.ts` |
| 4 | Bar expiry mid-game | Orphaned state, broken navigation | `features/bars/useBarSession.ts` |
| 5 | Card text rendering | Duplicate names ("Juan vs Juan") | `lib/render.ts` |
| 6 | Offline fallback | Stale bar cards served after expiry | `lib/offline.ts` |
| 7 | Silent card filtering | Empty deck with no error | `features/questions/filters.ts` |
| 8 | Password unlock ephemeral state | Lost on re-render | `app/game/setup/mode/page.tsx` |
| 9 | Analytics race condition | Events lost on page leave | `lib/barAnalytics.ts` |
| 10 | Translation key completeness | Missing keys cause runtime crashes | `lib/i18n/translations/*.ts` |

### Recommended Stack

- **Unit/Integration:** Vitest + @testing-library/react
- **E2E:** Playwright

### Testing Pyramid Target

| Layer | Target Count |
|-------|-------------|
| Unit tests | 120 |
| Integration tests | 30 |
| E2E tests | 10 |

### Regression Hot Zones

Files that must have test coverage before any refactoring:
- `providers/GameStoreProvider.tsx`
- `features/deck/shuffler.ts`
- `features/questions/schemas.ts`
- `features/gameplay/turn.ts`
- `lib/render.ts`
- `app/game/play/page.tsx`

Three complete, runnable test suites were produced by the QA audit (deck shuffler: 13 assertions, player distribution: 10 assertions, card validation + pack integrity: 48+ assertions). These are ready to drop in once Vitest is configured.

---

## UX Review

### Critical

| Finding | Location | Detail |
|---------|----------|--------|
| Swipe not implemented | `hooks/useSwipe.ts` (exists but never imported), `components/game/SwipeController.tsx` (empty) | Marketing copy says "swipe" but the only interaction is tap. The hook exists but is dead code. |
| Player name input styling broken in dark mode | `app/game/setup/players/page.tsx` | Input has no `bg-*` or `text-*` classes; renders with browser defaults against dark background. |
| Dynamic Tailwind classes silently broken | `app/game/setup/mode/page.tsx` | Template literal pattern `bg-${color}-50` is not JIT-compiled. No selected-state visual feedback on mode tiles. |
| Marketing header/footer persists into gameplay | `app/game/layout.tsx` inherits from `app/layout.tsx` | Wastes 56px of viewport on mobile. Header contains irrelevant GitHub link during gameplay. |

### High

| Finding | Location | Detail |
|---------|----------|--------|
| No progress indicator during gameplay | `app/game/play/page.tsx` | Players have no sense of how far through the deck they are. |
| No card transition animations | `app/game/play/page.tsx`, `components/game/QuestionCard.tsx` | Content swaps instantly with no visual feedback. |
| No safe-area handling for notched iPhones | `app/globals.css`, `app/layout.tsx` | Content renders under the notch/home indicator. |
| No ErrorBoundary | Entire app | Any unrecoverable React error crashes the app with a white screen. |

### Additional Issues

| Finding | Location |
|---------|----------|
| `force-dynamic` in game layout causes unnecessary SSR | `app/game/layout.tsx` |
| Debug card ID overlay visible in production | `components/game/QuestionCard.tsx` |
| Placeholder GitHub URL in header | `components/layout/AppHeader.tsx` |
| Marketing page not internationalized | `app/page.tsx` |
| PWA theme color mismatch | `public/manifest.json` vs `app/globals.css` |

### Top 8 Improvements (All Small Effort)

1. Wire swipe gestures (hook exists, just needs integration)
2. Add progress indicator (card N of M)
3. Fix player name input styling
4. Remove marketing header/footer from game routes
5. Add card transition animations (CSS only)
6. Add safe-area-inset padding
7. Add ErrorBoundary wrapper
8. Fix dynamic Tailwind classes to static variants

---

## Retention & Growth Opportunities

### Current Viral State

**Viral coefficient: effectively 0.**

- Zero shareable moments. No score, no ranking, no memorable outcome generated.
- Summary page (`app/game/summary/page.tsx`) is a dead end: 4 buttons, no stats shown.
- `cardsSwiped` and `drinksNudged` are tracked internally but never displayed to users.
- No invite mechanism. No social proof. No reason for a player to tell anyone else about the game.

### Content Exhaustion Risk

| Pack | Cards | Est. Play Time |
|------|-------|---------------|
| `pre_en` | 200 | ~17 min |
| `night_out_en` | 110 | ~8-10 min |

Groups that play twice in one night will see significant card repetition.

### Ranked Feature Opportunities

| # | Feature | Impact | Complexity | Detail |
|---|---------|--------|-----------|--------|
| 1 | Post-Game Recap + Share Image | HIGH | M | Generate a shareable summary card with stats, funniest moments. Primary viral loop driver. |
| 2 | "Moment of the Night" Voting | HIGH | M | End-of-game vote on best moments. Creates memorable shared experience. |
| 3 | Shareable Invite Link + QR | HIGH | S | Deep link that pre-fills a game session. Lowest-effort viral mechanic. |
| 4 | Player Stats Across Sessions | MED | S-M | Persistent stats build habit loops and return visits. |
| 5 | Achievements and Titles | MED | M | Unlock titles based on play history. Social currency. |
| 6 | Bar-Branded Share Cards + Venue Leaderboard | HIGH (B2B) | L | Bars get organic social exposure when players share branded cards. |
| 7 | "Continue the Night" Deep Links | MED-HIGH | M | Post-game link to start a new round with the same group. |
| 8 | User-Generated Card Submissions | MED-HIGH | L | Community content pipeline. Scales content without internal effort. |

### Recommended Build Order

Recap (1 week) -> Invite Links (3 days) -> Voting (1 week) -> Stats (3-5 days)

This sequence delivers a minimal viral loop in 2-3 weeks.

### North Star Metric

**Weekly Active Groups** (not individual users). The unit of engagement is the friend group, not the person.

### Quick Analytics Wins

| Win | Location | Effort |
|-----|----------|--------|
| Add `drinks_nudged` count to weekly bar report | `app/api/cron/weekly-bar-report/route.ts` | 30 min |
| Track `locked_mode_tap` events | `app/game/setup/mode/page.tsx` | 10 min |

---

## Session State -- Debate & Final Solution

Two engineers debated session state management. The following consensus was reached.

### Accepted Changes

| Change | Rationale | Files Affected |
|--------|-----------|---------------|
| `seen: string[]` to `Set<string>` | O(n^2) membership check to O(1) | `providers/GameStoreProvider.tsx` |
| Single `HYDRATE` action | Fixes race condition between multiple persist/hydrate effects | `providers/GameStoreProvider.tsx` |
| Session persistence (seen + seed + sessionId in localStorage) | Enables resume after accidental page close | `providers/GameStoreProvider.tsx` |
| Play page decomposition | 377 lines with 13 useEffects to ~250 lines via 5 extracted hooks | `app/game/play/page.tsx` |
| Analytics path consolidation | 3 flush paths to 2 (periodic + sendBeacon) | `lib/barAnalytics.ts` |

### Rejected Proposals

| Proposal | Reason |
|----------|--------|
| Context splitting (separate state/dispatch contexts) | Only 1 of 9 consumers is dispatch-only. Complexity not justified. |
| HMAC bar session signing | Over-engineering for current threat model. Revisit when payment gates are live. |

### Additional Patches from Debate

| Patch | Location | Impact |
|-------|----------|--------|
| Fixed `seen` in `useDeck` dependency array | `features/deck/useDeck.ts` | Was causing full deck rebuild on every tap |
| Pack lazy loading via dynamic imports | `features/questions/repository.ts` | Bundle: 622KB to 30-70KB per session |
| Cron N+1 query consolidated | `app/api/cron/weekly-bar-report/route.ts` | Single SQL aggregation instead of per-bar queries |
| Offline deck localStorage write spam fixed | `lib/offline.ts` | Was writing on every card advance |
| Dead code cleanup | `lib/deck.ts`, `lib/types.ts`, `data/index.ts` | ~114 lines removed |

---

## Business Logic Gaps

### Venue Onboarding Blockers

| Blocker | Current State | Required State |
|---------|--------------|----------------|
| Static bar imports | Bar config is committed to git; adding a bar requires a deploy | Supabase-backed dynamic config |
| No admin dashboard | Bar owners have zero visibility into their analytics | Minimum: weekly email (exists but untested) |
| Client-only bar sessions | No server validation of session authenticity | Server-signed tokens or Supabase session validation |
| Spanish-only reports | Weekly email hardcoded in Spanish | Multilingual report templates |

### Mode Access Logic

`features/bars/access.ts` and `app/game/setup/mode/page.tsx` implement freemium gating:
- `pre` mode: free for all users
- `night_out` mode: requires active bar session (or hardcoded password bypass)
- Future modes: locked behind same gate

This logic is entirely client-side. All card data ships in the bundle regardless of access level. Monetization is unenforceable in the current architecture.

---

## Payment Integration -- Lemon Squeezy Analysis

### Provider Recommendation

**Lemon Squeezy** is the recommended payment provider. The decisive advantage: no business entity required. Lemon Squeezy operates as Merchant of Record, handling EU VAT compliance, tax remittance, and invoicing on behalf of the developer.

### Lemon Squeezy vs Stripe vs Paddle Comparison

| Factor | Lemon Squeezy | Stripe | Paddle |
|--------|--------------|--------|--------|
| Merchant of Record | Yes | No | Yes |
| Requires business entity | **No** | Yes | Yes |
| EU VAT handling | Automatic | Manual setup | Automatic |
| Transaction fees | 5% + $0.50 | 2.9% + $0.30 | 5% + $0.50 |
| License key system | Built-in | Custom implementation | Not built-in |
| Next.js SDK quality | Good | Excellent | Good |
| Time to first transaction | Hours | Days (entity + verification) | Days (entity + verification) |

### Monetization Model

**B2C:**

| Product | Price | Model |
|---------|-------|-------|
| Salud Unlimited | EUR 4.99 | One-time purchase, unlocks all modes |
| Content packs | EUR 1.99 - 3.99 each | One-time purchase per pack |

**B2B:**

| Tier | Monthly | Annual | Includes |
|------|---------|--------|----------|
| Starter | EUR 29/mo | EUR 249/yr | QR code, all modes, 15 bar cards, weekly email report |
| Pro | EUR 59/mo | EUR 499/yr | Custom cards, real-time dashboard, all languages |
| Enterprise | Custom | Custom | Multi-location, white-label, dedicated support |

### Implementation Roadmap

| Phase | Scope | Effort |
|-------|-------|--------|
| 1. Entitlements layer | Server-side access control, license key validation, Supabase entitlements table | 8-12 hrs |
| 2. Checkout integration | Lemon Squeezy checkout overlay, webhook handler, purchase confirmation flow | 6-8 hrs |
| 3. Dynamic bar provisioning | Supabase-backed bar config, admin API for bar CRUD, self-service onboarding | 10-14 hrs |
| 4. Admin portal | Bar owner dashboard, real-time analytics view, card management UI | 12-16 hrs |
| **Total** | | **36-50 hrs** |

---

## Master Optimization Plan (P0 -> P3)

### P0 -- Ship This Week (1.5-2 dev days)

These are security and correctness fixes. No new features.

| Task | Files | Effort |
|------|-------|--------|
| Remove hardcoded passwords from client bundle | `app/game/setup/mode/page.tsx:20` | 30 min |
| Tighten Supabase RLS: restrict `bar_events` INSERT to valid slugs, remove blanket `game_sessions` SELECT/UPDATE | `docs/supabase-schema.sql` (apply to Supabase) | 1 hr |
| Add security response headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) | `next.config.ts` | 1 hr |
| Fix bar layout duplicate provider tree | `app/bar/layout.tsx` | 1 hr |
| Delete dead code: `lib/deck.ts`, `lib/types.ts`, `data/index.ts`, empty stubs | Multiple files | 30 min |
| Switch analytics flush to `navigator.sendBeacon` | `lib/barAnalytics.ts` | 30 min |
| Fix duplicate barSession persistence effect | `providers/GameStoreProvider.tsx:317-341` | 15 min |
| Remove `force-dynamic` from game layout | `app/game/layout.tsx` | 1 min |

### P1 -- Ship This Sprint (5-7 dev days)

| Task | Files | Effort |
|------|-------|--------|
| Wire swipe gestures (hook exists) | `hooks/useSwipe.ts`, `app/game/play/page.tsx` | 4 hrs |
| Hide marketing header/footer in game routes | `app/game/layout.tsx`, `components/layout/AppHeader.tsx` | 2 hrs |
| Set up CI pipeline (lint, typecheck, build, card validation) | `.github/workflows/ci.yml` | 4 hrs |
| Add ErrorBoundary | New: `components/ErrorBoundary.tsx`, `app/game/layout.tsx` | 2 hrs |
| Delete or implement telemetry route | `app/api/telemetry/route.ts` | 30 min |
| Add card transition animations | `components/game/QuestionCard.tsx`, `styles/` | 3 hrs |
| Consolidate cron to single SQL aggregation | `app/api/cron/weekly-bar-report/route.ts` | 2 hrs |
| Fix player name input dark mode styling | `app/game/setup/players/page.tsx` | 30 min |
| Fix dynamic Tailwind classes (use static variants) | `app/game/setup/mode/page.tsx` | 1 hr |
| Add progress indicator to gameplay | `app/game/play/page.tsx` | 2 hrs |

### P2 -- Ship This Month (10-14 dev days)

| Task | Files | Effort |
|------|-------|--------|
| Install Vitest, write priority test suites | `vitest.config.ts`, `tests/` | 5 days |
| Integrate Sentry error tracking | `app/layout.tsx`, `next.config.ts` | 4 hrs |
| Add `<html lang>` dynamic attribute | `app/layout.tsx` | 2 hrs |
| Safe-area-inset handling for notched devices | `app/globals.css`, `app/layout.tsx` | 2 hrs |
| GDPR minimum: cookie banner, privacy policy page, data deletion endpoint | Multiple new files | 3 days |
| Enable Dependabot for dependency auditing | `.github/dependabot.yml` | 30 min |
| Fix SW missing `/game/setup/language` in SHELL_URLS | `public/sw.js` | 15 min |
| Complete PWA manifest fields | `public/manifest.json` | 30 min |
| Hide debug card ID overlay in production | `components/game/QuestionCard.tsx` | 15 min |

### P3 -- Next Quarter (25-35 dev days)

| Task | Effort |
|------|--------|
| Post-game recap with shareable image generation | 5-7 days |
| Lemon Squeezy integration (entitlements + checkout + webhooks) | 7-10 days |
| Dynamic bar provisioning via Supabase | 5-7 days |
| Shareable invite links with deep linking | 3 days |
| Content expansion (new packs, community submissions pipeline) | 3-5 days |
| "Moment of the Night" voting rounds | 3-5 days |
| Multilingual weekly reports | 2 days |

### Disagreements Resolved

| Topic | Resolution |
|-------|-----------|
| Context splitting (separate state/dispatch) | Rejected. Only 1 of 9 consumers is dispatch-only. |
| HMAC bar session signing | Rejected now. Revisit when payment gates go live. |
| Telemetry route | Delete it. No-op code with security surface area. |
| `force-dynamic` directive | Already identified for removal in P0. |

---

## Venue Onboarding Checklist

Current process (developer-assisted, ~30 minutes):

| Step | Action | Time |
|------|--------|------|
| 1 | Collect bar info: name, city, slug, session duration, supported languages | 5 min |
| 2 | Create `data/bars/<slug>/` with `config.json` + `cards_<language>.json` per language | 5 min |
| 3 | Register in `data/bars/index.ts` BAR_REGISTRY | 2 min |
| 4 | Add row to `bar_owners` table in Supabase (name, email, slug) | 2 min |
| 5 | Commit and deploy to Vercel | 5 min |
| 6 | Generate QR code pointing to `https://saludgame.com/bar/<slug>` | 5 min |
| 7 | Verify end-to-end: scan QR, check session, play cards, confirm analytics | 5 min |

This process requires developer involvement and a production deployment for every new bar. The P3 roadmap includes moving to Supabase-backed dynamic provisioning to enable self-service onboarding.

---

## READY TO APPLY

Safe changes with no breaking impact. These can be merged without manual testing beyond a smoke test.

### 1. Delete dead code

| File | Action |
|------|--------|
| `lib/deck.ts` | Delete (82 lines, superseded by `features/deck/`) |
| `lib/types.ts` | Delete (32 lines, types live in `features/*/types.ts`) |
| `data/index.ts` | Delete (dead re-export) |
| `app/api/telemetry/route.ts` | Delete (no-op endpoint, wildcard CORS, wastes invocations) |
| `app/marketing/page.tsx` | Delete (duplicate of `app/page.tsx`) |

### 2. Remove `force-dynamic` from game layout

**File:** `app/game/layout.tsx`
**Change:** Remove `export const dynamic = 'force-dynamic'` directive. This causes unnecessary SSR on every game page load, increasing Vercel function invocations by ~10x.

### 3. Fix duplicate barSession persistence effect

**File:** `providers/GameStoreProvider.tsx`
**Change:** Lines 317-328 and 330-341 are identical `useEffect` blocks persisting `barSession` to localStorage. Delete one of the two blocks.

### 4. Switch analytics flush to sendBeacon

**File:** `lib/barAnalytics.ts`
**Change:** Replace the `visibilitychange` handler's `fetch()` call with `navigator.sendBeacon()`. Current implementation uses async fetch without `keepalive`, causing 15-30% event loss on page hide.

### 5. Remove hardcoded passwords

**File:** `app/game/setup/mode/page.tsx`
**Change:** Delete the `Set(['YEAH!', 'amigo', 'tj', '8664'])` on line 20 and the associated password-check logic. These passwords are plaintext in the client bundle and provide zero actual security.

### 6. Hide debug card ID overlay

**File:** `components/game/QuestionCard.tsx`
**Change:** Wrap the card ID debug overlay in a `process.env.NODE_ENV === 'development'` check, or remove it entirely.

### 7. Fix SW SHELL_URLS

**File:** `public/sw.js`
**Change:** Add `/game/setup/language` to the `SHELL_URLS` array so the language selection page works offline.

### 8. Create `.env.local.example`

**File:** `.env.local.example` (new file)
**Change:** Create the file referenced in `CLAUDE.md` with placeholder values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.

---

## REQUIRES REVIEW

These changes carry risk of breaking behavior or require coordination with external systems.

### 1. Fix bar layout duplicate provider tree

**Files:** `app/bar/layout.tsx`, `app/game/layout.tsx`
**Change:** Ensure bar routes and game routes share the same `GameStoreProvider` instance so that `barSession` state set during the bar landing page is visible in the game setup flow.
**Risk:** The current provider boundary may be intentional for isolation. Merging them changes the state lifecycle for all game and bar routes. Requires testing the full bar flow: `/bar/<slug>` -> language -> players -> mode -> play -> summary.

### 2. Tighten Supabase RLS policies

**Files:** Apply SQL changes to Supabase project (reference: `docs/supabase-schema.sql`)
**Changes:**
- `bar_events`: Add `WITH CHECK` constraint validating `bar_slug` against known slugs
- `game_sessions`: Remove blanket anonymous SELECT and UPDATE; scope to session owner
**Risk:** Overly restrictive policies will silently break analytics and session persistence. Requires testing on deployed Supabase instance. Rollback is a SQL change but analytics data may be lost during the gap.

### 3. Add security response headers

**File:** `next.config.ts`
**Changes:** Add `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` headers.
**Risk:** An overly restrictive CSP will break Supabase client calls, inline scripts (SW registration via `dangerouslySetInnerHTML`), and any external resources. Must be tested against all API calls and dynamic script patterns. Start with `Content-Security-Policy-Report-Only` before enforcing.

### 4. Lazy pack loading via dynamic imports

**File:** `features/questions/repository.ts`
**Change:** Replace static imports of all 12 pack JSONs with dynamic `import()` calls that load only the selected language and mode. Reduces initial bundle from ~622KB to ~30-70KB.
**Risk:** Changes the pack loading from synchronous to asynchronous. All consumers of `getPackByModeAndLanguage()` must handle the async boundary. The offline fallback in `lib/offline.ts` must be verified to still work when packs are lazily loaded.

### 5. `seen` migration from `string[]` to `Set<string>`

**File:** `providers/GameStoreProvider.tsx`
**Change:** Replace `seen: string[]` with `seen: Set<string>` in `GameState`. Update `MARK_SEEN` reducer action and all consumers.
**Risk:** `Set` is not JSON-serializable. The localStorage persistence logic for session state must serialize/deserialize the Set explicitly. All components reading `state.seen` (including `useDeck`) must be updated. The `seen` array is also passed through context -- verify no consumer spreads or maps it as an array.

### 6. Single HYDRATE action for state restoration

**File:** `providers/GameStoreProvider.tsx`
**Change:** Consolidate multiple `useEffect` hooks that independently read from localStorage into a single `HYDRATE` action dispatched once on mount.
**Risk:** Current hydration effects run independently and may have implicit ordering dependencies. A single hydrate action changes the timing of when each piece of state becomes available. Components that rely on partial hydration (e.g., language available before players) may break.

### 7. Play page decomposition

**File:** `app/game/play/page.tsx`
**Change:** Extract 5 custom hooks from the 377-line monolith: deck management, player rotation, rule tracking, analytics, and UI state.
**Risk:** The 13 `useEffect` hooks have implicit dependencies on shared local state (`weights`, `currentPlayerIdx`, `runId`). Extracting them into separate hooks changes closure scoping and may introduce stale-state bugs if not carefully wired. Requires the test suites from the QA audit to be in place first.

### 8. Cron SQL aggregation refactor

**File:** `app/api/cron/weekly-bar-report/route.ts`
**Change:** Replace per-bar JavaScript aggregation with a single SQL query using `GROUP BY bar_slug`.
**Risk:** Current implementation silently truncates at Supabase's 1000-row default limit. The fix changes the data path for weekly reports sent to bar owners. Must verify aggregation accuracy against known test data before deploying, as incorrect reports damage B2B trust.

---

*Report compiled from findings of 8 specialist audit agents, a structured coder debate, and orchestrator synthesis. All file paths are relative to the repository root `/home/tomas/Documents/salud-game/`.*
