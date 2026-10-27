/**
 * Indic Honorific & Register Evaluator
 * Evaluates socio-linguistic registers, honorific levels, and pronoun-verb agreement:
 * - Telugu: Nuvvu (నువ్వు, informal) vs Meeru (మీరు, formal/honorific), verb endings -vu vs -ru / -ndi
 * - Hindi: Tu (तू, intimate) vs Tum (तुम, informal) vs Aap (आप, formal), verb endings
 * - Kannada: Neenu (ನೀನು, informal) vs Neevu (ನೀವು, formal)
 */

export type RegisterLevel = 'intimate' | 'informal' | 'formal' | 'honorific';

export interface HonorificAnalysis {
  detectedRegister: RegisterLevel;
  targetRegister: RegisterLevel;
  isAgreementValid: boolean;
  pronoun: string | null;
  verbEnding: string | null;
  explanation: string;
  suggestedCorrection?: string;
}

interface LanguageRegisterRules {
  pronouns: {
    informal: string[];
    formal: string[];
    intimate?: string[];
  };
  verbEndings: {
    informal: RegExp[];
    formal: RegExp[];
    intimate?: RegExp[];
  };
  politeParticles: string[];
}

const TELUGU_REGISTER_RULES: LanguageRegisterRules = {
  pronouns: {
    informal: ['nuvvu', 'నువ్వు', 'neevu', 'నీవు', 'nuvva', 'నువ్వా'],
    formal: ['meeru', 'మీరు', 'meera', 'మీరా', 'tamaru', 'తమరు'],
  },
  verbEndings: {
    // e.g., chesthavu (చేస్తావు), tinnavu (తిన్నావు), raa (రా), cheyyi (చెయ్యి)
    informal: [
      /(?:avu|aavu|aavu|vu|vi|yi|u|i|tu)$/i,
      /(?:ావు|వు|వి|యి|రా|చెయ్యి|తిను|పో)$/
    ],
    // e.g., chestharu (చేస్తారు), tinnara (తిన్నారా), randi (రండి), cheyyandi (చెయ్యండి)
    formal: [
      /(?:aaru|aru|andi|ndi|aara|ru)$/i,
      /(?:ారు|ండి|రా|రి|చెయ్యండి|రండి|రండి|తిన్నారా)$/
    ],
  },
  politeParticles: ['andi', 'అండి', 'gari', 'గారి', 'ayithe', 'అయితే']
};

const HINDI_REGISTER_RULES: LanguageRegisterRules = {
  pronouns: {
    intimate: ['tu', 'तू'],
    informal: ['tum', 'तुम', 'tumhe', 'तुम्हें', 'tumhara', 'तुम्हारा'],
    formal: ['aap', 'आप', 'aapko', 'आपको', 'aapka', 'आपका'],
  },
  verbEndings: {
    intimate: [/(?:ega|egi|ta hai|ti hai|raha hai|rahi hai)$/i, /(?:ेगा|ेगी|ता है|ती है)$/],
    // e.g., karte ho (करते हो), jaao (जाओ)
    informal: [/(?:te ho|ti ho|o|oge|ogi)$/i, /(?:ते हो|ती हो|ओ|ोगे|ोगी)$/],
    // e.g., karte hain (करते हैं), aaiye (आइए), kijiye (कीजिए)
    formal: [/(?:te hain|ti hain|iye|ye|enge|engi|kijiye)$/i, /(?:ते हैं|ती हैं|िए|ेंगे|ेंगी|कीजिए|आइए)$/],
  },
  politeParticles: ['ji', 'जी', 'kripya', 'कृपया', 'sahab', 'साहब']
};

const KANNADA_REGISTER_RULES: LanguageRegisterRules = {
  pronouns: {
    informal: ['neenu', 'ನೀನು', 'ninna', 'ನಿನ್ನ', 'ninage', 'ನಿನಗೆ'],
    formal: ['neevu', 'ನೀವು', 'nimma', 'ನಿಮ್ಮ', 'nimage', 'ನಿಮಗೆ'],
  },
  verbEndings: {
    informal: [/(?:eeyaa|i|iya|tiya|diyo|ba|maadu)$/i, /(?:ೀಯಾ|ಿಯ|ತಿಯ|ಮಾಡ|ಬಾ)$/],
    formal: [/(?:iri|eeri|iddiri|ri|banni|maadi)$/i, /(?:ಿರಿ|ೀರಿ|ಿದ್ದೀರಿ|ರಿ|ಬನ್ನಿ|ಮಾಡಿ)$/],
  },
  politeParticles: ['ri', 'ರೀ', 'avare', 'ಅವರೇ', 'dayavittu', 'ದಯವಿಟ್ಟು']
};

