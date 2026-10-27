/**
 * Indic Transliteration Bridge
 * Bidirectional conversion and fuzzy phonetic matching across Indian scripts:
 * Telugu, Hindi (Devanagari), and Kannada.
 */

export type IndicLanguage = 'telugu' | 'hindi' | 'kannada' | 'tamil' | 'bengali';

// Vowel mappings (Independent vowels and dependent vowel signs / Matras)
interface ScriptMapping {
  vowels: Record<string, string>; // Roman -> Script independent vowel
  matras: Record<string, string>; // Roman -> Script dependent vowel sign
  consonants: Record<string, string>; // Roman -> Script consonant
  virama: string; // Halant / Pollu
  anusvara: string; // Sunna / Anusvar (M / M.)
  visarga: string; // H.
}

const TELUGU_MAP: ScriptMapping = {
  vowels: {
    'a': 'అ', 'aa': 'ఆ', 'a:': 'ఆ', 'A': 'ఆ',
    'i': 'ఇ', 'ii': 'ఈ', 'ee': 'ఈ', 'I': 'ఈ',
    'u': 'ఉ', 'uu': 'ఊ', 'oo': 'ఊ', 'U': 'ఊ',
    'R': 'ఋ', 'RU': 'ౠ',
    'e': 'ఎ', 'E': 'ఏ', 'ee:': 'ఏ',
    'ai': 'ఐ',
    'o': 'ఒ', 'O': 'ఓ', 'oo:': 'ఓ',
    'au': 'ఔ', 'ou': 'ఔ'
  },
  matras: {
    'aa': 'ా', 'a:': 'ా', 'A': 'ా',
    'i': 'ి', 'ii': 'ీ', 'ee': 'ీ', 'I': 'ీ',
    'u': 'ు', 'uu': 'ూ', 'oo': 'ూ', 'U': 'ూ',
    'R': 'ృ', 'RU': 'ౄ',
    'e': 'ె', 'E': 'ే', 'ee:': 'ే',
    'ai': 'ై',
    'o': 'ొ', 'O': 'ో', 'oo:': 'ో',
    'au': 'ౌ', 'ou': 'ౌ'
  },
  consonants: {
    // NOTE: 'ng'/'ny' are intentionally omitted — casual romanized spellings like
    // "bangaram"/"dhanyam" overwhelmingly mean n+g / n+y, not ఙ/ఞ.
    'k': 'క', 'kh': 'ఖ', 'g': 'గ', 'gh': 'ఘ',
    'ch': 'చ', 'chh': 'ఛ', 'j': 'జ', 'jh': 'ఝ',
    'T': 'ట', 'Th': 'ఠ', 'D': 'డ', 'Dh': 'ఢ', 'N': 'ణ',
    't': 'త', 'th': 'థ', 'd': 'ద', 'dh': 'ధ', 'n': 'న',
    'p': 'ప', 'ph': 'ఫ', 'f': 'ఫ', 'b': 'బ', 'bh': 'భ', 'm': 'మ',
    'y': 'య', 'r': 'ర', 'l': 'ల', 'v': 'వ', 'w': 'వ',
    'sh': 'శ', 'S': 'ష', 's': 'స', 'h': 'హ', 'L': 'ళ'
  },
  virama: '్',
  anusvara: 'ం',
  visarga: 'ః'
};

const HINDI_MAP: ScriptMapping = {
  vowels: {
    'a': 'अ', 'aa': 'आ', 'A': 'आ',
    'i': 'इ', 'ii': 'ई', 'ee': 'ई', 'I': 'ई',
    'u': 'उ', 'uu': 'ऊ', 'oo': 'ऊ', 'U': 'ऊ',
    'R': 'ऋ',
    'e': 'ए', 'E': 'ए',
    'ai': 'ऐ',
    'o': 'ओ', 'O': 'ओ',
    'au': 'औ', 'ou': 'औ'
  },
  matras: {
    'aa': 'ा', 'A': 'ा',
    'i': 'ि', 'ii': 'ी', 'ee': 'ी', 'I': 'ी',
    'u': 'ु', 'uu': 'ू', 'oo': 'ू', 'U': 'ू',
    'R': 'ृ',
    'e': 'े', 'E': 'े',
    'ai': 'ै',
    'o': 'ो', 'O': 'ो',
    'au': 'ौ', 'ou': 'ौ'
  },
  consonants: {
    // See Telugu map note: 'ng'/'ny' omitted to keep casual spellings correct.
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
    'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
    'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'ph': 'फ', 'f': 'फ़', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
    'sh': 'श', 'S': 'ष', 's': 'स', 'h': 'ह'
  },
  virama: '्',
  anusvara: 'ं',
  visarga: 'ः'
};

