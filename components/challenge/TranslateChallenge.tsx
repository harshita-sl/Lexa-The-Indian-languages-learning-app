'use client';

import { useState } from 'react';
import { Check, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslateChallengeProps {
  question: string;
  type: 'TRANSLATE';
  options: Array<{ text: string; correct: boolean; audioText?: string | null }>;
  correctAnswer: string;
  explanation: string;
  hints: string[];
  onAnswer: (correct: boolean, selectedAnswer: string) => void;
  disabled?: boolean;
}

export function TranslateChallenge({
  question,
  options,
  correctAnswer,
  explanation,
  hints,
  onAnswer,
  disabled = false,
}: TranslateChallengeProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [usedHint, setUsedHint] = useState(false);

  const speakText = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelect = (index: number) => {
    if (disabled || showExplanation) return;
    setSelectedOption(index);
    const isCorrect = options[index].correct;
    onAnswer(isCorrect, options[index].text);
    setShowExplanation(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
        <p className="text-sm font-semibold uppercase text-sky-600 tracking-wider mb-2">Translate this sentence</p>
        <div className="mt-2 p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-sky-900">{question}</p>
          <button
            onClick={(e) => speakText(question, e)}
            className="p-2 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors shrink-0"
            title="Listen sentence"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Translation options">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selectedOption === index}
            disabled={disabled || showExplanation}
            onClick={() => handleSelect(index)}
            className={cn(
              'w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
              'disabled:opacity-80 disabled:cursor-not-allowed',
              showExplanation && selectedOption === index
                ? options[index].correct
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : options[index].correct && showExplanation
                ? 'border-green-500 bg-green-50'
                : 'border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm'
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                showExplanation && selectedOption === index
                  ? options[index].correct
                    ? 'border-green-500 bg-green-500'
                    : 'border-red-500 bg-red-500'
                  : options[index].correct && showExplanation
                  ? 'border-green-500 bg-green-500'
                  : 'border-neutral-300'
              )}>
                {showExplanation && selectedOption === index && (
                  options[index].correct ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <X className="w-4 h-4 text-white" />
                  )
                )}
                {showExplanation && options[index].correct && selectedOption !== index && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="flex-1 text-base font-semibold text-neutral-800">
                {option.text}
              </span>
            </div>

            <button
              onClick={(e) => speakText(option.text, e)}
              className="p-2 text-neutral-400 hover:text-sky-500 transition-colors"
              title="Listen option"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </button>
        ))}
      </div>

      {showExplanation && (
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-md animate-fade-in">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white',
              selectedOption !== null && options[selectedOption]?.correct
                ? 'bg-green-500'
                : 'bg-red-500'
            )}>
              {selectedOption !== null && options[selectedOption]?.correct ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base text-neutral-900">
                {selectedOption !== null && options[selectedOption]?.correct 
                  ? 'Correct!' 
                  : 'Not quite right'}
              </p>
              <p className="text-sm text-neutral-600 mt-1">{explanation}</p>
              <p className="text-sm text-neutral-500 mt-2">
                Correct translation: <span className="font-semibold text-neutral-800">{correctAnswer}</span>
              </p>
              {hints.length > 0 && !usedHint && (
                <button
                  onClick={() => setUsedHint(true)}
                  className="mt-2 text-xs font-semibold text-sky-600 hover:underline"
                >
                  Show hint: {hints[0]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}