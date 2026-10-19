'use client';

import { useState } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChallengeProps } from './ChallengeBase';
import { speakWithProvider } from '@/lib/ai/speech/tts';
import { scorePronunciation } from '@/lib/ai/speech/similarity';
import { Button } from '@/components/ui/button';

/**
 * LISTEN — hear the phrase, pick/type what you heard. Uses the provider
 * chain (Gnani → Web Speech) for natural native audio.
 */
export function ListenChallenge({
  question,
  options,
  correctAnswer,
  explanation,
  onAnswer,
  disabled = false,
  language = 'Telugu',
}: ChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hasOptions = options.length > 0;

  const play = () => void speakWithProvider(correctAnswer, language);

  const pick = (i: number) => {
    if (disabled || done) return;
    setSelected(i);
    setWasCorrect(options[i].correct);
    setDone(true);
    onAnswer(options[i].correct, options[i].text);
  };

  const grade = () => {
    const result = scorePronunciation(typed.trim(), correctAnswer, language);
    const correct = result.verdict !== 'miss';
    setWasCorrect(correct);
    setDone(true);
    onAnswer(correct, typed.trim(), result.score);
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <p className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">
          Listen carefully
        </p>
        <p className="text-xl font-bold text-neutral-800">{question}</p>
        <button
          onClick={play}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500 text-white hover:bg-violet-600 font-semibold transition-colors shadow-md"
        >
          <Volume2 className="w-5 h-5" /> Play phrase
        </button>
      </div>

      {hasOptions ? (
        <div className="space-y-3" role="radiogroup" aria-label="What did you hear?">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected === i}
              disabled={disabled || done}
              onClick={() => pick(i)}
              className={cn(
                'w-full p-4 rounded-2xl border-2 text-left font-semibold transition-all',
                'focus:outline-none focus:ring-2 focus:ring-violet-500',
                !done && 'border-neutral-200 bg-white hover:bg-neutral-50',
                done && i === selected && opt.correct && 'border-green-500 bg-green-50',
                done && i === selected && !opt.correct && 'border-red-500 bg-red-50',
                done && i !== selected && opt.correct && 'border-green-500 bg-green-50',
                done && i !== selected && !opt.correct && 'border-neutral-200 bg-white'
              )}
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        !done && (
          <div className="flex gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type what you heard…"
              className="flex-1 p-3 rounded-xl border-2 border-neutral-200 focus:border-violet-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && typed.trim() && grade()}
            />
            <Button onClick={grade} disabled={!typed.trim()}>
              Check
            </Button>
          </div>
        )
      )}

      {done && (
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-md">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white',
                wasCorrect ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {wasCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-neutral-900">
                {wasCorrect ? 'Correct!' : 'Not quite'}
              </p>
              {!wasCorrect && (
                <p className="text-sm text-neutral-600 mt-1">
                  The phrase was: <span className="font-semibold">{correctAnswer}</span>
                </p>
              )}
              <p className="text-sm text-neutral-600 mt-1">{explanation}</p>
              <button
                onClick={play}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" /> Hear it again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
