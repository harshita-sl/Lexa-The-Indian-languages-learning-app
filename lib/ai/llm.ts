/**
 * Provider-agnostic LLM adapter.
 *
 * Swap providers via env:
 *   LLM_PROVIDER=gemini | groq | openai   (default: gemini)
 *   GEMINI_API_KEY / GEMINI_MODEL         (default model: gemini-2.5-flash)
 *   GROQ_API_KEY   / GROQ_MODEL           (default model: openai/gpt-oss-120b)
 *   OPENAI_API_KEY / OPENAI_MODEL         (default model: gpt-4o-mini)
 *
 * Every function throws on total failure — callers are expected to have
 * a graceful fallback (cached content, canned responses).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'model';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

type Provider = 'gemini' | 'groq' | 'openai';

const provider: Provider = (process.env.LLM_PROVIDER as Provider) || 'gemini';

// Cloudflare-fronted APIs (api.groq.com et al.) reset Node's default undici
// TLS fingerprint; a browser UA passes — same fix as lib/ai/speech/gnani.ts.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) LexaApp/1.0';

// Newer keys/projects may not have access to older model IDs; try in order.
// (gemini-2.5-flash-lite / gemini-2.0-flash were retired by Google.)
const GEMINI_FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-3.8-flash',
].filter((m): m is string => Boolean(m));

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let workingGeminiModel: string | null = null;

function toGeminiRole(role: ChatMessage['role']): 'user' | 'model' {
  return role === 'assistant' || role === 'model' ? 'model' : 'user';
}

async function geminiCompletion(
  system: string,
  messages: ChatMessage[],
  opts: LLMOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const candidates = opts.model
    ? [opts.model]
    : workingGeminiModel
      ? [workingGeminiModel]
      : GEMINI_FALLBACK_MODELS;

  let lastError: unknown = null;
  for (const modelName of candidates) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'User-Agent': UA },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((m) => ({
              role: toGeminiRole(m.role),
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: opts.temperature ?? 0.7,
              maxOutputTokens: opts.maxTokens ?? 2000,
              ...(opts.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { error?: { message?: string } }).error?.message || res.statusText;
        throw new Error(`Gemini ${modelName} failed (${res.status}): ${msg}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('') || '';
      if (!text) throw new Error(`Gemini ${modelName} returned empty response`);
      workingGeminiModel = modelName;
      return text;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Gemini request failed');
}

async function openAICompatibleCompletion(
  baseUrl: string,
  apiKey: string | undefined,
  model: string,
  keyName: string,
  system: string,
  messages: ChatMessage[],
  opts: LLMOptions
): Promise<string> {
  if (!apiKey) throw new Error(`${keyName} is not set`);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'User-Agent': UA },
    body: JSON.stringify({
      model: opts.model || model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2000,
      ...(opts.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || res.statusText;
    throw new Error(`${keyName} request failed (${res.status}): ${msg}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error(`${keyName} returned empty response`);
  return text;
}

/** Single-shot or multi-turn chat completion through the configured provider. */
export async function chatCompletion(
  systemPrompt: string,
  messages: ChatMessage[],
  opts: LLMOptions = {}
): Promise<string> {
  switch (provider) {
    case 'groq':
      return openAICompatibleCompletion(
        'https://api.groq.com/openai/v1',
        process.env.GROQ_API_KEY,
        GROQ_MODEL,
        'GROQ_API_KEY',
        systemPrompt,
        messages,
        opts
      );
    case 'openai':
      return openAICompatibleCompletion(
        'https://api.openai.com/v1',
        process.env.OPENAI_API_KEY,
        OPENAI_MODEL,
        'OPENAI_API_KEY',
        systemPrompt,
        messages,
        opts
      );
    case 'gemini':
    default:
      return geminiCompletion(systemPrompt, messages, opts);
  }
}

/**
 * Streaming completion — calls onChunk per delta, resolves to full text.
 * Implemented via buffered completion for providers without a stream path;
 * swap in SSE/WebSocket per provider later without changing call sites.
 */
export async function chatStream(
  systemPrompt: string,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  opts: LLMOptions = {}
): Promise<string> {
  const text = await chatCompletion(systemPrompt, messages, opts);
  onChunk(text);
  return text;
}
