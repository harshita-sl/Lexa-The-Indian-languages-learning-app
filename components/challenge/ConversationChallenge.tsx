'use client';

import { useState } from 'react';
import { MessageCircle, Check, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChallengeProps } from './ChallengeBase';
import { createBestRecognizer, isSTTSupported, Recognizer } from '@/lib/ai/speech/stt';
import { scorePronunciation } from '@/lib/ai/speech/similarity';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRef } from 'react';

/**
 * CONVERSATION — a scenario prompt; learner replies in the target language
 * (typed or spoken). Similarity-graded against the expected response, with
 * a link into /chat for open-ended practice.
 */
export function ConversationChallenge({
  question,
  correctAnswer,
  explanation,
  hints,
  onAnswer,
  disabled = false,
  language = 'Telugu',
}: ChallengeProps) {
  const [reply, setReply] = useState('');
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<'pass' | 'close' | 'miss' | null>(null);
  const recRef = useRef<Recognizer | null>(null);

  const grade = (text: string) => {
    const result = scorePronunciation(text, correctAnswer, language);
    setScore(result.score);
    setVerdict(result.verdict);
    setDone(true);
    onAnswer(result.verdict !== 'miss', text, result.score);
  };

  const toggleMic = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = createBestRecognizer(language, {
      onResult: (t) => {
        setReply(t);
        grade(t);
      },
      onEnd: () => setRecording(false),
      onError: () => setRecording(false),
    });
    if (!rec) return;
    recRef.current = rec;
    setRecording(true);
    rec.start();
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
            Role-play
          </p>
        </div>
        <p className="text-xl font-bold text-neutral-800">{question}</p>
        {hints.length > 0 && (
          <p className="text-xs text-neutral-500 mt-2">Hint: {hints[0]}</p>
        )}
      </div>

      {!done && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={`Reply in ${language}…`}
              disabled={disabled}
              className="flex-1 p-3 rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:outline-none"
              onKeyDown={(e) =>
                e.key === 'Enter' && reply.trim() && grade(reply.trim())
              }
            />
            {isSTTSupported() && (
              <button
                onClick={toggleMic}
                className={cn(
                  'px-4 rounded-xl border-2 font-semibold transition-colors',
                  recording
                    ? 'border-red-400 bg-red-50 text-red-500 animate-pulse'
                    : 'border-neutral-200 text-neutral-500 hover:border-emerald-400'
                )}
                aria-label={recording ? 'Stop recording' : 'Speak your reply'}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <Button onClick={() => grade(reply.trim())} disabled={!reply.trim()}>
              Reply
            </Button>
          </div>
          <p className="text-xs text-neutral-400">
            Example answer: <span className="font-medium">{correctAnswer}</span>
          </p>
        </div>
      )}

      {done && (
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-md">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white',
                verdict === 'pass'
                  ? 'bg-green-500'
                  : verdict === 'close'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              )}
            >
              {verdict === 'miss' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-neutral-900">
                {verdict === 'pass'
                  ? 'Natural response!'
                  : verdict === 'close'
                    ? 'Understood — a local might say it differently'
                    : 'Try a phrasing closer to the example'}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                A natural reply: <span className="font-semibold">{correctAnswer}</span>
              </p>
              {score !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  Match: {Math.round(score * 100)}%
                </p>
              )}
              <p className="text-sm text-neutral-600 mt-2">{explanation}</p>
              <Link
                href="/chat"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Practice this scenario in chat →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
