# Age-Based Choice System

This document defines how the game's choices, narrative tone, and pacing evolve across the character's lifespan. These bracket definitions are loaded by `src/lib/game/ageSystem.ts` and injected into the AI system prompt by `src/lib/ai/prompts.ts`.

---

## Bracket Overview

| Bracket | Ages | Choices | Time Jump | Narrator POV |
|---|---|---|---|---|
| Infancy | 0-2 | 2 | 3-6 months | Third-person (parents' perspective) |
| Early Childhood | 3-5 | 2-3 | 2-6 months | Second-person, simple language |
| Childhood | 6-11 | 3 | 1-4 months | Second-person, growing vocabulary |
| Teenager | 12-17 | 3-4 | 1-3 months | Second-person, emotionally rich |
| Young Adult | 18-25 | 3-4 | 2-6 months | Second-person, introspective |
| Adulthood | 26-40 | 3-4 | 3-12 months | Second-person, pragmatic |
| Middle Age | 41-60 | 3-4 | 6-18 months | Second-person, reflective |
| Senior | 60+ | 2-3 | 6-24 months | Second-person, contemplative |

---

## Detailed Bracket Definitions

### Infancy (0-2)

**Themes**: Sensory exploration, comfort, basic preferences, parental bonding, first words, first steps.

**Choice complexity**: Very simple. Binary. The character cannot reason — choices represent instinctive behavior or preferences.

**Example choices**:
- "Reach for the red ball" vs "Reach for the blue blanket"
- "Cry for attention" vs "Babble happily at the mobile"
- "Cling to mom" vs "Reach out to the stranger smiling at you"

**Narrative tone**: Third-person. The narrator describes the baby's world from the outside, focusing on what parents and family observe. Warm, tender, observational.

**Key events**: Birth, first smile, first words, first steps, meeting family members, early personality signs.

**Stats affected**: Mostly Health (nutrition, sleep), Happiness (comfort, attention). Other stats rarely change.

**Relationships**: Parents and siblings are the primary relationships. Extended family may appear.

---

### Early Childhood (3-5)

**Themes**: Preschool, imagination, first friendships, family bonding, fears (dark, monsters), play preferences, language development, curiosity.

**Choice complexity**: Simple. 2-3 options. Choices reflect a child's limited but growing understanding.

**Example choices**:
- "Play with the other kids at preschool" vs "Stay close to the teacher" vs "Play alone in the sandbox"
- "Share your toy with the crying child" vs "Keep it — it's yours"
- "Tell mom about the scary dream" vs "Try to be brave and go back to sleep"

**Narrative tone**: Second-person, simple language. Short sentences. The world is big and full of wonder. Emotions are strong but fleeting.

**Key events**: Starting preschool, making first friend, family events (new sibling, moving), discovering interests, holiday memories.

**Stats affected**: Social (friendships, sharing), Happiness (play, attention), Intelligence (curiosity, language).

---

### Childhood (6-11)

**Themes**: School performance, friendships and social hierarchy, hobbies/sports, sibling dynamics, bullying (giving or receiving), discovering interests, first moral dilemmas, family vacations, pets.

**Choice complexity**: Moderate. 3 options. Choices start having clearer consequences that the character can understand.

**Example choices**:
- "Study hard for the math test" vs "Play outside with friends instead" vs "Help your younger sibling with their homework"
- "Stand up to the bully" vs "Tell a teacher" vs "Avoid the situation"
- "Join the soccer team" vs "Sign up for piano lessons" vs "Spend time reading at the library"

**Narrative tone**: Second-person with growing vocabulary. The character is developing a sense of self. School and friends become the center of the world.

**Key events**: Starting school, academic achievements/struggles, sports teams, best friends, first sleepover, family challenges, discovering a passion.

**Stats affected**: Intelligence (school), Social (friendships, group activities), Health (sports, nutrition), Happiness (achievements, belonging).

---

### Teenager (12-17)

**Themes**: Identity formation, peer pressure, first romantic interests, academic path (college prep vs vocational), rebellion vs conformity, discovering talents/passions, part-time jobs, social media, body image, family tension, driver's license, parties.

**Choice complexity**: Medium-high. 3-4 options. Choices have social and emotional weight. Some choices have long-term consequences (academic track, legal trouble).

**Example choices**:
- "Ask Elena to the school dance" vs "Go with your friend group" vs "Skip the dance and work on your project" vs "Sneak out to the older kids' party"
- "Study for the SAT" vs "Get a part-time job" vs "Focus on your band"
- "Tell your parents the truth about the party" vs "Lie and hope they don't find out"

**Narrative tone**: Emotionally rich second-person. Everything feels intense and consequential. Peer opinions matter enormously. Internal monologue becomes important.

**Key events**: High school, first crush/relationship, driver's license, prom, college applications, first job, family conflicts, identity crises, peer group changes.

**Stats affected**: All stats are actively in play. This is the most dynamic bracket.

**Relationships**: Friend groups shift. Romantic relationships begin. Teacher/mentor figures appear. Parent relationships are tested.

---

### Young Adult (18-25)

**Themes**: University/trade school/military/gap year, leaving home, financial independence, career starts, serious relationships, identity consolidation, travel, existential questions, roommates, first apartment.

**Choice complexity**: High. 3-4 options with long-term consequences. Choices shape the trajectory of adult life.

**Example choices**:
- "Accept the university scholarship in another city" vs "Stay home and start working" vs "Take a gap year to travel" vs "Start your own small business"
- "Move in with your partner" vs "Get your own place" vs "Stay with roommates"
- "Accept the safe corporate job" vs "Pursue your passion with less pay"

**Narrative tone**: Introspective second-person. The character is finding their place in the world. Excitement mixed with anxiety. Freedom is exhilarating and terrifying.

**Key events**: Leaving home, college/career start, first serious relationship, financial struggles, graduation, first "real" job, travel, quarter-life crisis.

**Stats affected**: Wealth becomes active (income, expenses). Intelligence (education). Social (new networks). All others evolve.

**Relationships**: College friends, romantic partners, professional connections. Family relationships evolve (adult-to-adult). Old friendships are tested by distance.

---

### Adulthood (26-40)

**Themes**: Career advancement, marriage, children, mortgages, career changes, friendship maintenance, work-life balance, health habits, midlife questioning, parenting challenges, financial planning.

**Choice complexity**: High. 3-4 options with layered consequences. Many choices involve tradeoffs (career vs family, safety vs ambition).

**Example choices**:
- "Accept the promotion (longer hours, more money)" vs "Stay in current role (more family time)" vs "Quit and pursue your passion project"
- "Have a child" vs "Wait a few more years" vs "Decide against having children"
- "Confront your partner about the issue" vs "Let it go to keep the peace"

**Narrative tone**: Pragmatic second-person. The character is established but still evolving. Responsibilities weigh more. Joy comes from different places than youth.

**Key events**: Marriage/partnership, children, promotions, buying a home, career pivots, health wake-up calls, losing touch with old friends, finding new purpose.

**Stats affected**: Wealth (career income, family expenses). Health (habits catching up). Happiness (satisfaction vs stress).

**Relationships**: Spouse/partner is central. Children become NPCs. Work relationships gain importance. Parent relationships shift as parents age.

---

### Middle Age (41-60)

**Themes**: Career peak or burnout, children growing up, aging parents, health scares, divorce possibility, reinvention, mentorship, legacy thinking, financial security, empty nest.

**Choice complexity**: High. Often no "good" option — all involve tradeoffs. Choices carry the weight of accumulated consequences.

**Example choices**:
- "Take the executive role overseas" vs "Stay for your aging mother" vs "Retire early and travel"
- "Try to save the marriage" vs "Accept it's over and separate"
- "Get the medical procedure" vs "Try alternative treatments" vs "Ignore it and hope for the best"

**Narrative tone**: Reflective second-person. The character looks backward and forward. Wisdom mixes with regret. Moments of clarity and confusion.

**Key events**: Children leaving home, career peak, health scares, parents' decline/death, divorce/renewal, grandchildren, midlife crisis or reinvention, retirement planning.

**Stats affected**: Health declines naturally. Wealth peaks. Happiness is volatile. Social may shrink (fewer but deeper connections).

**Relationships**: Children become adults. Parents may die. Long friendships deepen or fade. New relationships are rarer but meaningful.

---

### Senior (60+)

**Themes**: Retirement, grandchildren, health management, legacy, wisdom, loss of friends/spouse, reflection, bucket list, downsizing, meaning-making, mortality awareness.

**Choice complexity**: Medium. Choices shift from building to preserving and reflecting. Quality-of-life focus.

**Example choices**:
- "Move to a retirement community" vs "Stay in the family home" vs "Move closer to your children"
- "Write your memoirs" vs "Start volunteering" vs "Travel while you still can"
- "Accept the diagnosis gracefully" vs "Fight it with everything you have"

**Narrative tone**: Contemplative second-person. Time moves faster. Small moments matter more. The narrative is tinged with nostalgia and acceptance.

**Key events**: Retirement, grandchildren, losing a spouse, health decline, legacy projects, reconciliation with estranged relationships, final adventures, acceptance of mortality.

**Stats affected**: Health declines steadily. Wealth may be stable or declining. Happiness depends on relationships and purpose. Social shrinks.

**Death probability**: Increases each turn. The AI is told the probability and can trigger death narratively when appropriate. Death should always be handled with dignity and emotional resonance.

---

## Implementation Notes

### ageSystem.ts Structure

```typescript
export const AGE_BRACKETS: AgeBracket[] = [
  {
    name: 'Infancy',
    minAge: 0,
    maxAge: 2,
    choiceGuidelines: '...',
    complexityLevel: 'Very simple',
    minChoices: 2,
    maxChoices: 2,
    typicalTimeJump: { minMonths: 3, maxMonths: 6 },
  },
  // ... one entry per bracket
];

export function getBracketForAge(age: number): AgeBracket {
  return AGE_BRACKETS.find(b => age >= b.minAge && age <= b.maxAge)
    ?? AGE_BRACKETS[AGE_BRACKETS.length - 1];
}
```

### How Brackets Are Used

1. On each turn, `engine.ts` calls `getBracketForAge(character.currentAge)`
2. The bracket's `choiceGuidelines` and metadata are injected into the system prompt by `prompts.ts`
3. The AI uses these guidelines to generate age-appropriate narrative and choices
4. The `typicalTimeJump` guides the AI but does not strictly enforce — the AI decides actual time advancement

### Age Calculation

Age is stored as a float (e.g., 14.5 = 14 years, 6 months). When `timeAdvancement` is applied:
```
newAge = currentAge + years + (months / 12)
currentYear = birthYear + Math.floor(newAge)
```
