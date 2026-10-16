'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { AITutorModal } from './ai-tutor-modal';

interface LearnAITutorButtonProps {
  language: string;
}

export function LearnAITutorButton({ language }: LearnAITutorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-sky-500 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
            <Bot className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-sm">AI Language Tutor</h4>
            <p className="text-xs text-sky-100">Practice conversations in {language}</p>
          </div>
        </div>
        <p className="text-xs text-white/90 mb-3 leading-relaxed">
          Ask questions, get grammar explanations, or practice real-time dialogues with your personalized {language} tutor.
        </p>
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-bold shadow-md flex items-center justify-center gap-2 text-xs"
          size="sm"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Chat with AI Tutor
        </Button>
      </div>

      <AITutorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        language={language}
      />
    </>
  );
}
