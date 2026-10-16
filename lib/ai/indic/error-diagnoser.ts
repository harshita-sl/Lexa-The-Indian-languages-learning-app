/**
 * 4D Indic Error Diagnoser
 * Classifies language errors into 4 orthogonal cognitive and linguistic dimensions:
 * 1. Syntax / Morphological: Case markers (Vibhaktulu / Karak), SOV word order, agreement
 * 2. L1 Interference: English SVO vs Indic SOV, prepositions vs postpositions, literal calques
 * 3. Phonetic / Orthographic: Aspiration (k vs kh), Retroflex vs Dental (t vs ṭ), Vowel length (a vs ā)
 * 4. Pragmatic / Honorific: Respect levels, social registers, polite particles
 */

import { evaluateHonorificAgreement } from './honorific-evaluator';
import { normalizeIndicPhonetics } from './transliteration';

export type ErrorDimension = 'syntax' | 'l1_interference' | 'phonetic' | 'pragmatic' | 'none';

export interface ErrorDiagnosis {
  dimension: ErrorDimension;
  title: string;
  explanation: string;
  constructiveTip: string;
  acousticPhoneticScore?: number;
  highlightedPattern?: string;
}

interface DiagnosisContext {
  userInput: string;
  expectedAnswer: string;
  language: string;
  question?: string;
  targetRegister?: 'intimate' | 'informal' | 'formal' | 'honorific';
}

/**
 * Diagnoses errors across the 4 dimensions and provides pedagogical feedback
 */
export function diagnoseIndicError(context: DiagnosisContext): ErrorDiagnosis {
  const { userInput, expectedAnswer, language, targetRegister = 'formal' } = context;
  const langKey = language.toLowerCase();
  const cleanUser = userInput.trim();
  const cleanExpected = expectedAnswer.trim();

  // If user answer matches expected answer (exact or fuzzy), no error!
  if (cleanUser.toLowerCase() === cleanExpected.toLowerCase()) {
    return {
      dimension: 'none',
      title: 'Flawless Answer!',
      explanation: 'Your answer is grammatically and culturally accurate.',
      constructiveTip: 'Keep up the momentum!',
    };
  }

  // Dimension 4: Check Pragmatic & Honorific Errors
  const honorificResult = evaluateHonorificAgreement(cleanUser, langKey, targetRegister);
  if (!honorificResult.isAgreementValid || (honorificResult.detectedRegister !== targetRegister && targetRegister === 'formal')) {
    return {
      dimension: 'pragmatic',
      title: 'Honorific / Register Nuance',
      explanation: honorificResult.explanation,
      constructiveTip: honorificResult.suggestedCorrection
        ? `Try using: "${honorificResult.suggestedCorrection}"`
        : `Remember that Indian languages mark respect through both pronouns and specific verb suffixes.`,
      highlightedPattern: honorificResult.pronoun || undefined,
    };
  }

  // Dimension 3: Check Phonetic / Orthographic Confusion
  const normUser = normalizeIndicPhonetics(cleanUser);
  const normExpected = normalizeIndicPhonetics(cleanExpected);

  // If normalized phonetic representations match, it's a pure orthographic / vowel length / aspiration difference
  if (normUser === normExpected) {
    let specificDiff = 'vowel length or aspiration';
    if (cleanExpected.includes('th') && cleanUser.includes('t')) {
      specificDiff = 'dental vs retroflex ("t" vs "th")';
    } else if (cleanExpected.includes('kh') && cleanUser.includes('k')) {
      specificDiff = 'aspirated consonant ("k" vs "kh / ఖ / ख")';
    } else if (cleanExpected.includes('aa') || cleanExpected.includes('ā') || cleanExpected.includes('ఆ')) {
      specificDiff = 'short vs long vowel ("a" vs "aa / ā")';
    }

    return {
      dimension: 'phonetic',
      title: 'Phonetic & Script Nuance',
      explanation: `You're phonetically very close! The distinction here lies in ${specificDiff}.`,
      constructiveTip: `Pay close attention to the length of the vowel and aspiration of the consonant.`,
      acousticPhoneticScore: 0.88,
    };
  }

  // Dimension 2: Check L1 Interference (English -> Indic calques)
  // Check for SVO English structure vs SOV Indic structure
  const userWords = cleanUser.split(/\s+/);
  const expectedWords = cleanExpected.split(/\s+/);

  // Preposition vs Postposition Check (e.g. "in room" instead of "room in / gadi-lo / kamre mein")
  if (
    (cleanUser.toLowerCase().startsWith('in ') || cleanUser.toLowerCase().startsWith('on ') || cleanUser.toLowerCase().startsWith('to ')) &&
    (langKey === 'telugu' || langKey === 'hindi' || langKey === 'kannada')
  ) {
    return {
      dimension: 'l1_interference',
      title: 'L1 Structural Interference (Postpositions)',
      explanation: `In English, prepositions come BEFORE the noun (e.g., "in the house"). In ${language}, postpositions attach AFTER the noun (e.g., "house-in" -> ${langKey === 'telugu' ? 'ఇంట్లో (intlo)' : langKey === 'hindi' ? 'घर में (ghar mein)' : 'ಮನೆಯಲ್ಲಿ (maneyalli)'}).`,
      constructiveTip: `Place location/direction markers after the noun in Indian languages.`,
    };
  }

  // Dimension 1: Check Syntax / Morphological Error (Case markers, word order)
  if (userWords.length >= 2 && expectedWords.length >= 2) {
    const userLastWord = userWords[userWords.length - 1].toLowerCase();
    const expectedLastWord = expectedWords[expectedWords.length - 1].toLowerCase();

    // In Indic languages, the finite verb typically comes at the VERY END (SOV)
    if (userLastWord !== expectedLastWord) {
      return {
        dimension: 'syntax',
        title: 'Word Order & Case Structure (SOV)',
        explanation: `${language} follows a Subject-Object-Verb (SOV) sentence structure, placing the main verb and auxiliary at the end of the sentence.`,
        constructiveTip: `Expected word order: Subject + Object/Details + Verb (${cleanExpected}).`,
      };
    }
  }

  // Default Syntax & Vocabulary Error
  return {
    dimension: 'syntax',
    title: 'Morphological / Vocabulary Match',
    explanation: `The selected phrasing differs from the targeted vocabulary in this context. The intended expression was "${cleanExpected}".`,
    constructiveTip: `Review the lemma root and its contextual usage.`,
  };
}
