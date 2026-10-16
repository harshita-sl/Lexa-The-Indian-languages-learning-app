import Link from 'next/link';
import {
  RefreshCw,
  Sparkles,
  Wrench,
  MessageCircle,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanStep } from '@/lib/ai/adaptive/daily-plan';

const TYPE_META: Record<
  PlanStep['type'],
  { icon: typeof RefreshCw; chip: string; chipClass: string }
> = {
  fsrs_review: {
    icon: RefreshCw,
    chip: 'Review',
    chipClass: 'bg-red-50 text-red-600',
  },
  zpd_new: {
    icon: Sparkles,
    chip: 'New',
    chipClass: 'bg-indigo-50 text-indigo-600',
  },
  remediation: {
    icon: Wrench,
    chip: 'Weak spot',
    chipClass: 'bg-amber-50 text-amber-600',
  },
  conversation: {
    icon: MessageCircle,
    chip: 'Chat',
    chipClass: 'bg-emerald-50 text-emerald-600',
  },
};

export function stepHref(step: PlanStep, language: string): string {
  const lang = encodeURIComponent(language);
  if (step.type === 'conversation') return `/chat?language=${lang}`;
  if (step.type === 'zpd_new')
    return `/learn/lesson/0?language=${lang}&conceptId=${encodeURIComponent(step.conceptId)}&topic=${encodeURIComponent(step.title)}`;
  return `/practice?conceptId=${encodeURIComponent(step.conceptId)}&language=${lang}`;
}

export function TodaysPlan({
  steps,
  estMinutes,
  language,
}: {
  steps: PlanStep[];
  estMinutes: number;
  language: string;
}) {
  if (steps.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-neutral-800 text-lg flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-green-500" /> Today&apos;s plan
        </h2>
        <span className="text-xs font-semibold text-neutral-400">~{estMinutes} min</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const meta = TYPE_META[step.type] ?? TYPE_META.zpd_new;
          const Icon = meta.icon;
          return (
            <Link
              key={`${step.conceptId}-${i}`}
              href={stepHref(step, language)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-2xl border-2 border-neutral-200 bg-white',
                'hover:border-sky-300 hover:bg-sky-50/40 transition-colors group'
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', meta.chipClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-800 text-sm truncate">{step.title}</p>
                  <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full', meta.chipClass)}>
                    {meta.chip}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{step.reason}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-sky-500 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
