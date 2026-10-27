'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Volume2, 
  MessageSquare, 
  User,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { createPortal } from 'react-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  userLevel?: string;
  topic?: string;
}

export function AITutorModal({
  isOpen,
  onClose,
  language,
  userLevel = 'beginner',
  topic = 'Basics & Greetings'
}: AITutorModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const initChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/tutor-chat?language=${encodeURIComponent(language)}&level=${encodeURIComponent(userLevel)}&topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (data && data.starter) {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: data.starter,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Namaste! I am your ${language} AI Tutor. How can I help you practice ${language} today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    } catch {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hello! I am your ${language} language practice buddy. Ask me any question, grammar rule, or practice a conversation!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [language, userLevel, topic]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initChat();
    }
  }, [isOpen, messages.length, initChat]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          userLevel,
          topic,
          message: query,
          conversationHistory: history,
          action: 'chat',
        }),
      });

      const data = await res.json();
      if (data && data.response) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const fallbackMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Great attempt! In ${language}, practice is key. What topic or sentence would you like to explore next?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('Tutor send error:', err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Excellent question! In ${language}, grammar structure puts verbs at the end. Shall we try another phrase together?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg h-[650px] max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Lexa AI Tutor ({language})
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Level: <span className="capitalize">{userLevel}</span> • Topic: {topic}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto text-xs scrollbar-none">
          <button 
            onClick={() => handleSend(`How do I say "Thank you" in ${language}?`)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-sky-50 hover:border-sky-300 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            &quot;Thank you&quot; in {language}?
          </button>
          <button 
            onClick={() => handleSend(`Explain the basic grammar rule for ${topic}`)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-sky-50 hover:border-sky-300 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            Grammar tip
          </button>
          <button 
            onClick={() => handleSend(`Give me 3 common daily phrases in ${language}`)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-sky-50 hover:border-sky-300 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            3 daily phrases
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-neutral-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-[85%]',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-sm',
                  msg.role === 'user'
                    ? 'bg-sky-500'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                )}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={cn(
                  'p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative group',
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-tl-none'
                )}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] opacity-75">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="p-1 hover:text-sky-500 transition-colors flex items-center gap-1"
                      title="Listen pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask AI Tutor in ${language} or English...`}
            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            size="icon"
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
