import { chatCompletion } from './llm';
import { getCachedContent, setCachedContent, generateInputHash } from './cache';
import { buildTutorSystemPrompt } from './prompts/tutor-prompts';
import { ConversationMessage } from './types';

const TUTOR_FALLBACK_STARTERS: Record<string, string> = {
  telugu: "నమస్కారం! (Namaskaram!) I am Priya, your Telugu tutor. What would you like to practice today?",
  hindi: "नमस्ते! (Namaste!) I am Raj, your Hindi AI tutor. Ready to learn some awesome Hindi phrases today?",
  kannada: "ನಮಸ್ಕಾರ! (Namaskara!) I am Lakshmi, your Kannada tutor. What topic shall we explore together?",
};

const TUTOR_FALLBACK_RESPONSES: Record<string, string> = {
  telugu: "బాగుంది! (Baagundi - Good!) That is a great attempt in Telugu. Remember that Telugu sentences usually put the verb at the very end. What would you like to practice next?",
  hindi: "बहुत अच्छा! (Bahut achha - Very good!) Great question about Hindi! In Hindi, sentences follow Subject-Object-Verb order. Would you like to practice a dialogue?",
  kannada: "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ! (Tumba chennagide - Very nice!) Excellent effort in Kannada! Daily practice will make you fluent quickly. Shall we try another phrase?",
};

export async function generateTutorResponse(
  language: string,
  userLevel: string,
  topic: string,
  conversationHistory: ConversationMessage[],
  userMessage: string
): Promise<string> {
  const langKey = language.toLowerCase();
  try {
    const systemPrompt = buildTutorSystemPrompt(language, userLevel, topic);
    const history = conversationHistory.slice(-10).map(m => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

    const response = await chatCompletion(
      systemPrompt,
      [...history, { role: 'user', content: userMessage }],
      { temperature: 0.8, maxTokens: 300 }
    );

    if (response && response.trim()) return response;
  } catch (error) {
    console.warn(`Tutor chat fallback used for ${language}:`, error);
  }

  return TUTOR_FALLBACK_RESPONSES[langKey] || TUTOR_FALLBACK_RESPONSES.hindi;
}

export async function generateConversationStarter(
  language: string,
  userLevel: string,
  topic: string
): Promise<string> {
  const langKey = language.toLowerCase();
  const cacheKey = generateInputHash({ language, userLevel, topic, type: 'starter' });
  const cached = await getCachedContent('conversation_starter', cacheKey);
  
  if (cached) return cached as string;

  try {
    const systemPrompt = buildTutorSystemPrompt(language, userLevel, topic);
    const userPrompt = `Start a friendly conversation with the student about "${topic}". Ask an engaging question to begin.`;

    const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
      temperature: 0.8,
      maxTokens: 200,
    });

    if (response && response.trim()) {
      await setCachedContent('conversation_starter', cacheKey, response, language, topic, userLevel);
      return response;
    }
  } catch (error) {
    console.warn(`Conversation starter fallback used for ${language}:`, error);
  }

  return TUTOR_FALLBACK_STARTERS[langKey] || TUTOR_FALLBACK_STARTERS.hindi;
}

export async function generateExplanation(
  language: string,
  concept: string,
  userLevel: string
): Promise<string> {
  const cacheKey = generateInputHash({ language, concept, userLevel, type: 'explanation' });
  const cached = await getCachedContent('explanation', cacheKey);
  
  if (cached) return cached as string;

  try {
    const systemPrompt = `You are a ${language} teacher. Explain the concept clearly for a ${userLevel} learner. 
Use examples, keep it simple, use ${language} script with transliteration.`;
    const userPrompt = `Explain "${concept}" in ${language} for a ${userLevel} learner.`;

    const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
      temperature: 0.6,
      maxTokens: 500,
    });

    if (response && response.trim()) {
      await setCachedContent('explanation', cacheKey, response, language, concept, userLevel);
      return response;
    }
  } catch (error) {
    console.warn(`Explanation fallback used for ${language}:`, error);
  }

  return `In ${language}, "${concept}" is expressed using core sentence structures with proper honorifics and vocabulary.`;
}