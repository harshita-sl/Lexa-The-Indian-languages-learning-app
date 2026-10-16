'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Brain, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlacementItem {
  id: number;
  conceptId: string;
  skill: string;
  difficultyB: number;
  question: string;
  options: string[];
}

interface Answer {
  itemId: number;
  conceptId: string;
  skill: string;
  difficultyB: number;
  correct: boolean;
}

interface PlacementResult {
  done: true;
  level: 'beginner' | 'intermediate' | 'advanced';
  theta: number;
  passedConcepts: string[];
}

function PlacementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'Telugu';
  const courseId = parseInt(searchParams.get('courseId') || '1', 10);
  const selfLevel = searchParams.get('level') || 'beginner';

  const [current, setCurrent] = useState<PlacementItem | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (acc: Answer[]) => {
      const res = await fetch('/api/ai/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, courseId, selfLevel, answers: acc }),
      });
      return res.json();
    },
    [language, courseId, selfLevel]
  );

  useEffect(() => {
    let cancelled = false;
    submit([])
      .then((data) => {
        if (cancelled) return;
        if (data.done) setResult(data);
        else if (data.next) setCurrent(data.next);
        else setError('Placement unavailable');
      })
      .catch(() => !cancelled && setError('Failed to start placement'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [submit]);

  const handleAnswer = async (option: string) => {
    if (!current || selected !== null) return;
    setSelected(option);
    const correct = option === (current as PlacementItem & { answer?: string }).answer;
    const acc = [
      ...answers,
      {
        itemId: current.id,
        conceptId: current.conceptId,
        skill: current.skill,
        difficultyB: current.difficultyB,
        correct: Boolean(correct),
      },
    ];
    setAnswers(acc);
    setLoading(true);
    try {
      const data = await submit(acc);
      setTimeout(() => {
        if (data.done) {
          setResult(data);
        } else if (data.next) {
          setCurrent(data.next);
          setSelected(null);
        } else {
          setError('Placement ended unexpectedly');
        }
        setLoading(false);
      }, 700);
    } catch {
      setError('Failed to submit answer');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 flex-col gap-4 px-4">
        <p className="text-neutral-600 font-medium">{error}</p>
        <Button onClick={() => router.push('/learn')}>Skip to Learn</Button>
      </div>
    );
  }

  if (result) {
    const labels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">All set!</h1>
          <p className="text-neutral-600 mb-1">
            Your {language} level:{' '}
            <span className="font-extrabold text-indigo-600">{labels[result.level]}</span>
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            We seeded your learner model — your daily plan now starts where you actually are.
          </p>
          <Button
            onClick={() => router.push('/learn')}
            size="lg"
            className="w-full font-bold bg-green-500 hover:bg-green-600"
          >
            See my plan <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Preparing your {language} placement…</p>
        </div>
      </div>
    );
  }

  const answerKey = (current as PlacementItem & { answer?: string }).answer;
  const progress = Math.min(100, (answers.length / 8) * 100);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-amber-600" />
          <h1 className="text-xl font-extrabold text-neutral-800">{language} placement</h1>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <div className="mb-6 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-indigo-100 text-indigo-800">
              {current.skill}
            </span>
            <span className="text-xs text-neutral-400 font-semibold">Question {answers.length + 1}</span>
          </div>
          <p className="text-xl font-bold text-neutral-900 mb-8">{current.question}</p>

          <div className="space-y-3">
            {current.options.map((option) => {
              const isCorrect = answerKey === option;
              const isPicked = selected === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  disabled={selected !== null || loading}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left font-semibold transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-sky-500',
                    'disabled:cursor-not-allowed',
                    selected === null && 'border-neutral-200 bg-white hover:bg-neutral-50',
                    isPicked && isCorrect && 'border-green-500 bg-green-50',
                    isPicked && !isCorrect && 'border-red-500 bg-red-50',
                    selected !== null && !isPicked && isCorrect && 'border-green-500 bg-green-50',
                    selected !== null && !isPicked && !isCorrect && 'border-neutral-200 bg-white opacity-60'
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlacementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
        </div>
      }
    >
      <PlacementContent />
    </Suspense>
  );
}
