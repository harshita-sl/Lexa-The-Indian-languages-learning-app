'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { stopSpeaking, isTTSSupported, speakWithProvider } from '@/lib/ai/speech/tts';
import { createBestRecognizer, isSTTSupported, type Recognizer } from '@/lib/ai/speech/stt';

interface SlangCard {
  term: string;
  translit?: string;
  gloss: string;
  register: 'casual' | 'very_informal' | 'rude' | 'regional' | 'formal';
  region?: string;
}

interface Correction {
  user_said: string;
  better: string;
  why: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string; // native script for assistant, raw text for user
  english?: string;
  translit?: string;
  slang?: SlangCard[];
  correction?: Correction | null;
}

const SCENARIOS: { id: string; label: string }[] = [
  { id: 'free', label: 'Free chat' },
  { id: 'auto', label: 'Autorickshaw' },
  { id: 'bargaining', label: 'Bargaining' },
  { id: 'food', label: 'Ordering food' },
  { id: 'friends', label: 'With friends' },
  { id: 'inlaws', label: 'Meeting family' },
  { id: 'office', label: 'Office banter' },
];

const REGISTER_STYLE: Record<SlangCard['register'], string> = {
  casual: 'bg-sky-50 text-sky-700 border-sky-200',
  very_informal: 'bg-amber-50 text-amber-700 border-amber-200',
  rude: 'bg-red-50 text-red-700 border-red-200',
  regional: 'bg-purple-50 text-purple-700 border-purple-200',
  formal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const OPENERS: Record<string, ChatMsg> = {
  telugu: {
    role: 'assistant',
    content: 'నమస్కారం! నేను ప్రియ. ఏమిటి విషయం?',
    english: "Hello! I'm Priya. What's up?",
    translit: 'Namaskaaram! Nenu Priya. Emiti vishayam?',
  },
  kannada: {
    role: 'assistant',
    content: 'ನಮಸ್ಕಾರ! ನಾನು ಲಕ್ಷ್ಮಿ. ಏನು ಸಮಾಚಾರ?',
    english: "Hello! I'm Lakshmi. What's up?",
    translit: 'Namaskaara! Naanu Lakshmi. Enu samachaara?',
  },
  hindi: {
    role: 'assistant',
    content: 'नमस्ते! मैं राज हूँ। क्या चल रहा है?',
    english: "Hi! I'm Raj. What's going on?",
    translit: 'Namaste! Main Raj hoon. Kya chal raha hai?',
  },
};

export function ChatCompanion({
  language,
  courseId,
  userLevel,
}: {
  language: string;
  courseId: number;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}) {
  const langKey = language.toLowerCase();
  const [messages, setMessages] = useState<ChatMsg[]>([
    OPENERS[langKey] ?? {
      role: 'assistant',
      content: 'Hello! Ready to practice?',
      english: '',
    },
  ]);
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState('free');
  const [sending, setSending] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(isTTSSupported());
  const [showTranslit, setShowTranslit] = useState(true);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<Recognizer | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sttOk = isSTTSupported();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => stopSpeaking(), []);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          userLevel,
          scenario,
          message: msg,
          history: history.slice(-10),
          courseId,
        }),
      });
      const data = await res.json();
      if (data.replyNative) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: data.replyNative,
            english: data.replyEnglish,
            translit: data.translit,
            slang: data.slangCards,
            correction: data.correction,
          },
        ]);
        if (speakerOn) void speakWithProvider(data.replyNative, language);
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: data.error ?? 'Something went wrong — try again.', english: '' },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Network issue — please try again.', english: '' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = createBestRecognizer(language, {
      onResult: (t) => {
        setListening(false);
        send(t);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!rec) return;
    recognizerRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
      {/* Scenario picker */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors',
              scenario === s.id
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 border-2',
                m.role === 'user'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white border-neutral-200'
              )}
            >
              <p className={cn('font-semibold', m.role === 'user' ? 'text-white' : 'text-neutral-800')}>
                {m.content}
              </p>
              {m.role === 'assistant' && showTranslit && m.translit && (
                <p className="text-xs text-neutral-400 mt-0.5 italic">{m.translit}</p>
              )}
              {m.role === 'assistant' && m.english && (
                <p className="text-xs text-neutral-500 mt-1">{m.english}</p>
              )}
              {m.role === 'assistant' && (
                <button
                  onClick={() => void speakWithProvider(m.content, language)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </button>
              )}

              {m.slang && m.slang.length > 0 && (
                <div className="mt-3 space-y-2">
                  {m.slang.map((s, j) => (
                    <div
                      key={j}
                      className="text-xs rounded-xl border border-amber-200 bg-amber-50 p-2.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-800">
                          {s.term}
                          {s.translit ? ` (${s.translit})` : ''}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase',
                            REGISTER_STYLE[s.register] ?? REGISTER_STYLE.casual
                          )}
                        >
                          {s.register.replace(/_/g, ' ')}
                          {s.region ? ` · ${s.region}` : ''}
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-1">{s.gloss}</p>
                    </div>
                  ))}
                </div>
              )}

              {m.correction && (
                <div className="mt-3 text-xs rounded-xl border border-rose-200 bg-rose-50 p-2.5">
                  <p className="font-bold text-rose-700 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Gentle fix
                  </p>
                  <p className="text-neutral-700 mt-1">
                    You said: <span className="line-through">{m.correction.user_said}</span>
                  </p>
                  <p className="text-neutral-700">
                    Better: <span className="font-bold">{m.correction.better}</span>
                  </p>
                  <p className="text-neutral-500 mt-0.5">{m.correction.why}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-neutral-200 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setSpeakerOn((s) => !s)}
          title={speakerOn ? 'Mute replies' : 'Speak replies aloud'}
          className={cn(
            'p-2 rounded-xl border-2 transition-colors',
            speakerOn
              ? 'bg-sky-50 border-sky-300 text-sky-600'
              : 'bg-white border-neutral-200 text-neutral-400'
          )}
        >
          {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowTranslit((s) => !s)}
          title="Toggle transliteration"
          className={cn(
            'px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors',
            showTranslit
              ? 'bg-sky-50 border-sky-300 text-sky-600'
              : 'bg-white border-neutral-200 text-neutral-400'
          )}
        >
          Aa
        </button>
        {!sttOk && (
          <p className="text-xs text-neutral-400 ml-auto">Mic unavailable in this browser — text works fine.</p>
        )}
      </div>

      <div className="flex gap-2">
        {sttOk && (
          <button
            onClick={toggleMic}
            title={listening ? 'Stop listening' : `Speak ${language}`}
            className={cn(
              'p-3 rounded-2xl border-2 transition-colors flex-shrink-0',
              listening
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-red-300'
            )}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={`Reply in ${language} (English mix is fine!)`}
          className="flex-1 rounded-2xl border-2 border-neutral-200 px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <Button
          onClick={() => send(input)}
          disabled={!input.trim() || sending}
          size="lg"
          className="rounded-2xl font-bold bg-indigo-500 hover:bg-indigo-600"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        Slang you see here joins your review queue automatically.
      </p>
    </div>
  );
}
