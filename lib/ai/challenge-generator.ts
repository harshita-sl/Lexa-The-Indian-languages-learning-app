import { chatCompletion } from './llm';
import { getCachedContent, setCachedContent, generateInputHash } from './cache';
import { CHALLENGE_GENERATION_PROMPT } from './prompts/challenge-prompts';
import { ChallengeInput, GeneratedChallenge } from './types';
import { LANGUAGE_FALLBACKS } from './fallback-content';

/** Deterministic 32-bit string hash — rotates fallbacks per context/slot. */
export function hashIndex(text: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return mod > 0 ? Math.abs(h | 0) % mod : 0;
}

export async function generateChallenge(input: ChallengeInput): Promise<GeneratedChallenge> {
  const cacheKey = generateInputHash(input as unknown as Record<string, unknown>);
  const cached = await getCachedContent('challenge', cacheKey);

  if (cached) {
    console.log('Challenge served from cache');
    const c = cached as GeneratedChallenge;
    if (input.conceptId && !c.conceptId) c.conceptId = input.conceptId;
    return c;
  }

  try {
    const systemPrompt = CHALLENGE_GENERATION_PROMPT
      .replace('{language}', input.language)
      .replace('{challengeType}', input.challengeType)
      .replace('{topic}', input.topic)
      .replace('{difficulty}', input.difficulty)
      .replace('{vocabulary}', input.vocabulary?.join(', ') || 'general')
      .replace('{context}', input.context || 'general lesson')
      .replace('{userLevel}', input.userLevel || 'beginner');

    const userPrompt = `Generate a ${input.challengeType} challenge for ${input.language} on the topic "${input.topic}" at ${input.difficulty} level. Return JSON.`;

    const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
      temperature: 0.7,
      responseFormat: 'json',
    });

    const cleaned = response.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const challenge: GeneratedChallenge = JSON.parse(
      start >= 0 ? cleaned.slice(start, end + 1) : cleaned
    );
    if (input.conceptId) challenge.conceptId = input.conceptId;
    await setCachedContent(
      'challenge',
      cacheKey,
      challenge,
      input.language,
      input.topic,
      input.difficulty
    );
    return challenge;
  } catch (error) {
    console.warn(`AI Challenge generation fallback used for ${input.language}:`, error);
    const fb = getFallbackChallenge(input.language, input.challengeType, {
      seed: input.context ?? input.topic,
    });
    if (input.conceptId) fb.conceptId = input.conceptId;
    return fb;
  }
}

/**
 * Type- and context-aware fallback: prefers an item matching the requested
 * type, rotated deterministically by `seed` (context/topic/slot). Never the
 * old "always pool[0]" behavior that repeated one question everywhere.
 */
export function getFallbackChallenge(
  language: string,
  type: string,
  opts: { seed?: string; index?: number; exclude?: ReadonlySet<string> } = {}
): GeneratedChallenge {
  const pool = LANGUAGE_FALLBACKS[language.toLowerCase()] ?? LANGUAGE_FALLBACKS.hindi;
  const typed = pool.filter((c) => c.type === type);
  const candidates = typed.length > 0 ? typed : pool;

  const base = opts.index ?? hashIndex(opts.seed ?? '', candidates.length);
  // Probe forward from the seed offset; first question not in `exclude` wins.
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[(base + i) % candidates.length];
    if (!opts.exclude?.has(cand.question)) return { ...cand };
  }
  return { ...candidates[base % candidates.length] };
}

export async function generateMultipleChallenges(
  input: ChallengeInput,
  count: number = 5
): Promise<GeneratedChallenge[]> {
  const challenges: GeneratedChallenge[] = [];
  const typesSequence: ChallengeInput['challengeType'][] = ['SELECT', 'TRANSLATE', 'ASSIST', 'SELECT', 'ORDER'];
  const usedQuestions = new Set<string>();

  for (let i = 0; i < count; i++) {
    const targetType = typesSequence[i % typesSequence.length];
    try {
      const challengeInput: ChallengeInput = {
        ...input,
        challengeType: targetType,
        context: `${input.context || 'lesson'} - question_${i + 1}_var_${i}`,
      };
      const challenge = await generateChallenge(challengeInput);
      // Dedupe: a provider/fallback may echo the same item twice.
      if (usedQuestions.has(challenge.question)) {
        const alt = getFallbackChallenge(input.language, targetType, {
          index: i + 1,
          exclude: usedQuestions,
        });
        if (input.conceptId) alt.conceptId = input.conceptId;
        challenges.push(alt);
      } else {
        challenges.push(challenge);
      }
      usedQuestions.add(challenges[challenges.length - 1].question);
    } catch {
      const fallback = getFallbackChallenge(input.language, targetType, {
        index: i,
        exclude: usedQuestions,
      });
      if (input.conceptId) fallback.conceptId = input.conceptId;
      challenges.push(fallback);
      usedQuestions.add(fallback.question);
    }
  }

  // Pool smaller than count → unavoidable repeats at the tail; shuffle so
  // any repeated item isn't adjacent.
  return challenges;
}

export function getChallengeTypesForLevel(level: string): ChallengeInput['challengeType'][] {
  switch (level) {
    case 'beginner':
      return ['SELECT', 'MATCH', 'ASSIST'];
    case 'intermediate':
      return ['SELECT', 'ASSIST', 'TRANSLATE', 'ORDER'];
    case 'advanced':
      return ['TRANSLATE', 'CONVERSATION', 'SPEAK', 'LISTEN', 'ORDER'];
    default:
      return ['SELECT', 'ASSIST', 'TRANSLATE'];
  }
}
