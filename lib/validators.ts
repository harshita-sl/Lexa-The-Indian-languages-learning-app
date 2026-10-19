import { z } from 'zod';

export const skillEnum = z.enum([
  'vocabulary',
  'script',
  'listening',
  'speaking',
  'grammar',
  'conversation',
]);

export const attemptSchema = z.object({
  conceptId: z.string().min(1).max(120),
  conceptType: z
    .enum(['vocabulary', 'grammar_rule', 'honorific', 'script', 'syntax'])
    .optional(),
  itemKey: z.string().max(200).optional(),
  itemType: z.enum(['word', 'phrase', 'slang']).optional(),
  skill: skillEnum.optional(),
  correct: z.boolean(),
  userAnswer: z.string().max(2000),
  expectedAnswer: z.string().max(2000).optional(),
  challengeId: z.string().max(80).optional(),
  courseId: z.number().int().positive().max(100).optional().default(1),
  latencyMs: z.number().int().min(0).max(600_000).optional().default(0),
  hintsUsed: z.number().int().min(0).max(20).optional().default(0),
  pronunciationScore: z.number().min(0).max(1).optional(),
  source: z.enum(['lesson', 'practice', 'chat', 'placement']).default('lesson'),
  taskReason: z.string().max(500).optional(),
  language: z.string().max(40).optional(),
  targetRegister: z.enum(['intimate', 'informal', 'formal', 'honorific']).optional(),
});
export type AttemptBody = z.infer<typeof attemptSchema>;

export const prefsSchema = z.object({
  learningStyle: z
    .enum(['visual', 'audio', 'speaking', 'conversational', 'balanced'])
    .optional(),
  difficulty: z.string().max(40).optional(),
  dailyGoalMinutes: z.number().int().min(3).max(120).optional(),
  preferredTopics: z.array(z.string().max(60)).max(20).optional(),
  nativeLanguage: z.string().max(60).optional(),
  targetLanguage: z.string().max(60).optional(),
  goal: z.enum(['travel', 'family', 'work', 'culture']).optional(),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  targetRegister: z.string().max(40).optional(),
  transliterationMode: z.enum(['native', 'roman', 'both']).optional(),
  assessmentCompleted: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const chatSchema = z.object({
  language: z.string().min(2).max(40),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  scenario: z.string().max(60).optional(),
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(20)
    .default([]),
  courseId: z.number().int().positive().optional().default(1),
});
export type ChatBody = z.infer<typeof chatSchema>;

export const placementAnswerSchema = z.object({
  sessionId: z.string().max(80),
  itemId: z.number().int(),
  conceptId: z.string().max(120),
  skill: skillEnum,
  difficultyB: z.number().min(-1000).max(3000),
  correct: z.boolean(),
  courseId: z.number().int().positive().optional().default(1),
});