const REGISTER_RULES_BY_LANG: Record<string, LanguageRegisterRules> = {
  telugu: TELUGU_REGISTER_RULES,
  hindi: HINDI_REGISTER_RULES,
  kannada: KANNADA_REGISTER_RULES,
};

/**
 * Evaluate if a sentence has consistent honorific and register agreement
 */
export function evaluateHonorificAgreement(
  text: string,
  language: string,
  expectedRegister: RegisterLevel = 'formal'
): HonorificAnalysis {
  const langKey = language.toLowerCase();
  const rules = REGISTER_RULES_BY_LANG[langKey] || REGISTER_RULES_BY_LANG.telugu;
  const lowerText = text.toLowerCase().trim();

  let detectedPronoun: string | null = null;
  let detectedPronounRegister: RegisterLevel | null = null;

  // 1. Detect Pronoun & its register
  if (rules.pronouns.intimate?.some(p => lowerText.includes(p))) {
    detectedPronoun = rules.pronouns.intimate.find(p => lowerText.includes(p)) || null;
    detectedPronounRegister = 'intimate';
  } else if (rules.pronouns.informal.some(p => lowerText.includes(p))) {
    detectedPronoun = rules.pronouns.informal.find(p => lowerText.includes(p)) || null;
    detectedPronounRegister = 'informal';
  } else if (rules.pronouns.formal.some(p => lowerText.includes(p))) {
    detectedPronoun = rules.pronouns.formal.find(p => lowerText.includes(p)) || null;
    detectedPronounRegister = 'formal';
  }

  // 2. Detect Polite Particles
  const hasPoliteParticle = rules.politeParticles.some(p => lowerText.includes(p));

  // 3. Detect Verb Ending Register
  let detectedVerbRegister: RegisterLevel = hasPoliteParticle ? 'formal' : 'informal';

  if (rules.verbEndings.formal.some(re => re.test(lowerText))) {
    detectedVerbRegister = 'formal';
  } else if (rules.verbEndings.informal.some(re => re.test(lowerText))) {
    detectedVerbRegister = 'informal';
  }

  // Determine overall detected register
  const finalDetectedRegister: RegisterLevel = detectedPronounRegister || detectedVerbRegister;

  // 4. Validate Agreement
  // If pronoun is formal but verb is informal -> mismatch!
  // If pronoun is informal but polite particles/formal verb -> mismatch!
  let isAgreementValid = true;
  let explanation = '';
  let suggestedCorrection: string | undefined = undefined;

  if (detectedPronounRegister && detectedVerbRegister) {
    if (detectedPronounRegister === 'formal' && detectedVerbRegister === 'informal') {
      isAgreementValid = false;
      if (langKey === 'telugu') {
        explanation = `Honorific Mismatch: You used the respectful pronoun 'మీరు (Meeru)', but combined it with an informal verb ending. Use the respectful suffix '-ండి / -రు' (e.g., రండి / చేస్తారు).`;
        suggestedCorrection = `మీరు ... రండి / చేయండి`;
      } else if (langKey === 'hindi') {
        explanation = `Honorific Mismatch: You used the formal pronoun 'आप (Aap)', but the verb ending was informal. Use the formal '-िए / -ते हैं' verb form (e.g., आप आइए / आप करते हैं).`;
        suggestedCorrection = `आप ... आइए / कीजिए`;
      } else {
        explanation = `Honorific Mismatch: Formal pronoun 'ನೀವು (Neevu)' requires a matching formal verb ending (e.g., ಬನ್ನಿ / ಮಾಡಿ).`;
      }
    } else if (detectedPronounRegister === 'informal' && hasPoliteParticle) {
      explanation = `Register Blend: You mixed informal pronoun '${detectedPronoun}' with formal marker '${hasPoliteParticle}'. While understandable, keep the register consistent.`;
    }
  }

  // If no internal agreement error, check against expectedRegister context
  if (isAgreementValid && expectedRegister === 'formal' && finalDetectedRegister === 'informal') {
    explanation = `Context Note: This sentence uses informal address (${detectedPronoun || 'informal verb'}). In professional or respectful settings, use the formal/honorific form instead.`;
  } else if (isAgreementValid) {
    explanation = `Great! Register and honorific agreement are consistent (${finalDetectedRegister}).`;
  }

  return {
    detectedRegister: finalDetectedRegister,
    targetRegister: expectedRegister,
    isAgreementValid,
    pronoun: detectedPronoun,
    verbEnding: null,
    explanation,
    suggestedCorrection,
  };
}
