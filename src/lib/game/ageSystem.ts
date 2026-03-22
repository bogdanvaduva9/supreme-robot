import type { AgeBracket } from '../types/game';

export const AGE_BRACKETS: AgeBracket[] = [
  {
    name: 'Infancy',
    minAge: 0,
    maxAge: 2,
    choiceGuidelines: 'Sensory exploration, comfort, basic preferences, parental bonding. Choices represent instinctive behavior. Narrator uses third-person (parents perspective). Warm, tender tone.',
    complexityLevel: 'Very simple',
    minChoices: 2,
    maxChoices: 2,
    typicalTimeJump: { minMonths: 3, maxMonths: 6 },
  },
  {
    name: 'Early Childhood',
    minAge: 3,
    maxAge: 5,
    choiceGuidelines: 'Preschool, imagination, first friendships, family bonding, fears, play preferences, curiosity. Simple language reflecting child understanding. Second-person.',
    complexityLevel: 'Simple',
    minChoices: 2,
    maxChoices: 3,
    typicalTimeJump: { minMonths: 2, maxMonths: 6 },
  },
  {
    name: 'Childhood',
    minAge: 6,
    maxAge: 11,
    choiceGuidelines: 'School performance, friendships and social hierarchy, hobbies/sports, sibling dynamics, bullying, discovering interests, first moral dilemmas. Growing vocabulary.',
    complexityLevel: 'Moderate',
    minChoices: 3,
    maxChoices: 3,
    typicalTimeJump: { minMonths: 1, maxMonths: 4 },
  },
  {
    name: 'Teenager',
    minAge: 12,
    maxAge: 17,
    choiceGuidelines: 'Identity formation, peer pressure, first romantic interests, academic path, rebellion vs conformity, talents/passions, part-time jobs, social media, body image, family tension. Emotionally rich narrative.',
    complexityLevel: 'Medium-high',
    minChoices: 3,
    maxChoices: 4,
    typicalTimeJump: { minMonths: 1, maxMonths: 3 },
  },
  {
    name: 'Young Adult',
    minAge: 18,
    maxAge: 25,
    choiceGuidelines: 'University/trade school/military, leaving home, financial independence, career starts, serious relationships, identity consolidation, travel, existential questions. Long-term consequences.',
    complexityLevel: 'High',
    minChoices: 3,
    maxChoices: 4,
    typicalTimeJump: { minMonths: 2, maxMonths: 6 },
  },
  {
    name: 'Adulthood',
    minAge: 26,
    maxAge: 40,
    choiceGuidelines: 'Career advancement, marriage, children, mortgages, career changes, work-life balance, health habits, midlife questioning. Choices involve tradeoffs between career, family, and personal fulfillment.',
    complexityLevel: 'High',
    minChoices: 3,
    maxChoices: 4,
    typicalTimeJump: { minMonths: 3, maxMonths: 12 },
  },
  {
    name: 'Middle Age',
    minAge: 41,
    maxAge: 60,
    choiceGuidelines: 'Career peak or burnout, children growing up, aging parents, health scares, divorce possibility, reinvention, mentorship, legacy thinking. Often no good option — all involve tradeoffs.',
    complexityLevel: 'High',
    minChoices: 3,
    maxChoices: 4,
    typicalTimeJump: { minMonths: 6, maxMonths: 18 },
  },
  {
    name: 'Senior',
    minAge: 61,
    maxAge: 120,
    choiceGuidelines: 'Retirement, grandchildren, health management, legacy, wisdom, loss of friends/spouse, reflection, bucket list, downsizing, meaning-making. Quality-of-life and legacy focus. Contemplative tone.',
    complexityLevel: 'Medium',
    minChoices: 2,
    maxChoices: 3,
    typicalTimeJump: { minMonths: 6, maxMonths: 24 },
  },
];

export function getBracketForAge(age: number): AgeBracket {
  // Use Math.floor so fractional ages (e.g. 17.5) don't fall through
  // the gap between brackets defined in whole-year boundaries.
  const flooredAge = Math.floor(age);
  return (
    AGE_BRACKETS.find((b) => flooredAge >= b.minAge && flooredAge <= b.maxAge) ??
    AGE_BRACKETS[AGE_BRACKETS.length - 1]
  );
}
