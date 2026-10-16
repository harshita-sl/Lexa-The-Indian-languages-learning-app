import { chatCompletion } from './llm';
import { getCachedContent, setCachedContent, generateInputHash } from './cache';
import { CHALLENGE_GENERATION_PROMPT } from './prompts/challenge-prompts';
import { ChallengeInput, GeneratedChallenge } from './types';

// Fallback challenges per Indian language to guarantee offline/resilient demo reliability
const LANGUAGE_FALLBACKS: Record<string, GeneratedChallenge[]> = {
  hindi: [
    {
      question: 'Which of the following is the correct translation for "Hello" in Hindi?',
      type: 'SELECT',
      options: [
        { text: 'नमस्ते (Namaste)', correct: true },
        { text: 'धन्यवाद (Dhanyavaad)', correct: false },
        { text: 'शुभरात्रि (Shubhratri)', correct: false },
        { text: 'हाँ (Haan)', correct: false },
      ],
      correctAnswer: 'नमस्ते (Namaste)',
      explanation: '"Namaste" is the traditional and respectful greeting used across Hindi-speaking regions.',
      hints: ['It starts with Nam...'],
      difficulty: 1,
    },
    {
      question: 'Complete the sentence: "मैं ___ हूँ" (I am a student).',
      type: 'ASSIST',
      options: [
        { text: 'छात्र (chhatra)', correct: true },
        { text: 'पानी (paani)', correct: false },
        { text: 'किताब (kitaab)', correct: false },
        { text: 'घर (ghar)', correct: false },
      ],
      correctAnswer: 'छात्र (chhatra)',
      explanation: '"Chhatra" means student in Hindi.',
      hints: ['Word for student'],
      difficulty: 1,
    },
    {
      question: 'Translate to English: "यह एक सुंदर घर है।"',
      type: 'TRANSLATE',
      options: [
        { text: 'This is a beautiful house.', correct: true },
        { text: 'This is a big school.', correct: false },
        { text: 'That is a blue car.', correct: false },
        { text: 'I love drinking tea.', correct: false },
      ],
      correctAnswer: 'This is a beautiful house.',
      explanation: '"Yeh" = This, "sundar" = beautiful, "ghar" = house.',
      hints: ['Sundar means beautiful'],
      difficulty: 2,
    },
    {
      question: 'What is "Water" in Hindi?',
      type: 'SELECT',
      options: [
        { text: 'जल / पानी (Paani)', correct: true },
        { text: 'रोटी (Roti)', correct: false },
        { text: 'हवा (Hawa)', correct: false },
        { text: 'दूध (Doodh)', correct: false },
      ],
      correctAnswer: 'जल / पानी (Paani)',
      explanation: '"Paani" is the commonly used word for water in Hindi.',
      hints: ['Starts with P'],
      difficulty: 1,
    },
    {
      question: 'Reorder into a correct Hindi sentence: "नाम / मेरा / है / राज"',
      type: 'ORDER',
      options: [
        { text: 'मेरा नाम राज है (Mera naam Raj hai)', correct: true },
        { text: 'राज है मेरा नाम (Raj hai mera naam)', correct: false },
        { text: 'है नाम मेरा राज (Hai naam mera Raj)', correct: false },
        { text: 'नाम राज मेरा है (Naam Raj mera hai)', correct: false },
      ],
      correctAnswer: 'मेरा नाम राज है (Mera naam Raj hai)',
      explanation: 'Subject (Mera naam) + Complement (Raj) + Verb (hai).',
      hints: ['Start with Mera'],
      difficulty: 2,
    },
  ],
  telugu: [
    {
      question: 'What is the word for "Bed" in Telugu?',
      type: 'SELECT',
      options: [
        { text: 'మంచం (Mancham)', correct: true },
        { text: 'కుర్చీ (Kurchi)', correct: false },
        { text: 'సూర్యుడు (Suryudu)', correct: false },
        { text: 'ఇల్లు (Illu)', correct: false },
      ],
      correctAnswer: 'మంచం (Mancham)',
      explanation: '"Mancham" translates to bed in Telugu.',
      hints: ['Starts with M'],
      difficulty: 1,
    },
    {
      question: 'Translate to English: "నమస్కారం! మీరు ఎలా ఉన్నారు?"',
      type: 'TRANSLATE',
      options: [
        { text: 'Hello! How are you?', correct: true },
        { text: 'Good morning! What is your name?', correct: false },
        { text: 'Where are you going?', correct: false },
        { text: 'Thank you very much!', correct: false },
      ],
      correctAnswer: 'Hello! How are you?',
      explanation: '"Namaskaram" = Hello, "Meeru ela unnaru" = How are you?',
      hints: ['Greeting followed by asking wellbeing'],
      difficulty: 1,
    },
    {
      question: 'Complete the blank: "నేను ___ తింటున్నాను" (I am eating rice).',
      type: 'ASSIST',
      options: [
        { text: 'అన్నం (Annam)', correct: true },
        { text: 'నీళ్ళు (Neellu)', correct: false },
        { text: 'పుస్తకం (Pustakam)', correct: false },
        { text: 'కారు (Kaaru)', correct: false },
      ],
      correctAnswer: 'అన్నం (Annam)',
      explanation: '"Annam" is rice in Telugu.',
      hints: ['Telugu word for cooked rice'],
      difficulty: 2,
    },
    {
      question: 'Which word means "House" in Telugu?',
      type: 'SELECT',
      options: [
        { text: 'ఇల్లు (Illu)', correct: true },
        { text: 'చెట్టు (Chettu)', correct: false },
        { text: 'బావి (Baavi)', correct: false },
        { text: 'దారి (Daari)', correct: false },
      ],
      correctAnswer: 'ఇల్లు (Illu)',
      explanation: '"Illu" is house/home in Telugu.',
      hints: ['Short 2-letter script word'],
      difficulty: 1,
    },
    {
      question: 'How do you say "Thank you" in Telugu?',
      type: 'SELECT',
      options: [
        { text: 'ధన్యవాదాలు (Dhanyavaadalu)', correct: true },
        { text: 'శుభోదయం (Shubhodayam)', correct: false },
        { text: 'వస్తున్నాను (Vastunnanu)', correct: false },
        { text: 'రండి (Randi)', correct: false },
      ],
      correctAnswer: 'ధన్యవాదాలు (Dhanyavaadalu)',
      explanation: '"Dhanyavaadalu" is thank you in Telugu.',
      hints: ['Expressing gratitude'],
      difficulty: 1,
    },
  ],
  kannada: [
    {
      question: 'How do you say "Namaskara! How are you?" in Kannada?',
      type: 'TRANSLATE',
      options: [
        { text: 'ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ? (Namaskara! Neavu hegiddiri?)', correct: true },
        { text: 'ನಿಮ್ಮ ಹೆಸರೇನು? (Nimma hesarenu?)', correct: false },
        { text: 'ಧನ್ಯವಾದಗಳು (Dhanyavadagalu)', correct: false },
        { text: 'ಶುಭ ರಾತ್ರಿ (Shubha ratri)', correct: false },
      ],
      correctAnswer: 'ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ? (Namaskara! Neavu hegiddiri?)',
      explanation: '"Hegiddiri" means how are you in Kannada.',
      hints: ['Hegiddiri'],
      difficulty: 1,
    },
    {
      question: 'What is "Water" in Kannada?',
      type: 'SELECT',
      options: [
        { text: 'ನೀರು (Neeru)', correct: true },
        { text: 'ಹಾಲು (Haalu)', correct: false },
        { text: 'ಅನ್ನ (Anna)', correct: false },
        { text: 'ಮನೆ (Mane)', correct: false },
      ],
      correctAnswer: 'ನೀರು (Neeru)',
      explanation: '"Neeru" is water in Kannada.',
      hints: ['Starts with N'],
      difficulty: 1,
    },
    {
      question: 'What does "ಮನೆ" (Mane) mean in Kannada?',
      type: 'SELECT',
      options: [
        { text: 'House / Home', correct: true },
        { text: 'Tree', correct: false },
        { text: 'Car', correct: false },
        { text: 'Book', correct: false },
      ],
      correctAnswer: 'House / Home',
      explanation: '"Mane" means house or home in Kannada.',
      hints: ['Where you live'],
      difficulty: 1,
    },
  ],
  tamil: [
    {
      question: 'How do you say "Hello" in Tamil?',
      type: 'SELECT',
      options: [
        { text: 'வணக்கம் (Vanakkam)', correct: true },
        { text: 'நன்றி (Nandri)', correct: false },
        { text: 'காலை வணக்கம் (Kaalai Vanakkam)', correct: false },
        { text: 'வாருங்கள் (Vaarungal)', correct: false },
      ],
      correctAnswer: 'வணக்கம் (Vanakkam)',
      explanation: '"Vanakkam" is the traditional Tamil greeting.',
      hints: ['Traditional greeting'],
      difficulty: 1,
    },
    {
      question: 'What is "Thank you" in Tamil?',
      type: 'SELECT',
      options: [
        { text: 'நன்றி (Nandri)', correct: true },
        { text: 'வணக்கம் (Vanakkam)', correct: false },
        { text: 'சரி (Sari)', correct: false },
        { text: 'இல்லை (Illai)', correct: false },
      ],
      correctAnswer: 'நன்றி (Nandri)',
      explanation: '"Nandri" means thank you in Tamil.',
      hints: ['Expressing gratitude'],
      difficulty: 1,
    },
  ],
  bengali: [
    {
      question: 'What is the Bengali greeting for "Hello / Greetings"?',
      type: 'SELECT',
      options: [
        { text: 'নমস্কার (Namaskar)', correct: true },
        { text: 'ধন্যবাদ (Dhonyobad)', correct: false },
        { text: 'শুভ রাত্রি (Shubho ratri)', correct: false },
        { text: 'হ্যাঁ (Hae)', correct: false },
      ],
      correctAnswer: 'নমস্কার (Namaskar)',
      explanation: '"Namaskar" is the respectful greeting in Bengali.',
      hints: ['Starts with N'],
      difficulty: 1,
    },
  ],
  marathi: [
    {
      question: 'How do you say "How are you?" in Marathi?',
      type: 'SELECT',
      options: [
        { text: 'तुम्ही कसे आहात? (Tumhi kase aahat?)', correct: true },
        { text: 'तुमचे नाव काय आहे? (Tumche naav kaay aahe?)', correct: false },
        { text: 'धन्यवाद (Dhanyavaad)', correct: false },
        { text: 'शुभ प्रभात (Shubh Prabhat)', correct: false },
      ],
      correctAnswer: 'तुम्ही कसे आहात? (Tumhi kase aahat?)',
      explanation: '"Tumhi kase aahat" asks how are you politely in Marathi.',
      hints: ['Asking wellbeing'],
      difficulty: 1,
    },
  ],
  gujarati: [
    {
      question: 'How do you say "Hello / Greetings" in Gujarati?',
      type: 'SELECT',
      options: [
        { text: 'કેમ છો / નમસ્તે (Kem cho / Namaste)', correct: true },
        { text: 'આભાર (Aabhar)', correct: false },
        { text: 'આવજો (Aavjo)', correct: false },
        { text: 'હા (Haa)', correct: false },
      ],
      correctAnswer: 'કેમ છો / નમસ્તે (Kem cho / Namaste)',
      explanation: '"Kem cho" is the classic friendly Gujarati greeting.',
      hints: ['Kem cho'],
      difficulty: 1,
    },
  ],
};

