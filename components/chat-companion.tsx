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
  History,
  ArrowLeft,
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

/** Persona identity per scenario — mirrors lib/ai/chat/personas.ts for the chip. */
const SCENARIO_META: Record<string, Record<string, { name: string; role: string }>> = {
  telugu: {
    auto: { name: 'Ravi', role: 'rickshaw driver' },
    bargaining: { name: 'Lakshmamma', role: 'market vendor' },
    food: { name: 'Srinu', role: 'tiffin-center waiter' },
    friends: { name: 'Priya', role: 'your friend' },
    inlaws: { name: 'Padmavathi ammamma', role: 'your partner\'s grandmother' },
    office: { name: 'Karthik', role: 'your colleague' },
    free: { name: 'Priya', role: 'a friendly local' },
  },
  kannada: {
    auto: { name: 'Manju', role: 'rickshaw driver' },
    bargaining: { name: 'Ratnamma', role: 'market vendor' },
    food: { name: 'Raghu', role: 'darshini waiter' },
    friends: { name: 'Lakshmi', role: 'your friend' },
    inlaws: { name: 'Sharada ajji', role: 'your partner\'s grandmother' },
    office: { name: 'Arun', role: 'your colleague' },
    free: { name: 'Lakshmi', role: 'a friendly local' },
  },
  hindi: {
    auto: { name: 'Raju', role: 'rickshaw driver' },
    free: { name: 'Raj', role: 'a friendly local' },
  },
};

function personaFor(langKey: string, scenario: string) {
  const table = SCENARIO_META[langKey] ?? SCENARIO_META.hindi;
  return table[scenario] ?? table.free;
}

