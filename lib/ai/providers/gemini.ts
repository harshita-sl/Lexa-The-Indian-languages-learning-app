import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateCompletionGemini(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
  } = {}
): Promise<string> {
  const ai = getGenAI();
  const modelName = options.model || 'gemini-1.5-flash';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 2000;

  const model = ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain',
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
    ],
  });

  const result = await chat.sendMessage(userPrompt);
  const response = result.response;
  return response.text();
}

export async function generateStreamGemini(
  systemPrompt: string,
  userPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'model'; text: string }> = [],
  onChunk: (chunk: string) => void,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const ai = getGenAI();
  const modelName = options.model || 'gemini-1.5-flash';
  const temperature = options.temperature ?? 0.8;
  const maxTokens = options.maxTokens || 300;

  const model = ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const history = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood.' }] },
    ...conversationHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
  ];

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(userPrompt);

  let fullResponse = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullResponse += text;
      onChunk(text);
    }
  }

  return fullResponse;
}