/**
 * Seed content for the adaptive path.
 * - practice_items: concept-tagged question bank (source='seed', reviewStatus='seeded')
 * - spoken_content: slang/idiom/colloquial KB — reviewStatus='unreviewed'
 *   until a native speaker validates it (never presented as verified).
 */

export interface SeedItem {
  language: string;
  conceptId: string;
  skill: string;
  type: string;
  payload: {
    question: string;
    options: { text: string; correct: boolean }[];
    correctAnswer: string;
    explanation: string;
    hints: string[];
  };
}

export interface SeedSpoken {
  language: string;
  kind: string;
  nativeText: string;
  translit: string;
  gloss: string;
  register: string;
  region?: string;
  example?: { native: string; translit: string; english: string };
  conceptId?: string;
}

export const PRACTICE_ITEMS: SeedItem[] = [
  // ── Telugu ───────────────────────────────────────────────────────────────
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_short', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the short vowel "a"?',
      options: [{ text: 'అ', correct: true }, { text: 'ఆ', correct: false }, { text: 'ఇ', correct: false }, { text: 'ఉ', correct: false }],
      correctAnswer: 'అ', explanation: 'అ is the short vowel "a"; ఆ is the long "aa".', hints: ['Shortest form'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_long', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the long vowel "aa"?',
      options: [{ text: 'ఆ', correct: true }, { text: 'అ', correct: false }, { text: 'ఈ', correct: false }, { text: 'ఊ', correct: false }],
      correctAnswer: 'ఆ', explanation: 'ఆ is long "aa" — held twice as long as అ.', hints: ['Longer twin'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_consonants_kvarga', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which is "ka", the first consonant of ka-varga?',
      options: [{ text: 'క', correct: true }, { text: 'ఖ', correct: false }, { text: 'గ', correct: false }, { text: 'ఘ', correct: false }],
      correctAnswer: 'క', explanation: 'క ka is unaspirated; ఖ kha is the aspirated form.', hints: ['First in the group'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'How do you greet someone respectfully in Telugu?',
      options: [{ text: 'నమస్కారం (Namaskaram)', correct: true }, { text: 'ధన్యవాదాలు (Dhanyavadalu)', correct: false }, { text: 'సరే (Sare)', correct: false }, { text: 'అయ్యో (Ayyo)', correct: false }],
      correctAnswer: 'నమస్కారం (Namaskaram)', explanation: 'Namaskaram is the standard respectful greeting.', hints: ['N-a-m-…'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'vocabulary', type: 'TRANSLATE',
    payload: {
      question: 'Translate: "నమస్కారం! మీరు ఎలా ఉన్నారు?"',
      options: [{ text: 'Hello! How are you?', correct: true }, { text: 'Good morning! What is your name?', correct: false }, { text: 'Where are you going?', correct: false }, { text: 'Thank you very much!', correct: false }],
      correctAnswer: 'Hello! How are you?', explanation: 'Namaskaram = hello; meeru ela unnaru = how are you (formal).', hints: ['Greeting + wellbeing question'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_numbers_1_10', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ఐదు" (Ayidu) is which number?',
      options: [{ text: 'Five', correct: true }, { text: 'Three', correct: false }, { text: 'Seven', correct: false }, { text: 'Nine', correct: false }],
      correctAnswer: 'Five', explanation: 'Ayidu = 5. Rendu=2, moodu=3, naalugu=4.', hints: ['Think of "aidu"'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What does "అమ్మ" (Amma) mean?',
      options: [{ text: 'Mother', correct: true }, { text: 'Father', correct: false }, { text: 'Sister', correct: false }, { text: 'Grandmother', correct: false }],
      correctAnswer: 'Mother', explanation: 'Amma = mother; Nanna = father.', hints: ['A loving word'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What is "water" in Telugu?',
      options: [{ text: 'నీళ్ళు (Neellu)', correct: true }, { text: 'అన్నం (Annam)', correct: false }, { text: 'పాలు (Paalu)', correct: false }, { text: 'కాఫీ (Kaafi)', correct: false }],
      correctAnswer: 'నీళ్ళు (Neellu)', explanation: 'Neellu = water; Annam = cooked rice.', hints: ['N-ee-llu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_basic', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నేను" (Nenu) means?',
      options: [{ text: 'I', correct: true }, { text: 'You (informal)', correct: false }, { text: 'He', correct: false }, { text: 'We', correct: false }],
      correctAnswer: 'I', explanation: 'Nenu = I; Nuvvu = you (informal); Meeru = you (formal).', hints: ['First person'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_honorific', skill: 'conversation', type: 'SELECT',
    payload: {
      question: 'Speaking to an elder, which "you" is respectful?',
      options: [{ text: 'మీరు (Meeru)', correct: true }, { text: 'నువ్వు (Nuvvu)', correct: false }, { text: 'నీవు (Neevu)', correct: false }, { text: 'నేను (Nenu)', correct: false }],
      correctAnswer: 'మీరు (Meeru)', explanation: 'Meeru is the honorific "you"; nuvvu is for close friends/juniors.', hints: ['Formal register'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_present_aa', skill: 'grammar', type: 'ASSIST',
    payload: {
      question: 'Complete: "నేను తిన___" (I am eating)',
      options: [{ text: 'టున్నాను (tunnanu)', correct: true }, { text: 'నాను (nanu)', correct: false }, { text: 'తాను (taanu)', correct: false }, { text: 'డాను (daanu)', correct: false }],
      correctAnswer: 'టున్నాను (tunnanu)', explanation: '"నేను తింటున్నాను" — present tense -tunnanu for first person.', hints: ['Present continuous suffix'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_past_aa', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ఆమె వచ్చింది" means?',
      options: [{ text: 'She came', correct: true }, { text: 'She is coming', correct: false }, { text: 'She will come', correct: false }, { text: 'She goes', correct: false }],
      correctAnswer: 'She came', explanation: 'Vachchindi = came (past tense, -indi).', hints: ['Past tense -indi'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vibhakti_dative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నాకు" (naaku) in "నాకు నీళ్ళు కావాలి" marks which case?',
      options: [{ text: 'Dative — "to me"', correct: true }, { text: 'Locative — "in me"', correct: false }, { text: 'Accusative — "me as object"', correct: false }, { text: 'Nominative — "I"', correct: false }],
      correctAnswer: 'Dative — "to me"', explanation: '-ku/-ki marks the indirect object ("to me/for me").', hints: ['Recipient'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_syntax_sov', skill: 'grammar', type: 'ORDER',
    payload: {
      question: 'Correct Telugu word order for "I water drink"?',
      options: [{ text: 'నేను నీళ్ళు త్రాగుతాను', correct: true }, { text: 'నీళ్ళు నేను త్రాగుతాను అని', correct: false }, { text: 'త్రాగుతాను నేను నీళ్ళు', correct: false }, { text: 'నేను త్రాగుతాను నీళ్ళు అంటే', correct: false }],
      correctAnswer: 'నేను నీళ్ళు త్రాగుతాను', explanation: 'Telugu is SOV: subject (nenu) → object (neellu) → verb (traaguthaanu).', hints: ['Verb last'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_negation_ledhu', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నాకు తెలియదు" (naaku teliyadu) means?',
      options: [{ text: "I don't know", correct: true }, { text: 'I know', correct: false }, { text: 'I forgot', correct: false }, { text: 'Tell me', correct: false }],
      correctAnswer: "I don't know", explanation: 'Teliyadu = is not known (negation with -du).', hints: ['Negative'],
    },
  },
  // ── Kannada ──────────────────────────────────────────────────────────────
  {
    language: 'kannada', conceptId: 'kannada_script_vowels', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the vowel "a" in Kannada?',
      options: [{ text: 'ಅ', correct: true }, { text: 'ಆ', correct: false }, { text: 'ಇ', correct: false }, { text: 'ಋ', correct: false }],
      correctAnswer: 'ಅ', explanation: 'ಅ is short "a"; ಆ is long "aa".', hints: ['First vowel'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_script_consonants', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "ka"?',
      options: [{ text: 'ಕ', correct: true }, { text: 'ಗ', correct: false }, { text: 'ಚ', correct: false }, { text: 'ತ', correct: false }],
      correctAnswer: 'ಕ', explanation: 'ಕ ka — first consonant of the ka-varga.', hints: ['ka-varga lead'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'How do you say "Hello / Greetings" in Kannada?',
      options: [{ text: 'ನಮಸ್ಕಾರ (Namaskara)', correct: true }, { text: 'ಧನ್ಯವಾದ (Dhanyavada)', correct: false }, { text: 'ಹೇಗಿದ್ದೀರಾ (Hegiddira)', correct: false }, { text: 'ಬನ್ನಿ (Banni)', correct: false }],
      correctAnswer: 'ನಮಸ್ಕಾರ (Namaskara)', explanation: 'Namaskara is the universal Kannada greeting.', hints: ['Nama-…'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'vocabulary', type: 'TRANSLATE',
    payload: {
      question: 'Translate: "ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ?"',
      options: [{ text: 'Hello! How are you?', correct: true }, { text: 'Hello! Where are you?', correct: false }, { text: 'Welcome! Sit down.', correct: false }, { text: 'Good night! Sleep well.', correct: false }],
      correctAnswer: 'Hello! How are you?', explanation: 'Neavu hegiddiri = how are you (formal).', hints: ['Wellbeing question'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_numbers', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಎರಡು" (Eradu) is which number?',
      options: [{ text: 'Two', correct: true }, { text: 'Four', correct: false }, { text: 'Eight', correct: false }, { text: 'One', correct: false }],
      correctAnswer: 'Two', explanation: 'Eradu = 2; ondu=1, mooru=3.', hints: ['E-…'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಅಮ್ಮ" (Amma) means?',
      options: [{ text: 'Mother', correct: true }, { text: 'Father', correct: false }, { text: 'Brother', correct: false }, { text: 'Grandmother', correct: false }],
      correctAnswer: 'Mother', explanation: 'Amma = mother; Appa = father.', hints: ['Same as many Indic languages'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What is "water" in Kannada?',
      options: [{ text: 'ನೀರು (Neeru)', correct: true }, { text: 'ಅನ್ನ (Anna)', correct: false }, { text: 'ಹಾಲು (Haalu)', correct: false }, { text: 'ತೀ (Tea)', correct: false }],
      correctAnswer: 'ನೀರು (Neeru)', explanation: 'Neeru = water; anna = cooked rice/meal.', hints: ['N-ee-ru'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_pronouns_neenu_neevu', skill: 'conversation', type: 'SELECT',
    payload: {
      question: 'To a respected elder, which "you" is correct?',
      options: [{ text: 'ನೀವು (Neevu)', correct: true }, { text: 'ನೀನು (Neenu)', correct: false }, { text: 'ಅವನು (Avanu)', correct: false }, { text: 'ನಾವು (Naavu)', correct: false }],
      correctAnswer: 'ನೀವು (Neevu)', explanation: 'Neevu = formal you; neenu = informal you.', hints: ['Formal plural-form'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_present', skill: 'grammar', type: 'ASSIST',
    payload: {
      question: 'Complete: "ನಾನು ಓದು___" (I am reading)',
      options: [{ text: 'ತ್ತೇನೆ (ttene)', correct: true }, { text: 'ದೆನು (denu)', correct: false }, { text: 'ಳೆನು (lenu)', correct: false }, { text: 'ವೆನು (venu)', correct: false }],
      correctAnswer: 'ತ್ತೇನೆ (ttene)', explanation: '"ನಾನು ಓದುತ್ತೇನೆ" — present continuous -uttene.', hints: ['-utt- marks present'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_past', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ಅವನು ಬಂದನು" means?',
      options: [{ text: 'He came', correct: true }, { text: 'He is coming', correct: false }, { text: 'He will come', correct: false }, { text: 'He went', correct: false }],
      correctAnswer: 'He came', explanation: 'Bandanu = he came (past tense).', hints: ['Past -anu'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_dative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ನನಗೆ" (nanage) means?',
      options: [{ text: 'To me / for me', correct: true }, { text: 'In me', correct: false }, { text: 'With me', correct: false }, { text: 'My', correct: false }],
      correctAnswer: 'To me / for me', explanation: '-ge is the dative marker (to/for).', hints: ['Recipient marker'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_locative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ಮನೆಯಲ್ಲಿ" (maneyalli) means?',
      options: [{ text: 'In the house', correct: true }, { text: 'To the house', correct: false }, { text: 'The house', correct: false }, { text: 'My house', correct: false }],
      correctAnswer: 'In the house', explanation: '-alli is the locative marker (in/at).', hints: ['Location'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_negation_illa', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ನನಗೆ ಗೊತ್ತಿಲ್ಲ" (nanage gottilla) means?',
      options: [{ text: "I don't know", correct: true }, { text: 'I know', correct: false }, { text: 'Tell me', correct: false }, { text: 'I forgot', correct: false }],
      correctAnswer: "I don't know", explanation: 'Illa negates "to have/be" — gottilla = not known.', hints: ['illa = not'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_syntax_sov', skill: 'grammar', type: 'ORDER',
    payload: {
      question: 'Correct Kannada order for "I coffee drink"?',
      options: [{ text: 'ನಾನು ಕಾಫಿ ಕುಡಿಯುತ್ತೇನೆ', correct: true }, { text: 'ಕಾಫಿ ನಾನು ಕುಡಿಯುತ್ತೇನೆ ಅಂತ', correct: false }, { text: 'ಕುಡಿಯುತ್ತೇನೆ ನಾನು ಕಾಫಿ', correct: false }, { text: 'ನಾನು ಕುಡಿಯುತ್ತೇನೆ ಕಾಫಿ ನೂ', correct: false }],
      correctAnswer: 'ನಾನು ಕಾಫಿ ಕುಡಿಯುತ್ತೇನೆ', explanation: 'Kannada is SOV: naanu → kaafi → kudiyuttene.', hints: ['Verb last'],
    },
  },
];

export const SPOKEN_CONTENT: SeedSpoken[] = [
  // ── Telugu colloquial ────────────────────────────────────────────────────
  { language: 'telugu', kind: 'colloquial', nativeText: 'ఏమిటి?', translit: 'Emiti?', gloss: 'What is it? / What\'s up?', register: 'casual', conceptId: 'telugu_vocab_greetings', example: { native: 'ఏమిటి ఇది?', translit: 'Emiti idi?', english: 'What is this?' } },
  { language: 'telugu', kind: 'colloquial', nativeText: 'ఏమండీ', translit: 'Emandi', gloss: 'Casual attention-getter ("hey", "what\'s up"); informal only', register: 'very_informal', region: 'Telangana', conceptId: 'telugu_vocab_greetings' },
  { language: 'telugu', kind: 'colloquial', nativeText: 'కదా', translit: 'kada', gloss: 'Tag question: "right? / isn\'t it?"', register: 'casual', example: { native: 'మంచిది కదా!', translit: 'Manchidi kada!', english: 'It\'s good, right?' } },
  { language: 'telugu', kind: 'colloquial', nativeText: 'అయ్యో', translit: 'Ayyo', gloss: 'Exclamation: "oh no! / ouch!"', register: 'casual', example: { native: 'అయ్యో! మళ్ళీ?', translit: 'Ayyo! Malli?', english: 'Oh no! Again?' } },
  { language: 'telugu', kind: 'colloquial', nativeText: 'సరే', translit: 'Sare', gloss: '"Okay / alright" — universal agreement particle', register: 'casual' },
  { language: 'telugu', kind: 'colloquial', nativeText: 'పర్లేదు', translit: 'Parledu', gloss: '"It\'s fine / no problem / never mind"', register: 'casual' },
  { language: 'telugu', kind: 'colloquial', nativeText: 'చాలు', translit: 'Chaalu', gloss: '"Enough / that\'s it / stop"', register: 'casual' },
  { language: 'telugu', kind: 'slang', nativeText: 'బంగారం', translit: 'Bangaram', gloss: 'Literally "gold"; affectionate term like "darling/sweetheart"', register: 'casual', conceptId: 'telugu_vocab_family' },
  { language: 'telugu', kind: 'slang', nativeText: 'బాగా', translit: 'baaga', gloss: '"A lot / hard" — intensifier: baaga thinnaanu = ate a lot', register: 'casual' },
  { language: 'telugu', kind: 'slang', nativeText: 'ఏంటో', translit: 'ento', gloss: '"Dunno / whatever / hmm" — hedging filler', register: 'very_informal' },
  { language: 'telugu', kind: 'phrase', nativeText: 'ఎంత అయింది?', translit: 'Enta ayindi?', gloss: '"How much is it?" — essential for shopping/autos', register: 'casual', conceptId: 'telugu_vocab_numbers_1_10' },
  { language: 'telugu', kind: 'phrase', nativeText: 'తగ్గించండి', translit: 'Tagginchandi', gloss: '"Reduce (the price) please" — bargaining', register: 'casual' },
  { language: 'telugu', kind: 'phrase', nativeText: 'ఎలా ఉన్నావు?', translit: 'Ela unnaavu?', gloss: '"How are you?" (informal — friends/juniors)', register: 'very_informal', conceptId: 'telugu_pronouns_basic' },
  { language: 'telugu', kind: 'phrase', nativeText: 'మీరు ఎలా ఉన్నారు?', translit: 'Meeru ela unnaaru?', gloss: '"How are you?" (formal — elders/strangers)', register: 'formal', conceptId: 'telugu_pronouns_honorific' },
  { language: 'telugu', kind: 'colloquial', nativeText: 'అదేంటి?', translit: 'Adenti?', gloss: '"What\'s that? / What happened?"', register: 'casual' },
  { language: 'telugu', kind: 'colloquial', nativeText: 'అబ్బా', translit: 'Abba', gloss: 'Exclamation of amazement/exasperation ("oh man!")', register: 'very_informal', region: 'Telangana' },
  // ── Kannada colloquial ───────────────────────────────────────────────────
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಏನು ಸಮಾಚಾರ?', translit: 'Enu samachara?', gloss: '"What\'s up? / What\'s the news?"', register: 'casual', conceptId: 'kannada_vocab_greetings' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಸರಿ', translit: 'Sari', gloss: '"Okay / right / fine" — universal particle', register: 'casual' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಹೌದು', translit: 'Haudu', gloss: '"Yes"', register: 'casual' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಇಲ್ಲ', translit: 'Illa', gloss: '"No / not"', register: 'casual' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಎಷ್ಟು?', translit: 'Eshtu?', gloss: '"How much? / How many?"', register: 'casual', conceptId: 'kannada_vocab_numbers' },
  { language: 'kannada', kind: 'phrase', nativeText: 'ಕಮ್ಮಿ ಮಾಡಿ', translit: 'Kammi maadi', gloss: '"Reduce it / lower the price" — bargaining', register: 'casual' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಚೆನ್ನಾಗಿದೆ', translit: 'Chennagide', gloss: '"It\'s nice / good"', register: 'casual' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ತುಂಬಾ', translit: 'Tumba', gloss: '"A lot / very" — intensifier', register: 'casual' },
  { language: 'kannada', kind: 'slang', nativeText: 'ಮಚ್ಚಾ', translit: 'Machcha', gloss: '"Bro / dude" — literally brother-in-law, used as buddy slang', register: 'very_informal', region: 'Bengaluru' },
  { language: 'kannada', kind: 'slang', nativeText: 'ಗುರು', translit: 'Guru', gloss: '"Boss / dude" — friendly address, Bengaluru slang', register: 'very_informal', region: 'Bengaluru' },
  { language: 'kannada', kind: 'slang', nativeText: 'ಏನಯ್ಯಾ', translit: 'Enayya', gloss: '"Hey man!" — casual attention-getter to close friends', register: 'very_informal' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಬಾ', translit: 'Baa', gloss: '"Come" (informal, to friends/juniors)', register: 'very_informal' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಬನ್ನಿ', translit: 'Banni', gloss: '"Come" (polite/plural — use with elders)', register: 'formal', conceptId: 'kannada_pronouns_neenu_neevu' },
  { language: 'kannada', kind: 'phrase', nativeText: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?', translit: 'Neevu hegiddiri?', gloss: '"How are you?" (formal)', register: 'formal', conceptId: 'kannada_pronouns_neenu_neevu' },
  { language: 'kannada', kind: 'phrase', nativeText: 'ನೀನು ಹೇಗಿದ್ದೀಯ?', translit: 'Neenu hegiddiya?', gloss: '"How are you?" (informal)', register: 'very_informal' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಸೂಪರ್', translit: 'Super', gloss: 'English loan — "awesome/great!"', register: 'very_informal', region: 'Bengaluru' },
  { language: 'kannada', kind: 'colloquial', nativeText: 'ಬೇಡ', translit: 'Beda', gloss: '"Don\'t want / no thanks"', register: 'casual' },
];
