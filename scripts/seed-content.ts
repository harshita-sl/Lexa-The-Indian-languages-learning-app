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
  // ── Telugu — expanded variety (anti-repetition) ──────────────────────────
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_short', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the short vowel "i"?',
      options: [{ text: 'ఇ', correct: true }, { text: 'ఈ', correct: false }, { text: 'ఎ', correct: false }, { text: 'ఏ', correct: false }],
      correctAnswer: 'ఇ', explanation: 'ఇ is short "i"; ఈ is the long "ii".', hints: ['Short twin'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_short', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "u" (short)?',
      options: [{ text: 'ఉ', correct: true }, { text: 'ఊ', correct: false }, { text: 'ఋ', correct: false }, { text: 'ఒ', correct: false }],
      correctAnswer: 'ఉ', explanation: 'ఉ is short "u"; ఊ is long "uu".', hints: ['Shortest of the pair'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_long', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the long vowel "ee"?',
      options: [{ text: 'ఏ', correct: true }, { text: 'ఎ', correct: false }, { text: 'ఐ', correct: false }, { text: 'ఈ', correct: false }],
      correctAnswer: 'ఏ', explanation: 'ఏ is long "ee"; ఎ is short "e". ఈ is long "ii" — different sound.', hints: ['e-family, not i'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_vowels_long', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the long vowel "oo"?',
      options: [{ text: 'ఓ', correct: true }, { text: 'ఒ', correct: false }, { text: 'ఔ', correct: false }, { text: 'ఊ', correct: false }],
      correctAnswer: 'ఓ', explanation: 'ఓ is long "oo" (o-sound); ఊ is long "uu" (u-sound).', hints: ['o-family'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_consonants_kvarga', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "ga", the voiced ka?',
      options: [{ text: 'గ', correct: true }, { text: 'క', correct: false }, { text: 'ఘ', correct: false }, { text: 'ఙ', correct: false }],
      correctAnswer: 'గ', explanation: 'క→ఖ→గ→ఘ: ga is the voiced counterpart of ka.', hints: ['Third in ka-varga'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_script_consonants_kvarga', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "kha" (aspirated ka)?',
      options: [{ text: 'ఖ', correct: true }, { text: 'క', correct: false }, { text: 'గ', correct: false }, { text: 'ఘ', correct: false }],
      correctAnswer: 'ఖ', explanation: 'ఖ kha has a breathy "h" after the k — second in ka-varga.', hints: ['Second in the group'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'How do you say "Good morning" in Telugu?',
      options: [{ text: 'శుభోదయం (Shubhodayam)', correct: true }, { text: 'శుభ రాత్రి (Shubha ratri)', correct: false }, { text: 'స్వాగతం (Swagatam)', correct: false }, { text: 'ధన్యవాదాలు (Dhanyavadalu)', correct: false }],
      correctAnswer: 'శుభోదయం (Shubhodayam)', explanation: 'Shubha = auspicious/good; udayam = morning.', hints: ['Shubha-…'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'vocabulary', type: 'ASSIST',
    payload: {
      question: 'Complete: "నేను ___" (I am leaving / bye)',
      options: [{ text: 'వెళ్తున్నాను (veltunnanu)', correct: true }, { text: 'వస్తున్నాను (vastunnanu)', correct: false }, { text: 'తింటున్నాను (tintunnanu)', correct: false }, { text: 'చదువుతున్నాను (chaduvutunnanu)', correct: false }],
      correctAnswer: 'వెళ్తున్నాను (veltunnanu)', explanation: 'Veltunnanu = "I am going" — the casual goodbye.', hints: ['Opposite of vastunnanu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'speaking', type: 'SPEAK',
    payload: {
      question: 'Say the respectful greeting out loud:',
      options: [{ text: 'నమస్కారం', correct: true }],
      correctAnswer: 'నమస్కారం',
      explanation: 'Namaskaram — hold the long "aa" clearly.', hints: ['na-mas-kaa-ram'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_greetings', skill: 'listening', type: 'LISTEN',
    payload: {
      question: 'Listen and choose what you heard:',
      options: [{ text: 'నమస్కారం (Namaskaram)', correct: true }, { text: 'నీళ్ళు (Neellu)', correct: false }, { text: 'అమ్మ (Amma)', correct: false }, { text: 'ఐదు (Ayidu)', correct: false }],
      correctAnswer: 'నమస్కారం', explanation: 'That was "Namaskaram" — the respectful greeting.', hints: ['A greeting'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_numbers_1_10', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"మూడు" (Moodu) is which number?',
      options: [{ text: 'Three', correct: true }, { text: 'Six', correct: false }, { text: 'Eight', correct: false }, { text: 'One', correct: false }],
      correctAnswer: 'Three', explanation: 'Moodu = 3; aaru=6, enimidi=8.', hints: ['M-…'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_numbers_1_10', skill: 'vocabulary', type: 'TRANSLATE',
    payload: {
      question: '"పది" (Padi) means?',
      options: [{ text: 'Ten', correct: true }, { text: 'Five', correct: false }, { text: 'Two', correct: false }, { text: 'Hundred', correct: false }],
      correctAnswer: 'Ten', explanation: 'Padi = 10 — the base for teens (padi+okati=padakonnu, 11).', hints: ['Top of the counting chart'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_numbers_1_10', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"రెండు" (Rendu) is which number?',
      options: [{ text: 'Two', correct: true }, { text: 'Four', correct: false }, { text: 'Seven', correct: false }, { text: 'Nine', correct: false }],
      correctAnswer: 'Two', explanation: 'Rendu = 2.', hints: ['R-…'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What does "నాన్న" (Nanna) mean?',
      options: [{ text: 'Father', correct: true }, { text: 'Mother', correct: false }, { text: 'Brother', correct: false }, { text: 'Uncle', correct: false }],
      correctAnswer: 'Father', explanation: 'Nanna = father; Amma = mother.', hints: ['Amma\'s pair'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"అన్న" (Anna) refers to?',
      options: [{ text: 'Elder brother', correct: true }, { text: 'Younger brother', correct: false }, { text: 'Father', correct: false }, { text: 'Grandfather', correct: false }],
      correctAnswer: 'Elder brother', explanation: 'Anna = elder brother (also "anna gaaru" for respect); thammudu = younger brother.', hints: ['Respectful for a male elder sibling'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What is "milk" in Telugu?',
      options: [{ text: 'పాలు (Paalu)', correct: true }, { text: 'నీళ్ళు (Neellu)', correct: false }, { text: 'టీ (Tea)', correct: false }, { text: 'రసం (Rasam)', correct: false }],
      correctAnswer: 'పాలు (Paalu)', explanation: 'Paalu = milk.', hints: ['P-aa-lu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"అన్నం" (Annam) means?',
      options: [{ text: 'Cooked rice / a meal', correct: true }, { text: 'Water', correct: false }, { text: 'Bread', correct: false }, { text: 'Fruit', correct: false }],
      correctAnswer: 'Cooked rice / a meal', explanation: 'Annam is cooked rice — the word people use for "a meal" in general.', hints: ['Staple food'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_basic', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"మనం" (Manam) means?',
      options: [{ text: 'We (including listener)', correct: true }, { text: 'They', correct: false }, { text: 'You two', correct: false }, { text: 'I', correct: false }],
      correctAnswer: 'We (including listener)', explanation: 'Manam = "we" including the listener; memu = "we" excluding them.', hints: ['Inclusive we'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_basic', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ఆమె" (Aame) means?',
      options: [{ text: 'She', correct: true }, { text: 'He', correct: false }, { text: 'They', correct: false }, { text: 'It', correct: false }],
      correctAnswer: 'She', explanation: 'Aame = she; atanu = he; adi = it.', hints: ['Female third person'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_honorific', skill: 'conversation', type: 'SELECT',
    payload: {
      question: 'To show respect you add ___ after a name: "Ravi ___"',
      options: [{ text: 'గారు (gaaru)', correct: true }, { text: 'లు (lu)', correct: false }, { text: 'కు (ku)', correct: false }, { text: 'వ్ (vu)', correct: false }],
      correctAnswer: 'గారు (gaaru)', explanation: '"Gaaru" is the honorific suffix — Ravi gaaru, Amma gaaru.', hints: ['The respect suffix'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_pronouns_honorific', skill: 'conversation', type: 'CONVERSATION',
    payload: {
      question: 'Your grandmother asks how you are. Reply politely:',
      options: [{ text: 'నేను బాగున్నాను, మీరు ఎలా ఉన్నారు?', correct: true }],
      correctAnswer: 'నేను బాగున్నాను, మీరు ఎలా ఉన్నారు?',
      explanation: 'With elders use meeru + unnaaru (formal). "Nuvvu/unnavu" would sound rude.', hints: ['Formal you + formal verb ending'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_present_aa', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నేను వస్తున్నాను" means?',
      options: [{ text: 'I am coming', correct: true }, { text: 'I am going', correct: false }, { text: 'I came', correct: false }, { text: 'I will come', correct: false }],
      correctAnswer: 'I am coming', explanation: 'Vastunnanu = coming now (present -tunnanu).', hints: ['vas- = come'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_present_aa', skill: 'grammar', type: 'ASSIST',
    payload: {
      question: 'Complete: "ఆమె చదువు___" (She is studying)',
      options: [{ text: 'తున్నది (tunnadi)', correct: true }, { text: 'టున్నాను (tunnanu)', correct: false }, { text: 'తున్నావు (tunnavu)', correct: false }, { text: 'తున్నాడు (tunnadu)', correct: false }],
      correctAnswer: 'తున్నది (tunnadi)', explanation: 'Chaduvutunnadi = she is studying; -tunnadi for third-person feminine.', hints: ['She-form of -tunnanu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_past_aa', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"నేను తిన్నాను" means?',
      options: [{ text: 'I ate', correct: true }, { text: 'I am eating', correct: false }, { text: 'I will eat', correct: false }, { text: 'I cook', correct: false }],
      correctAnswer: 'I ate', explanation: 'Thinnanu = I ate (past tense).', hints: ['Past of thintunnanu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_verb_past_aa', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"అతను వెళ్ళాడు" means?',
      options: [{ text: 'He went', correct: true }, { text: 'He is going', correct: false }, { text: 'He came', correct: false }, { text: 'He will go', correct: false }],
      correctAnswer: 'He went', explanation: 'Vellaadu = he went (past, masculine -aadu).', hints: ['Past of veltunnadu'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vibhakti_dative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నీకు" (neeku) in "నీకు ఇది ఇస్తాను" marks?',
      options: [{ text: 'To you', correct: true }, { text: 'In you', correct: false }, { text: 'Your', correct: false }, { text: 'With you', correct: false }],
      correctAnswer: 'To you', explanation: '-ku marks the recipient: neeku = to/for you.', hints: ['Recipient of the gift'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_vibhakti_dative', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ఆమెకు పుస్తకం ఇవ్వు" means?',
      options: [{ text: 'Give her the book', correct: true }, { text: 'Take her book', correct: false }, { text: 'She gave a book', correct: false }, { text: 'Her book is here', correct: false }],
      correctAnswer: 'Give her the book', explanation: 'Aameku = to her; ivvu = give (imperative).', hints: ['-ku = to'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_syntax_sov', skill: 'grammar', type: 'ORDER',
    payload: {
      question: 'Correct Telugu order for "She book reads"?',
      options: [{ text: 'ఆమె పుస్తకం చదువుతుంది', correct: true }, { text: 'చదువుతుంది ఆమె పుస్తకం', correct: false }, { text: 'పుస్తకం చదువుతుంది ఆమె', correct: false }, { text: 'ఆమె చదువుతుంది పుస్తకం అని', correct: false }],
      correctAnswer: 'ఆమె పుస్తకం చదువుతుంది', explanation: 'Subject → object → verb. Telugu verbs always end the clause.', hints: ['SOV'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_negation_ledhu', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"నాకు కాఫీ వద్దు" (naaku kaafi vaddu) means?',
      options: [{ text: "I don't want coffee", correct: true }, { text: 'I want coffee', correct: false }, { text: 'There is no coffee', correct: false }, { text: 'The coffee is bad', correct: false }],
      correctAnswer: "I don't want coffee", explanation: 'Vaddu = "don\'t want" — polite refusal.', hints: ['Refusal word'],
    },
  },
  {
    language: 'telugu', conceptId: 'telugu_negation_ledhu', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ఇది కాదు" (idi kaadu) means?',
      options: [{ text: 'This is not it / not this', correct: true }, { text: 'This is it', correct: false }, { text: 'There is none', correct: false }, { text: 'I don\'t know', correct: false }],
      correctAnswer: 'This is not it / not this', explanation: 'Kaadu negates identity — "is not". Ledhu = "is not there".', hints: ['Not-existence vs not-identity'],
    },
  },
  // ── Kannada — expanded variety ───────────────────────────────────────────
  {
    language: 'kannada', conceptId: 'kannada_script_vowels', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is the long vowel "aa" in Kannada?',
      options: [{ text: 'ಆ', correct: true }, { text: 'ಅ', correct: false }, { text: 'ಈ', correct: false }, { text: 'ಊ', correct: false }],
      correctAnswer: 'ಆ', explanation: 'ಆ is long "aa"; ಅ is short "a".', hints: ['Longer twin'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_script_vowels', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "e" (short)?',
      options: [{ text: 'ಎ', correct: true }, { text: 'ಏ', correct: false }, { text: 'ಐ', correct: false }, { text: 'ಇ', correct: false }],
      correctAnswer: 'ಎ', explanation: 'ಎ is short "e"; ಏ is long "ee".', hints: ['e-family'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_script_consonants', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "ga" (voiced ka)?',
      options: [{ text: 'ಗ', correct: true }, { text: 'ಕ', correct: false }, { text: 'ಘ', correct: false }, { text: 'ಚ', correct: false }],
      correctAnswer: 'ಗ', explanation: 'ಕ→ಖ→ಗ→ಘ: ga is the voiced ka.', hints: ['Third of ka-varga'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_script_consonants', skill: 'script', type: 'SELECT',
    payload: {
      question: 'Which letter is "cha"?',
      options: [{ text: 'ಚ', correct: true }, { text: 'ಛ', correct: false }, { text: 'ಜ', correct: false }, { text: 'ತ', correct: false }],
      correctAnswer: 'ಚ', explanation: 'ಚ cha — first of the cha-varga (ಚ ಛ ಜ ಝ).', hints: ['cha-varga lead'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'How do you answer "Hegiddiri?" (How are you?)',
      options: [{ text: 'ಚೆನ್ನಾಗಿದ್ದೀನಿ (Chennagiddini) — I\'m fine', correct: true }, { text: 'ಬನ್ನಿ (Banni) — come', correct: false }, { text: 'ಹೋಗಿ (Hogi) — go', correct: false }, { text: 'ಊಟ (Oota) — food', correct: false }],
      correctAnswer: 'ಚೆನ್ನಾಗಿದ್ದೀನಿ (Chennagiddini) — I\'m fine', explanation: 'Chennagiddini = "I\'m well" — the standard reply.', hints: ['chenna = good'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'vocabulary', type: 'ASSIST',
    payload: {
      question: 'Complete: "ನಾನು ___" (I\'m doing well, thanks)',
      options: [{ text: 'ಚೆನ್ನಾಗಿದ್ದೀನಿ (chennagiddini)', correct: true }, { text: 'ಬಂದಿದ್ದೀನಿ (bandiddini)', correct: false }, { text: 'ಹೋಗುತ್ತಿದ್ದೀನಿ (hoguttiddini)', correct: false }, { text: 'ನಮಸ್ಕಾರ (namaskara)', correct: false }],
      correctAnswer: 'ಚೆನ್ನಾಗಿದ್ದೀನಿ (chennagiddini)', explanation: 'Chennagiddini — "doing well".', hints: ['chenna = good'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'speaking', type: 'SPEAK',
    payload: {
      question: 'Say the Kannada greeting out loud:',
      options: [{ text: 'ನಮಸ್ಕಾರ', correct: true }],
      correctAnswer: 'ನಮಸ್ಕಾರ',
      explanation: 'Namaskara — universal greeting.', hints: ['na-mas-kaa-ra'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_greetings', skill: 'listening', type: 'LISTEN',
    payload: {
      question: 'Listen and choose what you heard:',
      options: [{ text: 'ನಮಸ್ಕಾರ (Namaskara)', correct: true }, { text: 'ನೀರು (Neeru)', correct: false }, { text: 'ಅಮ್ಮ (Amma)', correct: false }, { text: 'ಎರಡು (Eradu)', correct: false }],
      correctAnswer: 'ನಮಸ್ಕಾರ', explanation: 'That was "Namaskara" — the universal greeting.', hints: ['A greeting'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_numbers', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಮೂರು" (Mooru) is which number?',
      options: [{ text: 'Three', correct: true }, { text: 'Six', correct: false }, { text: 'Nine', correct: false }, { text: 'Five', correct: false }],
      correctAnswer: 'Three', explanation: 'Mooru = 3.', hints: ['M-…'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_numbers', skill: 'vocabulary', type: 'TRANSLATE',
    payload: {
      question: '"ಹತ್ತು" (Hattu) means?',
      options: [{ text: 'Ten', correct: true }, { text: 'Seven', correct: false }, { text: 'Two', correct: false }, { text: 'Hundred', correct: false }],
      correctAnswer: 'Ten', explanation: 'Hattu = 10.', hints: ['Top of the chart'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_numbers', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಐದು" (Ayidu) is which number?',
      options: [{ text: 'Five', correct: true }, { text: 'One', correct: false }, { text: 'Eight', correct: false }, { text: 'Four', correct: false }],
      correctAnswer: 'Five', explanation: 'Ayidu = 5.', hints: ['Same shape as Telugu ayidu'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಅಪ್ಪ" (Appa) means?',
      options: [{ text: 'Father', correct: true }, { text: 'Mother', correct: false }, { text: 'Uncle', correct: false }, { text: 'Grandfather', correct: false }],
      correctAnswer: 'Father', explanation: 'Appa = father; Amma = mother.', hints: ['Amma\'s pair'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_family', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ಅಣ್ಣ" (Anna) refers to?',
      options: [{ text: 'Elder brother', correct: true }, { text: 'Younger brother', correct: false }, { text: 'Father', correct: false }, { text: 'Friend', correct: false }],
      correctAnswer: 'Elder brother', explanation: 'Anna = elder brother; thamma = younger brother.', hints: ['Elder male sibling'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: 'What is "milk" in Kannada?',
      options: [{ text: 'ಹಾಲು (Haalu)', correct: true }, { text: 'ನೀರು (Neeru)', correct: false }, { text: 'ಅನ್ನ (Anna)', correct: false }, { text: 'ರಸಂ (Rasam)', correct: false }],
      correctAnswer: 'ಹಾಲು (Haalu)', explanation: 'Haalu = milk.', hints: ['H-aa-lu'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vocab_food', skill: 'vocabulary', type: 'SELECT',
    payload: {
      question: '"ದೋಸೆ" (Dose) is?',
      options: [{ text: 'A crispy pancake (dosa)', correct: true }, { text: 'Rice ball', correct: false }, { text: 'A sweet', correct: false }, { text: 'Spicy soup', correct: false }],
      correctAnswer: 'A crispy pancake (dosa)', explanation: 'Dose — Karnataka\'s iconic breakfast, home of the dosa.', hints: ['Bengaluru breakfast'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_pronouns_neenu_neevu', skill: 'conversation', type: 'SELECT',
    payload: {
      question: '"ನಾನು" (Naanu) means?',
      options: [{ text: 'I', correct: true }, { text: 'You', correct: false }, { text: 'We', correct: false }, { text: 'He', correct: false }],
      correctAnswer: 'I', explanation: 'Naanu = I; naavu = we.', hints: ['First person'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_pronouns_neenu_neevu', skill: 'conversation', type: 'CONVERSATION',
    payload: {
      question: 'Your teacher asks how you are. Reply politely:',
      options: [{ text: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ, ನೀವು ಹೇಗಿದ್ದೀರಿ?', correct: true }],
      correctAnswer: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ, ನೀವು ಹೇಗಿದ್ದೀರಿ?',
      explanation: 'With elders/teachers use neevu + hegiddiri (formal).', hints: ['Formal you'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_present', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ನಾನು ಬರುತ್ತೇನೆ" means?',
      options: [{ text: 'I am coming', correct: true }, { text: 'I am going', correct: false }, { text: 'I came', correct: false }, { text: 'I will come', correct: false }],
      correctAnswer: 'I am coming', explanation: 'Baruttene = coming now (present -uttene).', hints: ['bar- = come'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_present', skill: 'grammar', type: 'ASSIST',
    payload: {
      question: 'Complete: "ಅವಳು ಬರೆಯು___" (She is writing)',
      options: [{ text: 'ತ್ತಾಳೆ (ttale)', correct: true }, { text: 'ತ್ತೇನೆ (ttene)', correct: false }, { text: 'ತ್ತೀಯ (tteeya)', correct: false }, { text: 'ತ್ತಾನೆ (ttane)', correct: false }],
      correctAnswer: 'ತ್ತಾಳೆ (ttale)', explanation: 'Bareyuttale = she is writing; -uttale for she.', hints: ['She-form of -uttene'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_past', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ನಾನು ತಿಂದೆ" means?',
      options: [{ text: 'I ate', correct: true }, { text: 'I am eating', correct: false }, { text: 'I will eat', correct: false }, { text: 'I cook', correct: false }],
      correctAnswer: 'I ate', explanation: 'Tinde = I ate (past tense).', hints: ['Past of tinnuttene'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_verb_past', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ಅವಳು ಹೋದಳು" means?',
      options: [{ text: 'She went', correct: true }, { text: 'She is going', correct: false }, { text: 'She came', correct: false }, { text: 'She will go', correct: false }],
      correctAnswer: 'She went', explanation: 'Hodalu = she went (past, feminine -alu).', hints: ['Past of hoguttale'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_dative', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ಅವಳಿಗೆ ಪುಸ್ತಕ ಕೊಡು" means?',
      options: [{ text: 'Give her the book', correct: true }, { text: 'Take her book', correct: false }, { text: 'She gave a book', correct: false }, { text: 'Her book is here', correct: false }],
      correctAnswer: 'Give her the book', explanation: 'Avalige = to her; kodu = give (imperative).', hints: ['-ge = to'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_dative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ಅವನಿಗೆ" (avanige) means?',
      options: [{ text: 'To him / for him', correct: true }, { text: 'His', correct: false }, { text: 'With him', correct: false }, { text: 'In him', correct: false }],
      correctAnswer: 'To him / for him', explanation: '-ge dative: avanige = to him.', hints: ['Recipient marker'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_locative', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ಅಲ್ಲಿ" (alli) means?',
      options: [{ text: 'There', correct: true }, { text: 'Here', correct: false }, { text: 'Inside', correct: false }, { text: 'Where', correct: false }],
      correctAnswer: 'There', explanation: 'Alli = there; illi = here; elli = where.', hints: ['a- = far, i- = near'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_vibhakti_locative', skill: 'grammar', type: 'TRANSLATE',
    payload: {
      question: '"ಶಾಲೆಯಲ್ಲಿ" (shaaleyalli) means?',
      options: [{ text: 'In the school', correct: true }, { text: 'To the school', correct: false }, { text: 'The school', correct: false }, { text: 'From school', correct: false }],
      correctAnswer: 'In the school', explanation: 'Shaale + -yalli = in the school.', hints: ['-yalli after vowel'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_negation_illa', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ನನಗೆ ಕಾಫಿ ಬೇಡ" (nanage kaafi beda) means?',
      options: [{ text: "I don't want coffee", correct: true }, { text: 'I want coffee', correct: false }, { text: 'There is no coffee', correct: false }, { text: 'The coffee is bad', correct: false }],
      correctAnswer: "I don't want coffee", explanation: 'Beda = "don\'t want".', hints: ['Refusal word'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_negation_illa', skill: 'grammar', type: 'SELECT',
    payload: {
      question: '"ಇದು ಅಲ್ಲ" (idu alla) means?',
      options: [{ text: 'This is not it', correct: true }, { text: 'This is it', correct: false }, { text: 'There is none', correct: false }, { text: "I don't know", correct: false }],
      correctAnswer: 'This is not it', explanation: 'Alla negates identity; illa negates existence.', hints: ['alla vs illa'],
    },
  },
  {
    language: 'kannada', conceptId: 'kannada_syntax_sov', skill: 'grammar', type: 'ORDER',
    payload: {
      question: 'Correct Kannada order for "She book reads"?',
      options: [{ text: 'ಅವಳು ಪುಸ್ತಕ ಓದುತ್ತಾಳೆ', correct: true }, { text: 'ಓದುತ್ತಾಳೆ ಅವಳು ಪುಸ್ತಕ', correct: false }, { text: 'ಪುಸ್ತಕ ಓದುತ್ತಾಳೆ ಅವಳು', correct: false }, { text: 'ಅವಳು ಓದುತ್ತಾಳೆ ಪುಸ್ತಕ ಅಂತ', correct: false }],
      correctAnswer: 'ಅವಳು ಪುಸ್ತಕ ಓದುತ್ತಾಳೆ', explanation: 'SOV: avalu → pustaka → oduttale.', hints: ['Verb last'],
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