/** In-character opener per scenario — the first line the persona speaks. */
const OPENERS: Record<string, Record<string, ChatMsg>> = {
  telugu: {
    auto: {
      role: 'assistant',
      content: 'ఏయ్ సార్! ఎక్కడికి వెళ్తారు? చెప్పండి, నూట యాభైకి వదిలిపెడతా.',
      english: 'Hey sir! Where to? Tell me, I\'ll drop you for ₹150.',
      translit: 'Ey saar! Ekkadiki veltaaru? Cheppandi, noota yabhaiki vadilipetta.',
    },
    bargaining: {
      role: 'assistant',
      content: 'ఏమి కావాలమ్మా? ఈరోజు కూరగాయలు సూపర్ ఫ్రెష్!',
      english: 'What do you need, dear? The vegetables are super fresh today!',
      translit: 'Emi kaavaalamma? Eeroju kooragaayalu super fresh!',
    },
    food: {
      role: 'assistant',
      content: 'సార్ ఏమి కావాలి? ఇడ్లీ, దోసె, పూరీ — అన్ని రెడీ.',
      english: 'Sir, what would you like? Idli, dosa, puri — all ready.',
      translit: 'Saar emi kaavaali? Idli, dose, poori — anni ready.',
    },
    friends: {
      role: 'assistant',
      content: 'ఏయ్ ఏమిటి! చాలా రోజులైంది చూసి. ఏం జరుగుతోంది మీ అక్కడ?',
      english: 'Hey! Long time no see. What\'s up on your end?',
      translit: 'Ey emiti! Chaala roojulaindi choosi. Em jarugutondi mee akkada?',
    },
    inlaws: {
      role: 'assistant',
      content: 'రండి అమ్మా రండి! ఎలా ఉన్నారు? ప్రయాణం బాగుందా?',
      english: 'Come in dear! How are you? Was your journey comfortable?',
      translit: 'Randi amma randi! Ela unnaaru? Prayaanam baagundaa?',
    },
    office: {
      role: 'assistant',
      content: 'ఏమిటి బ్రో, మీటింగ్ అయిపోయిందా? ఎలా అయింది?',
      english: 'Hey bro, done with the meeting? How did it go?',
      translit: 'Emiti bro, meeting ayipoyindaa? Ela ayyindi?',
    },
    free: {
      role: 'assistant',
      content: 'నమస్కారం! నేను ప్రియ. ఏమిటి విషయం?',
      english: "Hello! I'm Priya. What's up?",
      translit: 'Namaskaaram! Nenu Priya. Emiti vishayam?',
    },
  },
  kannada: {
    auto: {
      role: 'assistant',
      content: 'ಏನ್ಸಾರ್! ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು? ಹೇಳಿ, ನೂರಾ ಐವತ್ತಕ್ಕೆ ಬಿಡ್ತೀನಿ.',
      english: 'Hey sir! Where to? Tell me, I\'ll drop you for ₹150.',
      translit: 'Ensaar! Ellige hogbeku? Heli, noora aivattakke bidteeni.',
    },
    bargaining: {
      role: 'assistant',
      content: 'ಏನ್ ಬೇಕಮ್ಮಾ? ಇವತ್ತು ತರಕಾರಿ ಎಲ್ಲಾ ಸೂಪರ್ ಫ್ರೆಶ್!',
      english: 'What do you need, dear? All vegetables are super fresh today!',
      translit: 'En bekamma? Ivattu tarakaari ella super fresh!',
    },
    food: {
      role: 'assistant',
      content: 'ಸಾರ್ ಏನ್ ಬೇಕು? ಇಡ್ಲಿ, ದೋಸೆ, ಪೂರಿ — ಎಲ್ಲಾ ರೆಡಿ.',
      english: 'Sir, what would you like? Idli, dosa, puri — all ready.',
      translit: 'Saar en beku? Idli, dose, poori — ella ready.',
    },
    friends: {
      role: 'assistant',
      content: 'ಏಯ್ ಏನ್ಮಚ್ಚಾ! ತುಂಬಾ ದಿನ ಆಯ್ತು. ಏನ್ ಸಮಾಚಾರ?',
      english: 'Hey dude! It\'s been ages. What\'s the news?',
      translit: 'Ey enmachcha! Tumba dina aaytu. En samachaara?',
    },
    inlaws: {
      role: 'assistant',
      content: 'ಬನ್ನಿ ಅಮ್ಮ ಬನ್ನಿ! ಹೇಗಿದ್ದೀರಿ? ಪ್ರಯಾಣ ಚೆನ್ನಾಗಿತ್ತಾ?',
      english: 'Come in dear! How are you? Was your journey comfortable?',
      translit: 'Banni amma banni! Hegiddeeri? Prayaana chennaagittaa?',
    },
    office: {
      role: 'assistant',
      content: 'ಏನ್ಸರ್, ಮೀಟಿಂಗ್ ಮುಗೀತಾ? ಹೇಗಾಯ್ತು?',
      english: 'Hey, done with the meeting? How did it go?',
      translit: 'Ensar, meeting mugeetaa? Hegaaytu?',
    },
    free: {
      role: 'assistant',
      content: 'ನಮಸ್ಕಾರ! ನಾನು ಲಕ್ಷ್ಮಿ. ಏನು ಸಮಾಚಾರ?',
      english: "Hello! I'm Lakshmi. What's up?",
      translit: 'Namaskaara! Naanu Lakshmi. Enu samachaara?',
    },
  },
  hindi: {
    free: {
      role: 'assistant',
      content: 'नमस्ते! मैं राज हूँ। क्या चल रहा है?',
      english: "Hi! I'm Raj. What's going on?",
      translit: 'Namaste! Main Raj hoon. Kya chal raha hai?',
    },
  },
};

function openerFor(langKey: string, scenario: string): ChatMsg {
  const table = OPENERS[langKey] ?? OPENERS.hindi;
  return table[scenario] ?? table.free ?? {
    role: 'assistant',
    content: 'Hello! Ready to practice?',
    english: '',
  };
}

