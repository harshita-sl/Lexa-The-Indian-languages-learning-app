/**
 * Scripted offline dialogues — served when every LLM provider fails so the
 * chat stays alive AND in-character. Each scenario is a progressive scene:
 * the reply index advances with the assistant turn count, so the
 * conversation moves forward (greet → negotiate → close) instead of looping
 * one canned line.
 *
 * These are hand-written (curated), not generated — safe to show as-is.
 */

export interface DialogueTurn {
  native: string;
  english: string;
  slang?: { term: string; translit?: string; gloss: string; register: 'casual' | 'very_informal' | 'rude' | 'regional' | 'formal'; region?: string }[];
}

const TELUGU: Record<string, DialogueTurn[]> = {
  auto: [
    {
      native: 'ఏయ్ సార్! ఎక్కడికి వెళ్తారు? చెప్పండి.',
      english: 'Hey sir! Where do you want to go? Tell me.',
      slang: [{ term: 'సార్', gloss: 'Casual "sir" — how drivers address customers', register: 'very_informal' }],
    },
    {
      native: 'మలక్‌పేటా? చాలా దూరం సార్. నూట యాభై పడుతుంది.',
      english: 'Malakpet? That\'s far, sir. It\'ll be ₹150.',
      slang: [{ term: 'నూట యాభై', translit: 'noota yabhai', gloss: '₹150 — literally "one hundred fifty"; drivers quote like this', register: 'casual' }],
    },
    {
      native: 'అబ్బా సార్, పెట్రోల్ ధర చూశారా? పైసా తగ్గదు. మీకు నూట ఇరవైకే చేస్తా.',
      english: 'Oh man sir, have you seen petrol prices? Can\'t reduce a paisa. For you, ₹120 final.',
      slang: [{ term: 'అబ్బా', gloss: '"Oh man!" — exasperation/amazement exclamation', register: 'very_informal', region: 'Telangana' }],
    },
    {
      native: 'సరే సరే, నూరు ఫైనల్. కుర్చోండి, వెళ్దాం!',
      english: 'Okay okay, ₹100 final. Sit, let\'s go!',
      slang: [{ term: 'కుర్చోండి', translit: 'kurchondi', gloss: '"Sit" — casual imperative', register: 'casual' }],
    },
    {
      native: 'చేరిపోయాం సార్. నూరు ఇవ్వండి.',
      english: 'We\'ve arrived sir. Give me ₹100.',
    },
  ],
  bargaining: [
    {
      native: 'ఏమి కావాలమ్మా? కూరగాయలు ఫ్రెష్‌గా ఉన్నాయి!',
      english: 'What do you need, dear? The vegetables are fresh!',
      slang: [{ term: 'అమ్మా', gloss: 'Affectionate "dear" — vendors use it for all customers', register: 'casual' }],
    },
    {
      native: 'టమాటాలు కిలో ఎనభై అమ్మా. రేటు తగ్గదు, నాకే తగ్గేది లేదు!',
      english: 'Tomatoes are ₹80 a kilo, dear. No discount — I barely make anything myself!',
    },
    {
      native: 'అయ్యో, డజన్ మందికి అయ్యావు గా! సరే, అరవైకి ఇస్తాను. ఇంకా తగ్గదు.',
      english: 'Ayyo, you bargain like a pro! Fine, ₹60 for you. Not a paisa less.',
      slang: [{ term: 'అయ్యో', gloss: '"Oh no!" — playful protest', register: 'casual' }],
    },
    {
      native: 'సరే తీసుకో అమ్మా. మళ్ళీ రా, పక్కా కస్టమర్ అయితే ఇంకా తగ్గిస్తా!',
      english: 'Fine, take it dear. Come again — become a regular and I\'ll cut you a better deal!',
    },
  ],
  food: [
    {
      native: 'సార్ ఏమి కావాలి? ఇడ్లీ, దోసె, పూరీ — అన్ని ఉన్నాయి.',
      english: 'Sir, what do you want? Idli, dosa, puri — we have everything.',
    },
    {
      native: 'ఒక మసాలా దోసె, ఒక టీ — సరిగ్గా? వెంటనే తెస్తాను.',
      english: 'One masala dosa, one tea — right? Bringing it right away.',
    },
    {
      native: 'ఏమైనా ఇంకా కావాలా సార్? వడా కూడా బాగుంటుంది.',
      english: 'Anything else sir? The vada is also great.',
    },
    {
      native: 'బిల్ నూట ఇరవై సార్. కౌంటర్‌కి చెల్లించండి.',
      english: 'The bill is ₹120 sir. Pay at the counter.',
    },
  ],
  friends: [
    {
      native: 'ఏయ్ ఏమిటి! చాలా రోజులైంది చూసి. ఏం జరుగుతోంది?',
      english: 'Hey! Long time no see. What\'s going on?',
      slang: [{ term: 'ఏమిటి', translit: 'Emiti', gloss: '"What\'s up" — casual opener between friends', register: 'very_informal' }],
    },
    {
      native: 'ఏంటో ఏమో, నా జీవితమంతా పనే. నువ్వు చెప్పు, మీ ప్రాజెక్ట్ ఎలా ఉంది?',
      english: 'Ugh, my life is all work these days. You tell me — how\'s your project going?',
      slang: [{ term: 'ఏంటో', gloss: '"Dunno/whatever" — classic hedging filler', register: 'very_informal' }],
    },
    {
      native: 'అదేంటి, ఇంత టెన్షన్ ఎందుకు? సరే, ఈ వీకెండ్ ట్రిప్ ప్లాన్ చేద్దాం!',
      english: 'Why so much stress? Fine — let\'s plan a trip this weekend!',
      slang: [{ term: 'అదేంటి', translit: 'Adenti', gloss: '"What\'s that? / Why?" — surprised reaction', register: 'casual' }],
    },
    {
      native: 'చాలు చాలు, ఫోన్ పెట్టు, టీ తాగుదాం ముందు.',
      english: 'Okay okay, put the phone down — let\'s have tea first.',
      slang: [{ term: 'చాలు', gloss: '"Enough / stop" — used playfully too', register: 'casual' }],
    },
  ],
  inlaws: [
    {
      native: 'రండి అమ్మా రండి! ఎలా ఉన్నారు? ప్రయాణం బాగుందా?',
      english: 'Come in, dear, come! How are you? Was your journey comfortable?',
    },
    {
      native: 'కూర్చోండి అమ్మా. టీ తాగుతారా కాఫీ తాగుతారా?',
      english: 'Sit down dear. Will you have tea or coffee?',
    },
    {
      native: 'మీ ఇంట్లో అందరు బాగున్నారా? మీ అమ్మగారు ఎలా ఉన్నారు?',
      english: 'Is everyone at your home well? How is your mother?',
    },
    {
      native: 'చాలా మంచి అమ్మాయివి/అబ్బాయివి అమ్మా. మా ఇంట్లోకి రావడం చాలా సంతోషం.',
      english: 'You\'re a lovely person, dear. We\'re so happy to have you in our family.',
    },
  ],
  office: [
    {
      native: 'ఏమిటి కార్తీక్, మీటింగ్ అయిపోయిందా? ఎలా అయింది?',
      english: 'Hey Karthik, done with the meeting? How did it go?',
      slang: [{ term: 'ఏమిటి', gloss: '"Hey what\'s up" — casual opener', register: 'very_informal' }],
    },
    {
      native: 'అయ్యో, బాస్ మళ్ళీ డెడ్‌లైన్ ముందుకు లాగాడు. లంచ్ వెళ్దాం రా?',
      english: 'Ayyo, the boss pulled the deadline forward again. Shall we go for lunch?',
    },
    {
      native: 'మీ ప్రాజెక్ట్ అప్డేట్ చెప్పు, స్టాండప్‌లో ఏం చెప్తానో తెలియాలి.',
      english: 'Give me your project update — I need to know what to say in standup.',
    },
    {
      native: 'సరే, ఈవ్నింగ్ ఫిబ్బరి ప్లాన్? ఫ్రైడే కదా, ఏమైనా చేద్దాం.',
      english: 'So, any plans for the evening? It\'s Friday after all — let\'s do something.',
    },
  ],
  free: [
    {
      native: 'నమస్కారం! ఏ విషయం గురించి మాట్లాడాలి?',
      english: 'Hello! What shall we talk about?',
    },
    {
      native: 'ఓహ్ ఇంట్రెస్టింగ్! ఇంకా చెప్పండి.',
      english: 'Oh interesting! Tell me more.',
    },
    {
      native: 'బాగుంది! మీరు తెలుగు చాలా బాగా మాట్లాడుతున్నారు.',
      english: 'Nice! You\'re speaking Telugu really well.',
      slang: [{ term: 'బాగా', gloss: '"A lot / really well" — intensifier', register: 'casual' }],
    },
    {
      native: 'సరే, మళ్ళీ మాట్లాడుదాం! బై!',
      english: 'Okay, let\'s talk again! Bye!',
    },
  ],
};

