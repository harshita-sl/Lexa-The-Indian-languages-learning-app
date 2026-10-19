'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Languages, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COURSES = [
  { title: 'Telugu', courseId: 1, emoji: 'తె' },
  { title: 'Kannada', courseId: 3, emoji: 'ಕ' },
  { title: 'Hindi', courseId: 2, emoji: 'हि' },
];

const GOALS = [
  { id: 'travel', label: 'Travel', desc: 'Get around, order food, ask directions' },
  { id: 'family', label: 'Family & friends', desc: 'Talk with relatives and in-laws' },
  { id: 'work', label: 'Work', desc: 'Office banter and professional chat' },
  { id: 'culture', label: 'Culture & movies', desc: 'Songs, films, memes, literature' },
] as const;

const LEVELS = [
  { id: 'beginner', label: 'New to it', desc: 'I know a few words at most' },
  { id: 'intermediate', label: 'Some basics', desc: 'I can hold a simple conversation' },
  { id: 'advanced', label: 'Comfortable', desc: 'I want to sound natural & learn slang' },
] as const;

const NATIVE_LANGS = ['English', 'Hindi', 'Telugu', 'Kannada', 'Tamil', 'Malayalam', 'Other'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [course, setCourse] = useState(COURSES[0]);
  const [goal, setGoal] = useState<string>('culture');
  const [level, setLevel] = useState<string>('beginner');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [register, setRegister] = useState<string>('colloquial');
  const [translit, setTranslit] = useState<string>('both');
  const [learningStyle, setLearningStyle] = useState<string>('balanced');

  const finish = async () => {
    setSaving(true);
    try {
      await fetch('/api/ai/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nativeLanguage,
          targetLanguage: course.title,
          goal,
          currentLevel: level,
          dailyGoalMinutes: dailyGoal,
          targetRegister: register,
          transliterationMode: translit,
          learningStyle,
          onboardingCompleted: true,
        }),
      });
    } catch {
      // best-effort; placement still works with defaults
    }
    router.push(`/placement?language=${course.title}&courseId=${course.courseId}&level=${level}`);
  };

  const steps = [
    { title: 'Which language do you want to speak?', sub: 'We teach it the way people actually talk.' },
    { title: 'What is your mother tongue?', sub: 'Helps us anticipate common mistakes.' },
    { title: 'Why are you learning?', sub: 'We tune your plan around your goal.' },
    { title: 'How much do you already know?', sub: 'Be honest — a quick placement test will fine-tune this.' },
    { title: 'Daily goal & style', sub: 'Pick a pace and how you want to sound.' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Languages className="w-7 h-7 text-amber-600" />
          <h1 className="text-2xl font-extrabold text-amber-600">Lexa</h1>
        </div>

        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h2 className="text-2xl font-bold text-neutral-900">{steps[step].title}</h2>
        <p className="text-neutral-500 mb-8">{steps[step].sub}</p>

        {step === 0 && (
          <div className="grid gap-3">
            {COURSES.map((c) => (
              <OptionCard
                key={c.title}
                selected={course.title === c.title}
                onClick={() => setCourse(c)}
                title={c.title}
                desc={`${c.emoji} — script + spoken style`}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {NATIVE_LANGS.map((l) => (
              <OptionCard
                key={l}
                selected={nativeLanguage === l}
                onClick={() => setNativeLanguage(l)}
                title={l}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3">
            {GOALS.map((g) => (
              <OptionCard
                key={g.id}
                selected={goal === g.id}
                onClick={() => setGoal(g.id)}
                title={g.label}
                desc={g.desc}
              />
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3">
            {LEVELS.map((l) => (
              <OptionCard
                key={l.id}
                selected={level === l.id}
                onClick={() => setLevel(l.id)}
                title={l.label}
                desc={l.desc}
              />
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-neutral-800 mb-3">Daily time budget</p>
              <div className="grid grid-cols-3 gap-3">
                {[10, 15, 30].map((m) => (
                  <OptionCard
                    key={m}
                    selected={dailyGoal === m}
                    onClick={() => setDailyGoal(m)}
                    title={`${m} min`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 mb-3">How do you want to sound?</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'colloquial', label: 'Casual & natural' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'formal', label: 'Polite & formal' },
                ].map((r) => (
                  <OptionCard
                    key={r.id}
                    selected={register === r.id}
                    onClick={() => setRegister(r.id)}
                    title={r.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 mb-3">How do you learn best?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'visual', label: 'Reading & seeing', desc: 'Script, flashcards, word lists' },
                  { id: 'audio', label: 'Listening', desc: 'Hear phrases, repeat after audio' },
                  { id: 'speaking', label: 'Speaking', desc: 'Say it aloud, pronunciation drills' },
                  { id: 'balanced', label: 'Mix it up', desc: 'A bit of everything' },
                ].map((s) => (
                  <OptionCard
                    key={s.id}
                    selected={learningStyle === s.id}
                    onClick={() => setLearningStyle(s.id)}
                    title={s.label}
                    desc={s.desc}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                We&apos;ll auto-adjust this as we learn how you actually perform.
              </p>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 mb-3">Show text as</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'both', label: 'Script + roman' },
                  { id: 'native', label: 'Script only' },
                  { id: 'roman', label: 'Roman only' },
                ].map((t) => (
                  <OptionCard
                    key={t.id}
                    selected={translit === t.id}
                    onClick={() => setTranslit(t.id)}
                    title={t.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} size="lg" className="font-bold">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={saving}
              size="lg"
              className="font-bold bg-green-500 hover:bg-green-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Take placement test <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl border-2 text-left transition-all',
        'focus:outline-none focus:ring-2 focus:ring-sky-500',
        selected
          ? 'border-sky-500 bg-sky-50'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      )}
    >
      <p className="font-bold text-neutral-800">{title}</p>
      {desc && <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>}
    </button>
  );
}
