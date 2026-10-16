'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'translation';
  options: string[];
  correctAnswer: string;
  skill: 'vocabulary' | 'grammar' | 'reading';
  difficulty: number;
}

interface AssessmentResult {
  level: 'beginner' | 'intermediate' | 'advanced';
  scores: Record<string, number>;
  recommendedTopics: string[];
  weakAreas: string[];
}

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'Hindi';


  const [step, setStep] = useState<'loading' | 'questions' | 'results'>('loading');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/assessment?language=${language}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setStep('questions');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const answerData = questions.map(q => ({
        questionId: q.id,
        userAnswer: answers[q.id] || '',
        correctAnswer: q.correctAnswer,
        skill: q.skill,
        difficulty: q.difficulty,
      }));

      const res = await fetch('/api/ai/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, answers: answerData }),
      });

      const data = await res.json();
      if (data.level) {
        setResults(data);
        setStep('results');
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!results) return;
    try {
      await fetch('/api/ai/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLevel: results.level,
          assessmentCompleted: true,
        }),
      });
    } catch {
      console.error('Failed to save preferences');
    }
    router.push(`/learn`);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Preparing your {language} assessment...</p>
        </div>
      </div>
    );
  }

  if (step === 'results' && results) {
    const levelLabels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    const levelColors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
    };

    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Brain className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-neutral-900">Assessment Complete!</h1>
            <p className="text-neutral-600 mt-2">Your {language} level has been determined</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 mb-6">
            <div className="text-center mb-6">
              <span className={cn(
                'px-6 py-3 rounded-full text-xl font-bold',
                levelColors[results.level]
              )}>
                {levelLabels[results.level]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(results.scores).map(([skill, score]) => (
                <div key={skill} className="text-center p-4 bg-neutral-50 rounded-xl">
                  <div className="text-2xl font-bold text-primary-600">{Math.round(score)}%</div>
                  <div className="text-sm text-neutral-600 capitalize">{skill}</div>
                </div>
              ))}
            </div>

            {results.recommendedTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-neutral-800 mb-3">Recommended Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {results.recommendedTopics.map((topic, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.weakAreas.length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-800 mb-3">Areas to Practice</h3>
                <div className="flex flex-wrap gap-2">
                  {results.weakAreas.map((area, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleContinue} className="w-full" size="lg">
            Start Learning <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / (questions.length || 1)) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-600">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-neutral-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {question && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <div className="mb-6">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize',
                question.skill === 'vocabulary' && 'bg-blue-100 text-blue-800',
                question.skill === 'grammar' && 'bg-green-100 text-green-800',
                question.skill === 'reading' && 'bg-purple-100 text-purple-800',
              )}>
                {question.skill}
              </span>
              <span className={cn(
                'ml-2 px-3 py-1 rounded-full text-xs font-medium',
                question.difficulty <= 2 && 'bg-green-100 text-green-800',
                question.difficulty === 3 && 'bg-yellow-100 text-yellow-800',
                question.difficulty >= 4 && 'bg-red-100 text-red-800',
              )}>
                Level {question.difficulty}
              </span>
            </div>

            <p className="text-xl font-medium text-neutral-900 mb-8">{question.question}</p>

            <div className="space-y-3" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={answers[question.id] === option}
                  onClick={() => handleAnswer(question.id, option)}
                  disabled={loading}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    answers[question.id] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      answers[question.id] === option
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-neutral-300'
                    )}>
                      {answers[question.id] === option && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1 text-base font-medium text-neutral-800">
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentQuestion === 0 || loading}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!answers[question.id] || loading}
              >
                {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    }>
      <AssessmentContent />
    </Suspense>
  );
}