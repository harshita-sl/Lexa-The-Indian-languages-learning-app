import { chatCompletion } from './llm';
import { getCachedContent, setCachedContent, generateInputHash } from './cache';
import { ASSESSMENT_PROMPT, LEVEL_EVALUATION_PROMPT } from './prompts/challenge-prompts';
import { AssessmentQuestion, AssessmentResult } from './types';

export async function generateAssessmentQuestions(language: string): Promise<AssessmentQuestion[]> {
  const cacheKey = generateInputHash({ language, type: 'assessment' });
  const cached = await getCachedContent('assessment_questions', cacheKey);
  
  if (cached) return cached as AssessmentQuestion[];

  const systemPrompt = ASSESSMENT_PROMPT.replace('{language}', language);
  const userPrompt = `Create 5 assessment questions for ${language} proficiency evaluation.`;

  const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
    temperature: 0.7,
    responseFormat: 'json',
  });

  let result: { questions: AssessmentQuestion[] };
  try {
    result = JSON.parse(response);
  } catch {
    console.error('Failed to parse assessment JSON:', response);
    throw new Error('Invalid assessment format from AI');
  }

  await setCachedContent('assessment_questions', cacheKey, result.questions, language);
  return result.questions;
}

export async function evaluateAssessment(
  language: string,
  answers: Array<{ questionId: string; userAnswer: string; correctAnswer: string; skill: string; difficulty: number }>
): Promise<AssessmentResult> {
  const cacheKey = generateInputHash({ language, answers, type: 'evaluation' });
  const cached = await getCachedContent('assessment_evaluation', cacheKey);
  
  if (cached) return cached as AssessmentResult;

  const answersText = answers.map(a => 
    `Q: ${a.questionId} | User: ${a.userAnswer} | Correct: ${a.correctAnswer} | Skill: ${a.skill} | Diff: ${a.difficulty}`
  ).join('\n');

  const systemPrompt = LEVEL_EVALUATION_PROMPT.replace('{language}', language);
  const userPrompt = `Evaluate these answers:\n${answersText}`;

  const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
    temperature: 0.3,
    responseFormat: 'json',
  });

  let result: AssessmentResult;
  try {
    result = JSON.parse(response);
  } catch {
    console.error('Failed to parse evaluation JSON:', response);
    const correctCount = answers.filter(a => a.userAnswer.toLowerCase().trim() === a.correctAnswer.toLowerCase().trim()).length;
    const percentage = correctCount / answers.length;
    
    result = {
      level: percentage > 0.7 ? 'advanced' : percentage > 0.4 ? 'intermediate' : 'beginner',
      scores: { vocabulary: percentage * 100, grammar: percentage * 100, reading: percentage * 100 },
      recommendedTopics: ['basic vocabulary', 'common phrases'],
      weakAreas: ['grammar', 'vocabulary'],
    };
  }

  await setCachedContent('assessment_evaluation', cacheKey, result, language);
  return result;
}

export function calculateLevelFromScore(percentage: number): 'beginner' | 'intermediate' | 'advanced' {
  if (percentage >= 0.7) return 'advanced';
  if (percentage >= 0.4) return 'intermediate';
  return 'beginner';
}