const KANNADA_MAP: ScriptMapping = {
  vowels: {
    'a': 'ಅ', 'aa': 'ಆ', 'A': 'ಆ',
    'i': 'ಇ', 'ii': 'ಈ', 'ee': 'ಈ', 'I': 'ಈ',
    'u': 'ಉ', 'uu': 'ಊ', 'oo': 'ಊ', 'U': 'ಊ',
    'R': 'ಋ',
    'e': 'ಎ', 'E': 'ಏ',
    'ai': 'ಐ',
    'o': 'ಒ', 'O': 'ಓ',
    'au': 'ಔ', 'ou': 'ಔ'
  },
  matras: {
    'aa': 'ಾ', 'A': 'ಾ',
    'i': 'ಿ', 'ii': 'ೀ', 'ee': 'ೀ', 'I': 'ೀ',
    'u': 'ು', 'uu': 'ೂ', 'oo': 'ೂ', 'U': 'ೂ',
    'R': 'ೃ',
    'e': 'ೆ', 'E': 'ೇ',
    'ai': 'ೈ',
    'o': 'ೊ', 'O': 'ೋ',
    'au': 'ೌ', 'ou': 'ೌ'
  },
  consonants: {
    // See Telugu map note: 'ng'/'ny' omitted to keep casual spellings correct.
    'k': 'ಕ', 'kh': 'ಖ', 'g': 'ಗ', 'gh': 'ಘ',
    'ch': 'ಚ', 'chh': 'ಛ', 'j': 'ಜ', 'jh': 'ಝ',
    'T': 'ಟ', 'Th': 'ಠ', 'D': 'ಡ', 'Dh': 'ಢ', 'N': 'ಣ',
    't': 'ತ', 'th': 'ಥ', 'd': 'ದ', 'dh': 'ಧ', 'n': 'ನ',
    'p': 'ಪ', 'ph': 'ಫ', 'b': 'ಬ', 'bh': 'ಭ', 'm': 'ಮ',
    'y': 'ಯ', 'r': 'ರ', 'l': 'ಲ', 'v': 'ವ', 'w': 'ವ',
    'sh': 'ಶ', 'S': 'ಷ', 's': 'ಸ', 'h': 'ಹ', 'L': 'ಳ'
  },
  virama: '್',
  anusvara: 'ಂ',
  visarga: 'ಃ'
};

const SCRIPT_MAPS: Record<string, ScriptMapping> = {
  telugu: TELUGU_MAP,
  hindi: HINDI_MAP,
  kannada: KANNADA_MAP,
};

/**
 * Convert Romanized Indic text into Native Akshara script
 */
