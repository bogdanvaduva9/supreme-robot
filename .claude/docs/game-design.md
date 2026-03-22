# Game Design Document

This document defines the core mechanics, systems, and rules for LifeSim.

---

## Core Concept

The player lives a single human life from birth to death. Every life is unique — shaped by the player's choices, random events, and AI-generated narrative. The game is text-based with a rich UI for stats, relationships, and history.

---

## Game Loop

```
START -> Character Creation (name, gender, year, location, language)
       -> POST /api/game/start
       -> AI generates birth narrative + first 2 choices
  |
  v
TURN LOOP (two-step UI):
  1. Display narrative (what happened over the selected time period)
  2. Display 2-4 choices (user selects one — highlighted)
  3. User picks a time skip (1w / 2w / 1m / 3m / 6m / 1y)
  4. User clicks "Confirm" -> POST /api/game/turn { choiceId, timeSkip }
  5. Server: AI simulates the full period, returns narrative + state delta + new choices
  6. Engine applies state delta; age advances by EXACTLY the user-selected time
  7. Check death conditions
  8. If alive: go to step 1
  9. If dead: DeathScreen -> /summary
```

**Key change from original design**: The user — not the AI — decides how much time passes. The AI's job is to narrate and simulate whatever happens within that period.

---

## Character Creation

Fields on `/new-game`:
- **Name**: free text
- **Gender**: Male / Female / Non-binary
- **Birth Year**: default 2026, range 1900–2100
- **Birth Location**: free text (City, Country)
- **Language**: English 🇬🇧 or Romanian 🇷🇴 — drives all AI-generated content

---

## Time Skip System

The player chooses how much in-game time each turn covers:

| Option | In-game time | Years (fractional) |
|---|---|---|
| 1 săptămână / 1 week | 1 week | 1/52 ≈ 0.019 |
| 2 săptămâni / 2 weeks | 2 weeks | 2/52 ≈ 0.038 |
| 1 lună / 1 month | 1 month | 1/12 ≈ 0.083 |
| 3 luni / 3 months | 3 months | 0.25 |
| 6 luni / 6 months | 6 months | 0.5 |
| 1 an / 1 year | 1 year | 1.0 |

**Rules**:
- Time skip is applied exactly — no rounding or AI override
- For periods ≥ 3 months, the AI is prompted to include 2–3 additional random events that naturally occur during the period (not just the choice consequence)
- Stat deltas from the AI are expected to scale with the time period
- Season and year are recalculated from the new fractional age after each turn

---

## Language System

- `Language = 'en' | 'ro'`
- Set once at character creation; stored in `GameState.language`
- When Romanian: AI system prompt contains a hard language instruction
- UI elements (time skip labels, confirm button, loading message) also switch client-side
- All AI outputs — narrative, choice labels, traits, achievements, relationship descriptions — come back in the selected language

---

## Character Stats

All stats range from 0-100. Start at 50 (baseline).

| Stat | Description | Affected By |
|---|---|---|
| **Health** | Physical wellbeing | Exercise, diet, accidents, aging, healthcare access |
| **Happiness** | Emotional wellbeing | Relationships, achievements, losses, life satisfaction |
| **Intelligence** | Cognitive ability | Education, reading, curiosity |
| **Social** | Social skills and network | Friendships, social activities, isolation |
| **Wealth** | Financial resources | Career, spending, investments |
| **Appearance** | Physical attractiveness | Genetics, grooming, aging, health |
| **Luck** | Hidden modifier | Set at birth (30–70). Influences random events. Never shown. |

### Stat Effects
- Stats below 10 or above 90 trigger special events
- Stats injected into AI prompt fresh every turn (AI can reference them for narrative)

---

## Relationship System

NPCs are created by the AI and persist across turns.

### Properties
- **Name**, **Type**, **Attitude** (-100 to +100), **Met at age**, **Active** (bool), **Description**
- Types: parent, sibling, extended_family, friend, best_friend, acquaintance, romantic_partner, spouse, teacher, mentor, boss, coworker, rival, enemy

### Lifecycle
1. AI creates NPCs when narratively appropriate (parents at birth, friends at school, etc.)
2. Attitude changes via `updatedRelationships` in state updates
3. Can become inactive via `removedRelationships` (moved, died, broke up)
4. Inactive relationships remain in history but not shown in the active list

---

## Death Mechanics

### Natural Death (Age-Based)
`deathCalculator.ts`:
```
baseProbability = age < 60 ? 0 : 0.001 * 2^((age - 60) / 5)
healthModifier = 1 + (50 - health) * 0.02
lifestyleModifier = trait modifiers (Athletic: -0.2, Reckless: +0.2, etc.)
wealthModifier = wealth > 70 ? 0.9 : wealth < 30 ? 1.2 : 1.0
finalProbability = min(1.0, base * health * (1 + lifestyle) * wealth)
```

Death probability is sent to the AI as a system note. AI triggers death narratively when probability is high.

### Event-Based Death
AI can trigger death at any age via `isDead: true` in its response — for accidents, illness, violence. Always narratively meaningful and rare below age 60.

---

## Trait System

- Max 8 active traits
- Gained/lost via `newTraits` / `removedTraits` in AI state updates
- Traits influence the death calculator and narrative tone
- In Romanian games, trait names come back in Romanian

---

## Achievement System

Milestones the AI awards via `newAchievements`:
- "First Steps" (age 1), "School Days", "First Love", "Graduate", "Career Starter", "Married", "Parent", "Retired", "Centenarian"
- AI can invent custom achievements — displayed on the summary page

---

## Save System (Future)

Not implemented. Planned: serialize `GameState` to `saves/{gameId}.json`.