const REGISTER_STYLE: Record<SlangCard['register'], string> = {
  casual: 'bg-sky-50 text-sky-700 border-sky-200',
  very_informal: 'bg-amber-50 text-amber-700 border-amber-200',
  rude: 'bg-red-50 text-red-700 border-red-200',
  regional: 'bg-purple-50 text-purple-700 border-purple-200',
  formal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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
  const [scenario, setScenario] = useState('free');
  const [messages, setMessages] = useState<ChatMsg[]>([openerFor(langKey, 'free')]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [historyItems, setHistoryItems] = useState<
    { id: number; scenario: string; updatedAt: string; turns: number; preview: string; previewEnglish: string }[] | null
  >(null);
  const [historyDetail, setHistoryDetail] = useState<{ id: number; messages: ChatMsg[] } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const persona = personaFor(langKey, scenario);

  const pickScenario = (id: string) => {
    if (id === scenario) return;
    stopSpeaking();
    setOfflineMode(false);
    setHistoryOpen(false);
    setHistoryDetail(null);
    setScenario(id);
    setMessages([openerFor(langKey, id)]);
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryDetail(null);
    setHistoryItems(null);
    try {
      const res = await fetch(`/api/ai/chat/history?language=${language}&limit=20`);
      const data = await res.json();
      setHistoryItems(data.items ?? []);
    } catch {
      setHistoryItems([]);
    }
  };

  const openHistoryDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/ai/chat/history?id=${id}`);
      const data = await res.json();
      if (data.messages) setHistoryDetail({ id, messages: data.messages });
    } catch {}
  };

  /** Shared bubble renderer — used by both live chat and read-only history. */
  const bubble = (m: ChatMsg, i: number) => (
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
  );

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
      setOfflineMode(Boolean(data.offline));
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
            onClick={() => pickScenario(s.id)}
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

      {/* Persona + mode chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          <MessageSquare className="w-3.5 h-3.5" />
          Talking to {persona.name} · {persona.role}
        </span>
        {offlineMode && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
            Scripted mode — add an AI key for full chat
          </span>
        )}
      </div>

      {/* Messages / History */}
      {historyOpen ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {historyDetail ? (
            <>
              <button
                onClick={() => setHistoryDetail(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to conversations
              </button>
              {historyDetail.messages.map(bubble)}
            </>
          ) : historyItems === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              No past conversations yet — chat and they will show up here for review.
            </div>
          ) : (
            historyItems.map((h) => (
              <button
                key={h.id}
                onClick={() => void openHistoryDetail(h.id)}
                className="w-full text-left rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    {SCENARIOS.find((s) => s.id === h.scenario)?.label ?? h.scenario}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(h.updatedAt).toLocaleString()} · {h.turns} turns
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-700 mt-1 truncate">{h.preview}</p>
                {h.previewEnglish && (
                  <p className="text-xs text-neutral-400 truncate">{h.previewEnglish}</p>
                )}
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {messages.map(bubble)}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-neutral-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

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
        <button
          onClick={() => (historyOpen ? setHistoryOpen(false) : void openHistory())}
          title={historyOpen ? 'Back to chat' : 'Review past conversations'}
          className={cn(
            'p-2 rounded-xl border-2 transition-colors',
            historyOpen
              ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
              : 'bg-white border-neutral-200 text-neutral-400 hover:border-indigo-300'
          )}
        >
          <History className="w-5 h-5" />
        </button>
        {!sttOk && (
          <p className="text-xs text-neutral-400 ml-auto">Mic unavailable in this browser — text works fine.</p>
        )}
      </div>

      <div className="flex gap-2">
        {historyOpen ? (
          <button
            onClick={() => setHistoryOpen(false)}
            className="flex-1 rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Back to live chat
          </button>
        ) : (
        <>
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
        </>
        )}
      </div>

      <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        Slang you see here joins your review queue automatically.
      </p>
    </div>
  );
}