export function romanToIndic(text: string, language: string): string {
  const langKey = language.toLowerCase();
  const mapping = SCRIPT_MAPS[langKey] || SCRIPT_MAPS.telugu;
  if (!text) return '';

  const words = text.split(' ');
  const transliteratedWords = words.map(word => {
    let result = '';
    let i = 0;
    const len = word.length;

    while (i < len) {
      // Check 3-char consonant clusters (e.g., 'chh', 'shh') — guard length so a
      // truncated tail like 'd' isn't mistaken for a multi-char key.
      const three = i + 3 <= len ? word.substring(i, i + 3).toLowerCase() : '';
      const two = i + 2 <= len ? word.substring(i, i + 2).toLowerCase() : '';
      const one = word[i];
      const oneLower = one.toLowerCase();

      // Check Anusvara ('m' at end of syllable or explicit 'M')
      if (one === 'M' || (oneLower === 'm' && (i === len - 1 || !isVowel(word[i + 1])))) {
        result += mapping.anusvara;
        i += 1;
        continue;
      }

      // Check consonants
      let consonantScript = '';
      let consLen = 0;

      if (mapping.consonants[three]) {
        consonantScript = mapping.consonants[three];
        consLen = 3;
      } else if (mapping.consonants[two]) {
        consonantScript = mapping.consonants[two];
        consLen = 2;
      } else if (mapping.consonants[one] || mapping.consonants[oneLower]) {
        consonantScript = mapping.consonants[one] || mapping.consonants[oneLower];
        consLen = 1;
      }

      if (consonantScript) {
        i += consLen;
        // Check following vowel
        const nextTwo = i + 2 <= len ? word.substring(i, i + 2).toLowerCase() : '';
        const nextOne = word[i]?.toLowerCase();

        if (mapping.matras[nextTwo]) {
          result += consonantScript + mapping.matras[nextTwo];
          i += 2;
        } else if (nextOne === 'a') {
          // Inherent vowel 'a' -> implicit in Indic consonant
          result += consonantScript;
          i += 1;
        } else if (mapping.matras[nextOne]) {
          result += consonantScript + mapping.matras[nextOne];
          i += 1;
        } else {
          // No vowel following: add Virama (Halant/Pollu) if not end of word in Hindi
          if (langKey === 'hindi' && i === len) {
            result += consonantScript; // Schwa deletion at word-final in Hindi
          } else {
            result += consonantScript + mapping.virama;
          }
        }
        continue;
      }

      // Check independent vowels
      if (mapping.vowels[two]) {
        result += mapping.vowels[two];
        i += 2;
        continue;
      } else if (mapping.vowels[one] || mapping.vowels[oneLower]) {
        result += mapping.vowels[one] || mapping.vowels[oneLower];
        i += 1;
        continue;
      }

      // Non-phonetic symbol, keep as is
      result += one;
      i += 1;
    }

    return result;
  });

  return transliteratedWords.join(' ');
}

function isVowel(ch?: string): boolean {
  if (!ch) return false;
  return ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'].includes(ch);
}

// ── Indic → Roman transliteration ───────────────────────────────────────────
// Reverse maps built lazily from the forward tables, preferring readable
// ASCII forms (aa/ee/oo, kh/gh/ch/jh/th/dh/ph/bh, plain t/d/n/s/l for
// retroflex — lossy but learner-friendly).

interface ReverseMap {
  vowels: Map<string, string>;
  consonants: Map<string, string>;
  matras: Map<string, string>;
  virama: string;
  anusvara: string;
  visarga: string;
}

const reverseCache = new Map<string, ReverseMap>();

function getReverseMap(language: string): ReverseMap {
  const langKey = language.toLowerCase();
  const cached = reverseCache.get(langKey);
  if (cached) return cached;

  const fwd = SCRIPT_MAPS[langKey] ?? SCRIPT_MAPS.telugu;
  const vowels = new Map<string, string>();
  const consonants = new Map<string, string>();
  const matras = new Map<string, string>();

  const score = (r: string) => {
    // prefer all-lowercase ASCII keys; longer keys (aa > a) first on ties
    const ascii = /^[a-z:]+$/.test(r) ? 0 : /^[a-zA-Z:]+$/.test(r) ? 1 : 2;
    return ascii * 10 - r.length;
  };

  for (const [roman, script] of Object.entries(fwd.vowels)) {
    const prev = vowels.get(script);
    if (prev === undefined || score(roman) < score(prev)) vowels.set(script, roman);
  }
  for (const [roman, script] of Object.entries(fwd.matras)) {
    const prev = matras.get(script);
    if (prev === undefined || score(roman) < score(prev)) matras.set(script, roman);
  }
  for (const [roman, script] of Object.entries(fwd.consonants)) {
    const prev = consonants.get(script);
    const lower = roman.toLowerCase();
    if (prev === undefined || score(lower) < score(prev)) consonants.set(script, lower);
  }

  const map: ReverseMap = {
    vowels,
    consonants,
    matras,
    virama: fwd.virama,
    anusvara: fwd.anusvara,
    visarga: fwd.visarga,
  };
  reverseCache.set(langKey, map);
  return map;
}

/**
 * Convert native Indic script to readable romanized text.
 * Inherent 'a' is emitted for bare consonants; virama suppresses it;
 * Hindi drops word-final schwa (schwa deletion).
 */
