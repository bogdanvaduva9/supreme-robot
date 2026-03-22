# CLAUDE.md — Project Context for AI Sessions

This file is read automatically by Claude at the start of every session.

---

## Project

**LifeSim** — A browser-based life simulation game where the player lives a single human life from birth to death. An AI narrator (Claude API) simulates the world, generates events, creates NPCs, and presents age-appropriate choices. Inspired by Pax Historia, but for a person's life instead of a country.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| State (server) | In-memory `Map<string, GameState>` pinned to `globalThis` |
| State (client) | React Context (`GameProvider`) |
| Package manager | npm |
| Infrastructure | Local only (`npm run dev`) — no cloud deployment yet |

---

## Repository Layout

```
supreme-robot/
├── CLAUDE.md                        ← you are here
├── .claude/docs/
│   ├── ai-prompts.md                ← AI prompt engineering guide
│   ├── game-design.md               ← game mechanics reference
│   └── age-system.md                ← age-based choice system spec
├── .env.example                     ← ANTHROPIC_API_KEY template
├── .env.local                       ← (gitignored) actual key
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← root layout (wraps GameProvider)
│   │   ├── page.tsx                 ← landing / main menu
│   │   ├── globals.css              ← Tailwind imports + dark theme
│   │   ├── new-game/page.tsx        ← character creation (name, gender, year, location, language)
│   │   ├── game/page.tsx            ← main game screen (two-step: select choice + time skip → confirm)
│   │   ├── summary/page.tsx         ← end-of-life summary
│   │   └── api/
│   │       └── game/
│   │           ├── start/route.ts   ← POST: initialize new game
│   │           ├── turn/route.ts    ← POST: submit choice + time skip, get next turn
│   │           └── state/route.ts   ← GET: retrieve current game state
│   ├── components/
│   │   ├── game/                    ← NarrativePanel, ChoicePanel, ChoiceCard, CharacterSheet,
│   │   │                               RelationshipList, TimelineBar, WorldStatus, DeathScreen,
│   │   │                               TimeSkipSelector
│   │   └── setup/                   ← YearPicker, LocationPicker, CharacterPreview
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts            ← Anthropic SDK singleton
│   │   │   ├── prompts.ts           ← system prompt builder (accepts Language, TimeSkip)
│   │   │   ├── responseParser.ts    ← parse/validate AI JSON responses
│   │   │   └── contextManager.ts    ← rolling window + life summary compression
│   │   ├── game/
│   │   │   ├── engine.ts            ← processChoice (accepts explicit timeAdvanceYears)
│   │   │   ├── ageSystem.ts         ← age bracket definitions + choice guidelines
│   │   │   ├── stateManager.ts      ← globalThis-pinned Map store (survives hot-reload)
│   │   │   ├── initialState.ts      ← GameState factory (accepts Language)
│   │   │   ├── timeSkips.ts         ← TIME_SKIP_OPTIONS, getTimeSkipOption, labels EN/RO
│   │   │   └── deathCalculator.ts   ← lifespan probability
│   │   ├── types/
│   │   │   ├── game.ts              ← GameState, Character, Choice, Language, TimeSkip, etc.
│   │   │   ├── ai.ts                ← AIResponse, StateUpdates (no timeAdvancement)
│   │   │   └── api.ts               ← StartGameRequest (language), TurnRequest (timeSkip)
│   │   └── utils/
│   │       ├── id.ts                ← crypto.randomUUID wrapper
│   │       └── format.ts            ← date/age formatting
│   ├── hooks/
│   │   ├── useGame.ts               ← main game hook
│   │   └── useTypewriter.ts         ← text animation hook
│   └── providers/
│       └── GameProvider.tsx          ← React context (language, makeChoice takes TimeSkip)
```

---

## Conventions

- **Components**: PascalCase filenames (e.g., `ChoiceCard.tsx`)
- **Utilities/hooks**: camelCase filenames (e.g., `useGame.ts`, `stateManager.ts`)
- **Types**: PascalCase for interfaces, camelCase for type files
- **API routes**: lowercase kebab-case directories
- **Server Components by default**: add `"use client"` only when needed
- **Named exports** preferred over default exports
- **Tailwind utility-first**: no CSS modules or styled-components
- **Dark theme only**: defined in `globals.css` via `@theme inline {}`