export async function generateChallenge(input: ChallengeInput): Promise<GeneratedChallenge> {
  const cacheKey = generateInputHash(input as unknown as Record<string, unknown>);
  const cached = await getCachedContent('challenge', cacheKey);

  if (cached) {
    console.log('Challenge served from cache');
    const c = cached as GeneratedChallenge;
    if (input.conceptId && !c.conceptId) c.conceptId = input.conceptId;
    return c;
  }

  try {
    const systemPrompt = CHALLENGE_GENERATION_PROMPT
      .replace('{language}', input.language)
      .replace('{challengeType}', input.challengeType)
      .replace('{topic}', input.topic)
      .replace('{difficulty}', input.difficulty)
      .replace('{vocabulary}', input.vocabulary?.join(', ') || 'general')
      .replace('{context}', input.context || 'general lesson')
      .replace('{userLevel}', input.userLevel || 'beginner');

    const userPrompt = `Generate a ${input.challengeType} challenge for ${input.language} on the topic "${input.topic}" at ${input.difficulty} level. Return JSON.`;

    const response = await chatCompletion(systemPrompt, [{ role: 'user', content: userPrompt }], {
      temperature: 0.7,
      responseFormat: 'json',
    });

    const challenge: GeneratedChallenge = JSON.parse(response);
    if (input.conceptId) challenge.conceptId = input.conceptId;
    await setCachedContent(
      'challenge',
      cacheKey,
      challenge,
      input.language,
      input.topic,
      input.difficulty
    );
    return challenge;
  } catch (error) {
    console.warn(`AI Challenge generation fallback used for ${input.language}:`, error);
    const fb = getFallbackChallenge(input.language, input.challengeType);
    if (input.conceptId) fb.conceptId = input.conceptId;
    return fb;
  }
}

