# Tally

A budgeting app built for variable income: log what actually comes in and
goes out, plan budgets weekly *or* monthly (and months ahead of time), and
get a recommended savings/investing split instead of a flat percentage rule.

Everything is organized into tabs instead of one long page: **Dashboard,
Income, Expenses, Budgets, Savings & Investing, Reports, Settings.**

## Why it's different

- **Built for variable income and expenses.** Nothing assumes a fixed
  paycheck. Income sources have a frequency (weekly, biweekly, irregular…)
  but every income *event* is logged with its real amount.
- **Weekly or monthly budgeting, your choice, period by period.** Toggle
  between the two — you can run some months as monthly budgets and others
  as weekly.
- **Plan budgets months in advance.** "Plan ahead" generates the next N
  weekly or monthly budgets in one shot, optionally auto-filled from an
  allocation strategy.
- **Savings/investing recommendations, not just a category.** Pick a
  strategy (Classic 50/30/20, Pay Yourself First, or your own), and the app
  recommends a needs/wants/savings split, prioritizing your emergency fund
  before routing money to investing.
- **All manual entry.** Nothing auto-imports transactions — you're always
  in full control of what's logged.

## Structure

This is an npm-workspaces monorepo:

```
packages/core     Shared TypeScript domain model, calculations, and the
                   storage interface both apps implement. No UI, no
                   platform APIs — pure logic, unit tested with Vitest.
apps/web           React + Vite web app (works on desktop and mobile
                   browsers, installable as a PWA). Data lives in
                   IndexedDB via Dexie.
apps/mobile        Expo React Native app (iOS/Android) reusing the same
                   core package. Data lives in AsyncStorage.
```

Both apps implement the same `DataStore` interface from `packages/core`
(`packages/core/src/store.ts`) against their platform's storage — that's
what keeps the budgeting logic, allocation math, and date handling
identical between web and mobile instead of duplicated and drifting.

### Data & sync

Everything is **stored locally on-device** today (IndexedDB on web,
AsyncStorage on mobile) — there's no account and nothing leaves your
device except through the JSON export in Settings. Every record already
carries an `updatedAt` timestamp and an optional `deletedAt` tombstone
(see `packages/core/src/types.ts`), which is exactly what a future sync
layer needs to diff and merge changes — so if/when you want sync across
devices, it can be added as another `DataStore` implementation without
reworking the app.

## Getting started

Requires Node 20+.

```bash
npm install          # installs all workspaces from the repo root
```

### Web app

```bash
npm run dev:web       # starts the Vite dev server
npm run build:web     # production build
```

### Mobile app

```bash
npm run dev:mobile    # starts the Expo dev server — scan the QR code
                       # with Expo Go, or press `i` / `a` for a simulator
```

### Core package (shared logic)

```bash
npm run test:core     # runs the Vitest suite (25 tests)
npm run typecheck      # typechecks core + web + mobile
```

## Known limitations (first pass)

- **No cross-device sync** — see the Data & sync section above. Use
  Settings → Export/Import to move a backup between devices manually.
- Category **budgeting kinds** (essential/discretionary/savings/investing)
  drive the "auto-fill from strategy" feature — if a kind has no category
  yet (e.g. you delete your only "Investing" category), that bucket's
  recommended amount has nowhere to go and is silently skipped.

Tell me what to adjust or add next — this was built to be iterated on.
