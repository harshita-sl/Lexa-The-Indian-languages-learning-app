'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Challenge } from '@/components/challenge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Heart, Star } from 'lucide-react';

interface ChallengeData {
  question: string;
  type: 'SELECT' | 'ASSIST' | 'TRANSLATE' | 'MATCH' | 'ORDER' | 'SPEAK' | 'LISTEN' | 'CONVERSATION';
  options: Array<{
    text: string;
    correct: boolean;
    imagePrompt?: string | null;
    audioText?: string | null;
  }>;
  correctAnswer: string;
  explanation: string;
  hints: string[];
  difficulty: number;
  conceptId?: string;
}

interface LessonData {
  id: number;
  title: string;
  unitId: number;
  order: number;
  challenges: ChallengeData[];
  currentChallengeIndex: number;
  hearts: number;
  points: number;
  xp: number;
}

function LessonContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const challengeShownAt = useRef<number>(Date.now());

  const fetchUserLevel = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/user-preferences');
      const data = await res.json();
      if (data.currentLevel) {
        setUserLevel(data.currentLevel);
      }
    } catch (error) {
      console.error('Failed to load user level:', error);
    }
  }, []);

  const fetchLesson = useCallback(async () => {
    await fetchUserLevel();
    setLoading(true);
    try {
      const targetLang = searchParams.get('language') || 'Telugu';
      const targetTopic = searchParams.get('topic') || 'Basics';
      const targetDiff = searchParams.get('difficulty') || userLevel;
      const conceptId = searchParams.get('conceptId') || undefined;

      const res = await fetch(`/api/ai/generate-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: targetLang,
          topic: targetTopic,
          difficulty: targetDiff,
          userLevel: userLevel,
          conceptId,
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.challenges && data.challenges.length > 0) {
        setLesson({
          id: parseInt(lessonId) || 1,
          title: `${targetLang} - ${targetTopic}`,
          unitId: 1,
          order: 1,
          challenges: data.challenges,
          currentChallengeIndex: 0,
          hearts: 5,
          points: 0,
          xp: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
    } finally {
      setLoading(false);
    }
  }, [lessonId, searchParams, fetchUserLevel, userLevel]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 flex-col gap-4">
        <p className="text-neutral-600 font-medium">Failed to load lesson</p>
        <Button onClick={() => router.push('/learn')}>Return to Learn</Button>
      </div>
    );
  }

  const currentChallenge = lesson.challenges[lesson.currentChallengeIndex];
  const progress = ((lesson.currentChallengeIndex + 1) / lesson.challenges.length) * 100;
  const isLastChallenge = lesson.currentChallengeIndex === lesson.challenges.length - 1;

  const handleAnswer = (correct: boolean, selectedAnswer?: string) => {
    if (answerSubmitted) return;

    setAnswerSubmitted(true);
    setShowExplanation(true);

    // Canonical write path: feed the learner model (auto-derived FSRS rating).
    const conceptId =
      currentChallenge?.conceptId ?? searchParams.get('conceptId') ?? undefined;
    if (conceptId) {
      const latencyMs = Date.now() - challengeShownAt.current;
      const lang = searchParams.get('language') || 'Telugu';
      fetch('/api/ai/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId,
          correct,
          userAnswer: selectedAnswer ?? '',
          expectedAnswer: currentChallenge?.correctAnswer,
          challengeId: `lesson_${lessonId}_${lesson.currentChallengeIndex}`,
          latencyMs,
          source: 'lesson',
          language: lang,
        }),
      }).catch((e) => console.warn('attempt log failed:', e));
    }

    setLesson(prev => {
      if (!prev) return prev;
      const newHearts = correct ? prev.hearts : Math.max(0, prev.hearts - 1);
      const newPoints = correct ? prev.points + 10 : prev.points;
      const newXp = correct ? prev.xp + 5 : prev.xp;

      // Adaptive path (concept-tagged) never ejects — mistakes feed the model.
      const adaptive = Boolean(
        currentChallenge?.conceptId ?? searchParams.get('conceptId')
      );
      if (newHearts === 0 && !adaptive) {
        setTimeout(() => router.push('/learn'), 2000);
      }
      
      return {
        ...prev,
        hearts: newHearts,
        points: newPoints,
        xp: newXp,
      };
    });
  };

  const handleNext = () => {
    if (isLastChallenge) {
      setLessonComplete(true);
      setTimeout(() => {
        router.push('/learn');
      }, 2000);
      return;
    }

    setLesson(prev => prev ? {
      ...prev,
      currentChallengeIndex: prev.currentChallengeIndex + 1,
    } : null);

    setAnswerSubmitted(false);
    setShowExplanation(false);
    challengeShownAt.current = Date.now();
  };

  if (lessonComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Lesson Complete!</h1>
          <p className="text-neutral-600 mb-6 font-medium">You earned {lesson.points} points and {lesson.xp} XP</p>
          <Button onClick={() => router.push('/learn')} size="lg" className="w-full font-bold">
            Continue Learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/learn')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-neutral-900 truncate">{lesson.title}</h1>
            <div className="h-2 bg-neutral-200 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-red-500 font-bold">
              <Heart className="w-5 h-5 fill-current" />
              <span>{lesson.hearts}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-5 h-5 fill-current" />
              <span>{lesson.points}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-neutral-600 mb-2 font-medium">
            <span>Challenge {lesson.currentChallengeIndex + 1} of {lesson.challenges.length}</span>
            <span className="capitalize text-sky-600 font-semibold">{currentChallenge.type}</span>
          </div>
        </div>

        <Challenge
          key={lesson.currentChallengeIndex}
          {...currentChallenge}
          onAnswer={handleAnswer}
          disabled={answerSubmitted}
          type={currentChallenge.type as 'SELECT' | 'ASSIST' | 'TRANSLATE' | 'MATCH' | 'ORDER'}
        />

        {showExplanation && (
          <div className="mt-6 space-y-4">
            <Button
              onClick={handleNext}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              size="lg"
            >
              {isLastChallenge ? 'Finish Lesson' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    }>
      <LessonContent />
    </Suspense>
  );
}