function getFallbackChallenge(language: string, type: string, index: number = 0): GeneratedChallenge {
  const langKey = language.toLowerCase();
  const pool = LANGUAGE_FALLBACKS[langKey] || LANGUAGE_FALLBACKS.hindi;
  const match = pool[index % pool.length] || pool.find(c => c.type === type) || pool[0];
  return match;
}

export async function generateMultipleChallenges(
  input: ChallengeInput,
  count: number = 5
): Promise<GeneratedChallenge[]> {
  const challenges: GeneratedChallenge[] = [];
  const langKey = input.language.toLowerCase();
  const pool = LANGUAGE_FALLBACKS[langKey] || LANGUAGE_FALLBACKS.hindi;
  const typesSequence: ChallengeInput['challengeType'][] = ['SELECT', 'TRANSLATE', 'ASSIST', 'SELECT', 'ORDER'];

  for (let i = 0; i < count; i++) {
    const targetType = typesSequence[i % typesSequence.length];
    try {
      const challengeInput: ChallengeInput = {
        ...input,
        challengeType: targetType,
        context: `${input.context || 'lesson'} - question_${i + 1}_var_${i}`,
      };
      const challenge = await generateChallenge(challengeInput);
      challenges.push(challenge);
    } catch {
      const fallback = pool[i % pool.length];
      challenges.push(fallback);
    }
  }

  return challenges;
}

export function getChallengeTypesForLevel(level: string): ChallengeInput['challengeType'][] {
  switch (level) {
    case 'beginner':
      return ['SELECT', 'MATCH', 'ASSIST'];
    case 'intermediate':
      return ['SELECT', 'ASSIST', 'TRANSLATE', 'ORDER'];
    case 'advanced':
      return ['TRANSLATE', 'CONVERSATION', 'SPEAK', 'LISTEN', 'ORDER'];
    default:
      return ['SELECT', 'ASSIST', 'TRANSLATE'];
  }
}