export function indicToRoman(text: string, language: string): string {
  if (!text) return '';
  const langKey = language.toLowerCase();
  const map = getReverseMap(langKey);

  return text
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s+$/.test(word)) return word;
      let out = '';
      let pendingA = false; // a bare consonant is waiting for its vowel
      const chars = Array.from(word);
      for (const ch of chars) {
        const cons = map.consonants.get(ch);
        if (cons !== undefined) {
          if (pendingA) out += 'a';
          out += cons;
          pendingA = true;
          continue;
        }
        const matra = map.matras.get(ch);
        if (matra !== undefined) {
          out += pendingA ? matra : matra; // matra replaces inherent 'a'
          pendingA = false;
          continue;
        }
        if (ch === map.virama) {
          pendingA = false; // bare consonant: no inherent vowel
          continue;
        }
        if (ch === map.anusvara) {
          if (pendingA) out += 'a';
          pendingA = false;
          out += 'm';
          continue;
        }
        if (ch === map.visarga) {
          if (pendingA) out += 'a';
          pendingA = false;
          out += 'h';
          continue;
        }
        const vowel = map.vowels.get(ch);
        if (vowel !== undefined) {
          if (pendingA) out += 'a';
          pendingA = false;
          out += vowel;
          continue;
        }
        // Non-phonetic char (punct, digits, latin): flush pending schwa
        if (pendingA) {
          out += 'a';
          pendingA = false;
        }
        out += ch;
      }
      // Word-final: Hindi drops the inherent schwa; Telugu/Kannada keep it
      if (pendingA && langKey !== 'hindi') out += 'a';
      return out;
    })
    .join('');
}

/**
 * Phonetic Normalizer for comparing user answers across Romanized & Script variants
 */
export function normalizeIndicPhonetics(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, '')
    // Normalize long vowels to standard representations
    .replace(/aa|a:|ā/g, 'a')
    .replace(/ee|ii|i:|ī/g, 'i')
    .replace(/oo|uu|u:|ū/g, 'u')
    .replace(/ai|ay/g, 'ai')
    .replace(/ou|au|ow/g, 'au')
    // Normalize aspirated/dental variations
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/bh/g, 'b')
    .replace(/ph/g, 'p')
    .replace(/sh|shh|ṣ|ś/g, 's')
    .replace(/ñ|ṇ|n/g, 'n')
    .replace(/ṁ|m̃|m/g, 'm')
    .replace(/\s+/g, ' ');
}

/**
 * Fuzzy match check between user input and target answer
 * Considers Romanized transliteration, Indic script, and phonetic variations.
 */
export function isFuzzyIndicMatch(userInput: string, targetAnswer: string): boolean {
  if (!userInput || !targetAnswer) return false;

  const rawCleanUser = userInput.trim().toLowerCase();
  const rawCleanTarget = targetAnswer.trim().toLowerCase();

  // Exact match
  if (rawCleanUser === rawCleanTarget) return true;

  // Check if one contains the other (for multi-word or bracketed options e.g. "నమస్కారం (Namaskaram)")
  if (rawCleanTarget.includes(rawCleanUser) || rawCleanUser.includes(rawCleanTarget)) {
    return true;
  }

  // Phonetic normalized match
  const normUser = normalizeIndicPhonetics(userInput);
  const normTarget = normalizeIndicPhonetics(targetAnswer);

  if (normUser === normTarget) return true;
  if (normTarget.includes(normUser) || normUser.includes(normTarget)) return true;

  // Levenshtein distance tolerance for close typos (<= 1 edit distance for short words, <= 2 for longer)
  const dist = levenshteinDistance(normUser, normTarget);
  const maxAllowedDist = Math.max(1, Math.floor(normTarget.length * 0.25));
  return dist <= maxAllowedDist;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Get Romanized transcription and Akshara breakdown for scaffolding UI
 */
export function getScriptScaffolding(text: string, language: string): {
  script: string;
  romanized: string;
  phoneticGuide: string;
} {
  const langKey = language.toLowerCase();
  // If input is Romanized, convert to Script
  const hasIndicChar = /[ఀ-౿ऀ-ॿಀ-೿஀-௿]/.test(text);

  let script = text;
  let romanized = text;

  if (!hasIndicChar) {
    script = romanToIndic(text, langKey);
  } else {
    // Extract bracketed romanization if available, e.g. "నమస్కారం (Namaskaram)"
    const match = text.match(/\(([^)]+)\)/);
    if (match) {
      romanized = match[1];
      script = text.replace(/\s*\([^)]+\)/, '').trim();
    }
  }

  return {
    script,
    romanized,
    phoneticGuide: normalizeIndicPhonetics(romanized),
  };
}