---

## Dev Commands

```bash
npm run dev          # Start local dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check without emitting
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for game simulation |
| `ANTHROPIC_MODEL` | No | Override model (default: `claude-sonnet-4-20250514`) |
| `ALPHA_ACCESS_KEY` | No | Secret key for the alpha access gate. If unset, gate is bypassed (local dev). Set via GitHub Actions secret in deployment. |

---

## Game Architecture

### Turn-Based Loop (two-step UI)
```
User starts game -> POST /api/game/start -> AI birth narrative + first choices
  -> User selects a choice (highlighted) + picks a time skip (1w/2w/1m/3m/6m/1y)
  -> User hits "Confirm" -> POST /api/game/turn { choiceId, timeSkip }
    -> contextManager builds AI prompt (system + history + state + choice + time period)
    -> AI simulates the full time period (narrative + events + state delta)
    -> engine applies state delta; time advances by EXACTLY the user-selected amount
    -> response sent to client
  -> Repeat until death
  -> isDead: true -> DeathScreen -> /summary
```

### Language Support
- `Language = 'en' | 'ro'` stored in `GameState`
- Selected on the new-game page; carried through the whole game
- Romanian: AI system prompt includes `"IMPORTANT: Respond ENTIRELY in Romanian"` — all narrative, choices, traits, achievements come back in Romanian
- UI labels (time skip selector, confirm button, loading message) switch language client-side

### Time Skip System
- User chooses how much time to advance: 1 week, 2 weeks, 1 month, 3 months, 6 months, 1 year
- The AI no longer decides time advancement — the user does
- `timeSkips.ts` maps `TimeSkip` values to exact year fractions (e.g. `'3m' → 0.25`)
- For longer periods (3m+), the AI prompt instructs it to include multiple events across the period
- `engine.processChoice()` receives `timeAdvanceYears: number` and applies it precisely

### State Management
- **Server-side authoritative**: full `GameState` stored in `Map<string, GameState>` on `globalThis`
- **`globalThis` pattern**: prevents the state being lost across Next.js API route module instances (hot-reload fix)
- **Client receives display subset**: character, choices, narrative, relationships, events
- State is lost on full server restart (acceptable for local dev prototype)

### AI Context Strategy
- Rolling window of last 10 conversation turns
- Compressed life summary for older turns (updated every 10 turns)
- Character stats + relationships always injected fresh
- See `.claude/docs/ai-prompts.md` for full prompt engineering details

### Age Bracket System
Choices scale with age — from binary sensory choices (infant) to complex life decisions (adult).
See `.claude/docs/age-system.md` for full bracket definitions.

---

## Key Design Decisions

- **No database**: In-memory state on `globalThis` for local dev simplicity
- **User controls time, not AI**: removes a major source of AI unpredictability; AI focuses on narrative quality
- **Two-step choice flow**: select choice + pick time → confirm; cleaner UX than immediate submission
- **No streaming**: parse complete JSON responses; typewriter effect on client fakes progressive rendering
- **Server-side authoritative state**: prevents client tampering, easier to add persistence later
- **Rolling window + summary**: keeps AI context under ~8K tokens while preserving narrative coherence

---

## Known Pitfalls

- **`globalThis.__lifesim_games`**: The state Map must live on `globalThis` — a plain module-level `Map` gets a fresh instance per Next.js API route worker, causing 404s on `/api/game/turn`.
- **AI response must be pure JSON**: The system prompt says no markdown/code fences, but `responseParser.ts` strips them anyway as a fallback.
- **`timeAdvancement` removed from AI schema**: The AI no longer outputs `timeAdvancement`. Time is controlled entirely by the user's `TimeSkip` selection.
- **Alpha access gate**: `src/middleware.ts` checks for a `lifesim_access` httpOnly cookie on every request. Gate is bypassed if `ALPHA_ACCESS_KEY` env var is not set. The key is validated in `POST /api/auth/access` and the cookie lasts 30 days. Set `ALPHA_ACCESS_KEY` as a GitHub Actions secret and pass it as an env var at deploy time.
