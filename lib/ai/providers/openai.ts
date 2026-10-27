import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
  } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 2000;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
  });

  return response.choices[0]?.message?.content || '';
}

export async function generateImage(
  prompt: string,
  options: {
    model?: 'dall-e-3' | 'dall-e-2';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    n?: number;
  } = {}
): Promise<string[]> {
  const client = getOpenAIClient();
  const model = options.model || 'dall-e-3';
  const size = options.size || '1024x1024';
  const quality = options.quality || 'standard';
  const n = options.n || 1;

  const response = await client.images.generate({
    model,
    prompt,
    size,
    quality,
    n,
  });

  return response.data?.map((img) => img.url || '').filter(Boolean) || [];
}

export async function generateSpeech(
  text: string,
  options: {
    model?: 'tts-1' | 'tts-1-hd';
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  } = {}
): Promise<ArrayBuffer> {
  const client = getOpenAIClient();
  const model = options.model || 'tts-1';
  const voice = options.voice || 'nova';
  const speed = options.speed || 1.0;

  const response = await client.audio.speech.create({
    model,
    voice,
    input: text,
    speed,
  });

  return response.arrayBuffer();
}