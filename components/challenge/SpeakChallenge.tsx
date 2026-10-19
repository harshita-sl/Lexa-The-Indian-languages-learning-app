'use client';

import { useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Check, X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChallengeProps } from './ChallengeBase';
import { createBestRecognizer, isSTTSupported, Recognizer } from '@/lib/ai/speech/stt';
import { speakWithProvider } from '@/lib/ai/speech/tts';
import { scorePronunciation } from '@/lib/ai/speech/similarity';
import { Button } from '@/components/ui/button';

/**
 * SPEAK — repeat the phrase aloud. STT → similarity score → feedback.
 * Falls back to typed input when no mic/STT is available.
 */
export function SpeakChallenge({
  question,
  correctAnswer,
  explanation,
  hints,
  onAnswer,
  disabled = false,
  language = 'Telugu',
}: ChallengeProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<'pass' | 'close' | 'miss' | null>(null);
  const [typed, setTyped] = useState('');
  const [typeMode, setTypeMode] = useState(!isSTTSupported());
  const [done, setDone] = useState(false);
  const recRef = useRef<Recognizer | null>(null);

  const grade = (heard: string) => {
    const result = scorePronunciation(heard, correctAnswer, language);
    setTranscript(heard);
    setScore(result.score);
    setVerdict(result.verdict);
    setDone(true);
    // 'close' counts as correct-but-hard so the FSRS path rates it 'hard'.
    onAnswer(result.verdict !== 'miss', heard, result.score);
  };

  const toggleMic = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = createBestRecognizer(language, {
      onResult: (t) => grade(t),
      onEnd: () => setRecording(false),
      onError: () => {
        setRecording(false);
        setTypeMode(true);
      },
    });
    if (!rec) {
      setTypeMode(true);
      return;
    }
    recRef.current = rec;
    setRecording(true);
    rec.start();
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <p className="text-sm font-semibold text-sky-600 uppercase tracking-wide mb-2">
          Say it out loud
        </p>
        <p className="text-xl font-bold text-neutral-800">{question}</p>
        <p className="mt-2 text-lg text-neutral-600 font-medium">{correctAnswer}</p>
        <button
          onClick={() => void speakWithProvider(correctAnswer, language)}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs font-semibold transition-colors"
        >
          <Volume2 className="w-4 h-4" /> Listen first
        </button>
      </div>

      {!done && !typeMode && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleMic}
            disabled={disabled}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all',
              recording
                ? 'bg-red-500 text-white animate-pulse shadow-lg'
                : 'bg-sky-500 text-white hover:bg-sky-600 shadow-md'
            )}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-sm text-neutral-500 font-medium">
            {recording ? 'Listening… tap to stop' : 'Tap to speak'}
          </p>
          <button
            onClick={() => setTypeMode(true)}
            className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-sky-600 font-semibold"
          >
            <Keyboard className="w-3.5 h-3.5" /> No mic? Type instead
          </button>
        </div>
      )}

      {!done && typeMode && (
        <div className="flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type the phrase…"
            className="flex-1 p-3 rounded-xl border-2 border-neutral-200 focus:border-sky-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && typed.trim() && grade(typed.trim())}
          />
          <Button onClick={() => grade(typed.trim())} disabled={!typed.trim()}>
            Check
          </Button>
        </div>
      )}

      {done && (
        <div
          className={cn(
            'p-5 rounded-2xl bg-white border shadow-md',
            verdict === 'pass'
              ? 'border-green-300'
              : verdict === 'close'
                ? 'border-amber-300'
                : 'border-red-300'
          )}
        >
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
                  ? 'Great pronunciation!'
                  : verdict === 'close'
                    ? 'Close — keep practicing'
                    : 'Not quite — try listening again'}
              </p>
              {transcript && (
                <p className="text-sm text-neutral-600 mt-1">
                  We heard: <span className="font-semibold">{transcript}</span>
                </p>
              )}
              {score !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  Similarity score: {Math.round(score * 100)}%
                </p>
              )}
              <p className="text-sm text-neutral-600 mt-2">{explanation}</p>
              {hints.length > 0 && (
                <p className="text-xs text-sky-600 mt-1 font-semibold">
                  Tip: {hints[0]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