const KANNADA: Record<string, DialogueTurn[]> = {
  auto: [
    {
      native: 'ಏನ್ಸಾರ್! ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು? ಹೇಳಿ.',
      english: 'Hey sir! Where do you want to go? Tell me.',
      slang: [{ term: 'ಸಾರ್', gloss: 'Casual "sir" — driver address', register: 'very_informal' }],
    },
    {
      native: 'ಮಾಜestic ಅಲ್ಲವಾ? ಸ್ವಲ್ಪ ದೂರ ಸಾರ್. ನೂರಾ ಐವತ್ತು ಆಗುತ್ತೆ.',
      english: 'Majestic? A bit far sir. It\'ll be ₹150.',
      slang: [{ term: 'ನೂರಾ ಐವತ್ತು', gloss: '₹150 — "one fifty" in spoken Kannada', register: 'casual' }],
    },
    {
      native: 'ಅಯ್ಯೋ ಸಾರ್, ಪೆಟ್ರೋಲ್ ರೇಟು ನೋಡಿದ್ದೀರಾ? ನೂರಾ ಇಪ್ಪತ್ತಕ್ಕೆ ಕೊಡ್ತೀನಿ, ಫೈನಲ್.',
      english: 'Ayyo sir, have you seen petrol rates? I\'ll do ₹120 for you — final.',
      slang: [{ term: 'ಅಯ್ಯೋ', gloss: '"Oh man!" — exasperated exclamation', register: 'very_informal' }],
    },
    {
      native: 'ಸರಿ ಸರಿ, ನೂರು ಫೈನಲ್. ಕೂತ್ಕೋಳಿ, ಹೋಗೋಣ!',
      english: 'Okay okay, ₹100 final. Sit, let\'s go!',
    },
    {
      native: 'ಬಂದ್ ಬಿಟ್ಟು ಸಾರ್. ನೂರು ಕೊಡಿ.',
      english: 'We\'ve arrived sir. ₹100 please.',
    },
  ],
  bargaining: [
    {
      native: 'ಏನ್ ಬೇಕಮ್ಮಾ? ತರಕಾರಿ ಎಲ್ಲಾ ಫ್ರೆಶ್ ಇದೆ!',
      english: 'What do you need, dear? All the vegetables are fresh!',
      slang: [{ term: 'ಅಮ್ಮಾ', gloss: 'Affectionate "dear" — vendor address', register: 'casual' }],
    },
    {
      native: 'ಟೊಮ್ಯಾಟೊ ಕಿಲೋ ಎಂಬತ್ತು ಅಮ್ಮಾ. ಬೆಲೆ ಕಮ್ಮಿ ಆಗಲ್ಲ, ನನಗೂ ಲಾಭ ಇಲ್ಲ!',
      english: 'Tomatoes are ₹80 a kilo, dear. Can\'t lower it — I barely profit!',
    },
    {
      native: 'ಅಯ್ಯೋ, ತುಂಬಾ ಬಾರ್ಗೈನ್ ಮಾಡ್ತೀರಾ! ಸರಿ, ಅರವತ್ತಕ್ಕೆ ಕೊಡ್ತೀನಿ. ಇನ್ನೂ ಕಮ್ಮಿ ಆಗಲ್ಲ.',
      english: 'Ayyo, you bargain hard! Fine, ₹60. Not a paisa less.',
    },
    {
      native: 'ಸರಿ ತಗೊಳ್ಳಮ್ಮಾ. ಮತ್ತೆ ಬನ್ನಿ — ಪಕ್ಕಾ ಕಸ್ಟಮರ್ ಆದ್ರೆ ಇನ್ನೂ ಕಮ್ಮಿ ಮಾಡ್ತೀನಿ!',
      english: 'Fine, take it. Come again — regulars get better prices!',
    },
  ],
  food: [
    {
      native: 'ಸಾರ್ ಏನ್ ಬೇಕು? ಇಡ್ಲಿ, ದೋಸೆ, ಪೂರಿ — ಎಲ್ಲಾ ಇದೆ.',
      english: 'Sir, what do you want? Idli, dosa, puri — we have it all.',
    },
    {
      native: 'ಒಂದು ಮಸಾಲಾ ದೋಸೆ, ಒಂದು ಟೀ — ರೈಟ್? ಈಗ ತರ್ತೀನಿ.',
      english: 'One masala dosa, one tea — right? Bringing it now.',
    },
    {
      native: 'ಇನ್ನೇನಾದ್ರೂ ಬೇಕಾ ಸಾರ್? ವಡೆ ಕೂಡ ಚೆನ್ನಾಗಿದೆ.',
      english: 'Anything else sir? The vada is great too.',
    },
    {
      native: 'ಬಿಲ್ ನೂರಾ ಇಪ್ಪತ್ತು ಸಾರ್. ಕೌಂಟರ್‌ಗೆ ಪೇ ಮಾಡಿ.',
      english: 'Bill is ₹120 sir. Pay at the counter.',
    },
  ],
  friends: [
    {
      native: 'ಏಯ್ ಏನ್ಮಚ್ಚಾ! ತುಂಬಾ ದಿನ ಆಯ್ತು ನೋಡಿದ್ದಕ್ಕೆ. ಏನ್ ಸಮಾಚಾರ?',
      english: 'Hey dude! Long time no see. What\'s the news?',
      slang: [{ term: 'ಮಚ್ಚಾ', translit: 'machcha', gloss: '"Bro/dude" — literally brother-in-law, Bengaluru buddy slang', register: 'very_informal', region: 'Bengaluru' }],
    },
    {
      native: 'ಏನ್ಗೊತ್ತಿಲ್ಲ ಕಣೇ, ಕೆಲಸವೇ ಜೀವನ ಆಗ್ಬಿಟ್ಟು. ನಿನ್ನಂಡ್ ಹೇಳು, ಪ್ರಾಜೆಕ್ಟ್ ಹೇಗಿದೆ?',
      english: 'Dunno man, work has become my whole life. You tell me — how\'s your project?',
    },
    {
      native: 'ಅದೆಂತಾ ಟೆನ್ಷನ್ ಯಾಕೆ? ಸರಿ, ಈ ವೀಕೆಂಡ್ ಟ್ರಿಪ್ ಪ್ಲಾನ್ ಮಾಡೋಣ!',
      english: 'Why so much tension? Fine — let\'s plan a weekend trip!',
    },
    {
      native: 'ಸರಿ ಸರಿ, ಫೋನ್ ಇಡು, ಮೊದಲು ಚಹಾ ಕುಡಿಯೋಣ.',
      english: 'Okay okay, put the phone down — let\'s have tea first.',
    },
  ],
  inlaws: [
    {
      native: 'ಬನ್ನಿ ಅಮ್ಮ ಬನ್ನಿ! ಹೇಗಿದ್ದೀರಿ? ಪ್ರಯಾಣ ಚೆನ್ನಾಗಿತ್ತಾ?',
      english: 'Come in, dear! How are you? Was your journey comfortable?',
    },
    {
      native: 'ಕೂತ್ಕೊಳ್ಳಮ್ಮಾ. ಟೀ ಕುಡಿತೀರಾ ಕಾಫಿ ಕುಡಿತೀರಾ?',
      english: 'Sit down, dear. Will you have tea or coffee?',
    },
    {
      native: 'ಮನೆಯಲ್ಲಿ ಎಲ್ಲರೂ ಚೆನ್ನಾಗಿದ್ದಾರಾ? ನಿಮ್ಮಮ್ಮ ಹೇಗಿದ್ದಾರೆ?',
      english: 'Is everyone at your home well? How is your mother?',
    },
    {
      native: 'ತುಂಬಾ ಚೆನ್ನಾಗಿದ್ದೀರಾ ಅಮ್ಮ. ನಮ್ಮ ಮನೆಗೆ ಬಂದಿದ್ದು ಸಂತೋಷ.',
      english: 'You\'re lovely, dear. We\'re happy you\'re part of our family.',
    },
  ],
  office: [
    {
      native: 'ಏನ್ಸರ್, ಮೀಟಿಂಗ್ ಮುಗೀತಾ? ಹೇಗಾಯ್ತು?',
      english: 'Hey, done with the meeting? How did it go?',
    },
    {
      native: 'ಅಯ್ಯೋ, ಬಾಸ್ ಮತ್ತೆ ಡೆಡ್‌ಲೈನ್ ಮುಂದೆ ತಂದ್ರು. ಲಂಚ್ ಹೋಗೋಣವಾ?',
      english: 'Ayyo, the boss pulled the deadline forward again. Lunch?',
    },
    {
      native: 'ನಿನ್ನ ಪ್ರಾಜೆಕ್ಟ್ ಅಪ್‌ಡೇಟ್ ಹೇಳು, ಸ್ಟಾಂಡಪ್‌ಲಿ ಏನ್ ಹೇಳುವುದು ಗೊತ್ತಾಗಲಿ.',
      english: 'Give me your project update — I need to know what to say in standup.',
    },
    {
      native: 'ಸರಿ, ಈವ್ನಿಂಗ್ ಏನ್ ಪ್ಲಾನ್? ಫ್ರೈಡೆ ಅಲ್ವಾ, ಏನಾದ್ರೂ ಮಾಡೋಣ.',
      english: 'So, evening plans? It\'s Friday — let\'s do something.',
    },
  ],
  free: [
    {
      native: 'ನಮಸ್ಕಾರ! ಯಾವ್ ವಿಷಯದ ಬಗ್ಗೆ ಮಾತಾಡ್ಬೇಕು?',
      english: 'Hello! What shall we talk about?',
    },
    {
      native: 'ಓಹ್ ಇಂಟ್ರೆಸ್ಟಿಂಗ್! ಇನ್ನೂ ಹೇಳಿ.',
      english: 'Oh interesting! Tell me more.',
    },
    {
      native: 'ಚೆನ್ನಾಗಿದೆ! ನೀವು ಕನ್ನಡ ತುಂಬಾ ಚೆನ್ನಾಗಿ ಮಾತಾಡ್ತಿದ್ದೀರಿ.',
      english: 'Nice! You\'re speaking Kannada really well.',
    },
    {
      native: 'ಸರಿ, ಮತ್ತೆ ಮಾತಾಡೋಣ! ಬೈ!',
      english: 'Okay, talk again soon! Bye!',
    },
  ],
};

const GENERIC_FALLBACK: DialogueTurn[] = [
  {
    native: 'Nice! Say that again?',
    english: "(Let's keep going — I'm having trouble thinking right now.)",
  },
];

export function offlineReply(
  language: string,
  scenario: string,
  assistantTurnIndex: number
): DialogueTurn {
  const lang = language.toLowerCase();
  const table = lang === 'telugu' ? TELUGU : lang === 'kannada' ? KANNADA : undefined;
  const pool = table?.[scenario] ?? table?.free ?? GENERIC_FALLBACK;
  return pool[Math.min(assistantTurnIndex, pool.length - 1) % pool.length];
}
