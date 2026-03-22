# AI Prompt Engineering Guide

This document defines how LifeSim communicates with the Claude API to generate narrative, choices, and game state updates.

---

## System Prompt Structure

The system prompt is built dynamically by `src/lib/ai/prompts.ts` and passed as the `system` parameter to the Claude API call.

### A. Role Definition + Language Injection

`buildSystemPrompt(language: Language)` — language is injected here.

```
You are the narrator and world simulator for LifeSim, a life simulation game.
You control the world, NPCs, events, and consequences. The user is living
a life from birth to death. You must be realistic, nuanced, and responsive
to the user's choices. You are not the user's character — you are the world.

[If language === 'ro']:
IMPORTANT: Respond ENTIRELY in Romanian. All narrative text, choice labels,
choice descriptions, world events, trait names, achievement names, and
relationship descriptions MUST be in Romanian. Only proper nouns (character
name, place names) remain as given.

Rules:
- Be immersive and emotionally engaging
- Consequences should feel natural, not punitive
- NPCs should have their own motivations and can act independently
- World events happen regardless of user choices
- Maintain internal consistency across turns
- Never break the fourth wall
- Adapt narrative tone to the character's age (simple for children, complex for adults)
```

### B. Response Format (Strict JSON)

**Note**: `timeAdvancement` has been removed from the schema. Time is now controlled by the user, not the AI.

```
Always respond with ONLY valid JSON matching this exact schema. No markdown, no code fences, no explanation outside the JSON.

{
  "narrative": "string — 1-3 paragraphs covering the full time period requested",
  "choices": [
    {
      "id": "string — unique, e.g. 'choice_1'",
      "label": "string — short action label, 5-15 words",
      "description": "string — optional flavor text, 1 sentence max",
      "tone": "positive | negative | neutral | risky"
    }
  ],
  "stateUpdates": {
    "health": "number delta (-10 to +10), optional",
    "happiness": "number delta (-10 to +10), optional",
    "intelligence": "number delta (-10 to +10), optional",
    "social": "number delta (-10 to +10), optional",
    "wealth": "number delta (-10 to +10), optional",
    "appearance": "number delta (-5 to +5), optional",
    "newRelationships": [
      {
        "name": "string",
        "type": "parent | sibling | extended_family | friend | best_friend | acquaintance | romantic_partner | spouse | teacher | mentor | boss | coworker | rival | enemy",
        "attitude": "number — -100 to +100",
        "description": "string — 1 sentence about this person"
      }
    ],
    "updatedRelationships": [{ "name": "string", "attitudeChange": "number -20 to +20" }],
    "removedRelationships": ["string — name"],
    "newTraits": ["string"],
    "removedTraits": ["string"],
    "worldEvents": ["string"],
    "newEducation": "string or omit",
    "newOccupation": "string or omit",
    "locationChange": "string or omit",
    "newAchievements": ["string"]
  },
  "isDead": "boolean",
  "deathCause": "string or null"
}
```

### C. Age Bracket Context (Dynamic)

Injected based on current age. Includes choice guidelines and complexity, but NOT a time suggestion (that's the user's job now).

```
CURRENT AGE BRACKET: Teenager (12-17)
Choice guidelines: Identity formation, peer pressure, ...
Complexity level: Medium-high.
Number of choices to offer: 3-4.
```

### D. World Context (Dynamic)

```
WORLD STATE:
Current year: {year}
Location: {city}, {country}
Season: {season}
Recent world events: {list}
```

### E. Character Summary (Dynamic)

```
CHARACTER:
Name: {name}. Age: {age}. Gender: {gender}.
Stats: Health {h}/100, Happiness {h}/100, Intelligence {i}/100, Social {s}/100, Wealth {w}/100, Appearance {a}/100.
Traits: {list}
Education: {education}
Occupation: {occupation}
Achievements: {list}
```

### F. Relationships (Dynamic)

```
RELATIONSHIPS:
- {name} ({type}, attitude: {attitude}/100) — {description}
```

### G. Life Summary (Dynamic)

```
LIFE SUMMARY (compressed history of earlier events):
{lifeSummary}
```

### H. Time Period (Dynamic — appended to section C)

When a time skip is provided (every normal turn), `buildTurnContext` appends:

```
TIME PERIOD: The player has chosen to advance {duration}. Your narrative must
cover what happens during this entire period. For longer periods (3+ months),
include 2-3 notable events or developments that occur naturally during this time,
not just the immediate consequence of the choice. Scale stat changes proportionally
to the time elapsed.
```

---

## Final User Message (per turn)

```
The player chose: "{choiceLabel}". Simulate what happens during the next
{duration}, including the consequence of this choice and any random events
that naturally occur in this period.
```

This is built by `contextManager.buildMessages(state, choiceLabel, timeSkip)`.

---

## Context Management Strategy

Implemented in `src/lib/ai/contextManager.ts`.

### Rolling Window
- Keep the last 10 full user/assistant message pairs
- Each user message: the choice label + time period instruction
- Each assistant message: the full AI JSON response

### Life Summary Compression
- Every 10 turns, compress older history into a `lifeSummary` string (~200 words)
- Keeps total context under ~8K tokens

### Message Array Structure
```
[system]     buildSystemPrompt(language)
[user]       buildTurnContext(state, timeSkip)   ← sections C-H
[assistant]  "I understand..."
[user/asst]  ... rolling window of last 10 turns ...
[user]       "The player chose: X. Simulate the next Y..."
```

---

## Response Parsing

`src/lib/ai/responseParser.ts`:
1. Strip markdown code fences (fallback)
2. `JSON.parse()`
3. Validate `narrative`, `choices` (non-empty), `isDead` required
4. Clamp stat deltas to valid ranges
5. Return typed `AIResponse` or throw → fallback response

---

## Model & Cost

| Use | Model | Notes |
|---|---|---|
| Game turns | `claude-sonnet-4-20250514` | Default; override via `ANTHROPIC_MODEL` env var |
| Summary compression | `claude-haiku-4-5-20251001` | Fast and cheap |

**Token budget per turn**: ~5,000–8,000 tokens total.
