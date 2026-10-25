'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DueReviewItem } from '@/app/(main)/practice/page';

type Rating = 'again' | 'hard' | 'good' | 'easy';

const RATINGS: { id: Rating; label: string; className: string }[] = [
  { id: 'again', label: 'Forgot', className: 'bg-red-500 hover:bg-red-600' },
  { id: 'hard', label: 'Hard', className: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'good', label: 'Good', className: 'bg-sky-500 hover:bg-sky-600' },
  { id: 'easy', label: 'Easy', className: 'bg-green-500 hover:bg-green-600' },
];

interface BankItem {
  id: number | string;
  conceptId: string;
  skill?: string;
  type?: string;
  difficultyB?: number;
  question?: string;
  options?: { text: string; correct: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  hints?: string[];
}

export function PracticeSession({
  items,
  language,
  courseId,
}: {
  items: DueReviewItem[];
  language: string;
  courseId: number;
}) {
  const [queue] = useState(items);
  const [index, setIndex] = useState(0);
  const [item, setItem] = useState<BankItem | null>(null);
  const [itemFailed, setItemFailed] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const shownAt = useRef(Date.now());

  const current = queue[index];

  const loadItem = useCallback(async () => {
    if (!current) return;
    setLoadingItem(true);
    setItem(null);
    setItemFailed(false);
    setSelected(null);
    shownAt.current = Date.now();
    try {
      const res = await fetch(
        `/api/ai/items?conceptId=${encodeURIComponent(current.conceptId)}&language=${encodeURIComponent(language)}&courseId=${courseId}`
      );
      const data = await res.json();
      if (data.item?.options?.length) {
        // Authored content puts the correct option first — shuffle so the
        // position carries no signal.
        const shuffledOpts = [...data.item.options];
        for (let i = shuffledOpts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOpts[i], shuffledOpts[j]] = [shuffledOpts[j], shuffledOpts[i]];
        }
        setItem({ ...data.item, options: shuffledOpts });
      } else {
        setItemFailed(true);
      }
    } catch {
      setItemFailed(true);
    } finally {
      setLoadingItem(false);
    }
  }, [current, language, courseId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const submitRating = async (rating: Rating) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/ai/fsrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: current.conceptId,
          conceptType: current.conceptType,
          rating,
          courseId: current.courseId,
        }),
      });
    } catch (e) {
      console.error('Failed to record review:', e);
    } finally {
      setSubmitting(false);
      setIndex((i) => i + 1);
    }
  };

  const submitAnswer = async (optionIndex: number) => {
    if (submitting || selected !== null || !item?.options) return;
    setSelected(optionIndex);
    const correct = Boolean(item.options[optionIndex]?.correct);
    const latencyMs = Date.now() - shownAt.current;
    try {
      await fetch('/api/ai/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: item.conceptId,
          itemKey: String(item.id),
          itemType: 'word',
          skill: item.skill,
          correct,
          userAnswer: item.options[optionIndex]?.text ?? '',
          expectedAnswer: item.correctAnswer,
          challengeId: `practice_${item.id}`,
          courseId,
          latencyMs,
          source: 'practice',
          taskReason: 'Due review',
          language,
        }),
      });
    } catch (e) {
      console.warn('attempt log failed:', e);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="p-8 rounded-2xl border-2 border-neutral-200 bg-white text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-neutral-800">All caught up!</p>
        <p className="text-sm text-neutral-500 mt-1">
          No {language} reviews are due. Finish a lesson to add concepts to your review queue.
        </p>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="p-8 rounded-2xl border-2 border-neutral-200 bg-white text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-neutral-800">Session complete</p>
        <p className="text-sm text-neutral-500 mt-1">
          You reviewed {queue.length} concept{queue.length === 1 ? '' : 's'} — the model updated your schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border-2 border-neutral-200 bg-white">
      <div className="flex justify-between text-xs text-neutral-500 font-semibold mb-4">
        <span>Review {index + 1} of {queue.length}</span>
        <span className="uppercase tracking-wide">{current.conceptType}</span>
      </div>

      <h2 className="text-xl font-extrabold text-neutral-800">{current.label}</h2>
      <p className="text-sm text-neutral-500 mt-1 mb-2">{current.description}</p>
      <p className="text-xs font-semibold text-red-500 mb-6">
        Current recall estimate: {Math.round(current.retrievability * 100)}%
      </p>

      {loadingItem && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Real item: answer the question — rating is auto-derived from correctness+latency */}
      {item && !loadingItem && (
        <div className="space-y-3">
          <p className="text-lg font-bold text-neutral-800">{item.question}</p>
          {item.options!.map((opt, i) => {
            const isPicked = selected === i;
            const showState = selected !== null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => submitAnswer(i)}
                disabled={submitting || showState}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left font-semibold transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed',
                  !showState && 'border-neutral-200 bg-white hover:bg-neutral-50',
                  showState && isPicked && opt.correct && 'border-green-500 bg-green-50',
                  showState && isPicked && !opt.correct && 'border-red-500 bg-red-50',
                  showState && !isPicked && opt.correct && 'border-green-500 bg-green-50',
                  showState && !isPicked && !opt.correct && 'border-neutral-200 bg-white opacity-60'
                )}
              >
                <span className="flex items-center gap-2">
                  {showState && isPicked && (opt.correct ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  ))}
                  {opt.text}
                </span>
              </button>
            );
          })}
          {selected !== null && (
            <div className="pt-2">
              {item.explanation && (
                <p className="text-sm text-neutral-600 mb-3">{item.explanation}</p>
              )}
              <Button
                onClick={() => setIndex((i) => i + 1)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Fallback: no item available → self-rating (still updates FSRS) */}
      {itemFailed && !loadingItem && (
        <>
          <p className="text-sm font-semibold text-neutral-600 mb-3">
            How well did you remember this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <Button
                key={r.id}
                onClick={() => submitRating(r.id)}
                disabled={submitting}
                className={`${r.className} text-white font-bold`}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
