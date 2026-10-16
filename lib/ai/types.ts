export interface ChallengeInput {
  language: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  challengeType: 'SELECT' | 'ASSIST' | 'TRANSLATE' | 'SPEAK' | 'LISTEN' | 'CONVERSATION' | 'MATCH' | 'ORDER';
  vocabulary?: string[];
  context?: string;
  userLevel?: string;
  /** Knowledge-graph concept this item exercises — feeds the learner model. */
  conceptId?: string;
}

export interface ChallengeOption {
  text: string;
  correct: boolean;
  imagePrompt?: string | null;
  audioText?: string | null;
}

export interface GeneratedChallenge {
  question: string;
  type: ChallengeInput['challengeType'];
  options: ChallengeOption[];
  correctAnswer: string;
  explanation: string;
  hints: string[];
  difficulty: number;
  /** Knowledge-graph concept this item exercises. */
  conceptId?: string;
}

export interface TutorPersona {
  name: string;
  personality: string;
  systemPrompt: string;
  language: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface UserPreferences {
  userId: string;
  learningStyle: 'visual' | 'audio' | 'conversational' | 'balanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  dailyGoalMinutes: number;
  preferredTopics: string[];
  nativeLanguage: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  assessmentCompleted: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'translation' | 'listening' | 'speaking';
  options?: string[];
  correctAnswer: string;
  skill: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  difficulty: number;
}

export interface AssessmentResult {
  level: 'beginner' | 'intermediate' | 'advanced';
  scores: Record<string, number>;
  recommendedTopics: string[];
  weakAreas: string[];
}

export interface CachedContent {
  id: number;
  contentType: string;
  inputHash: string;
  content: unknown;
  language: string;
  topic: string | null;
  difficulty: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}