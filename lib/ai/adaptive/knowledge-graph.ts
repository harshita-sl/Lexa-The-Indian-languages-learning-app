/**
 * Knowledge Graph & Curriculum Taxonomy
 * Formalizes the concept DAG (Directed Acyclic Graph) for Indian languages:
 * Telugu, Hindi, Kannada with prerequisite chains, mastery levels, and decay heatmaps.
 */

import { FSRSNode } from './fsrs-scheduler';

export type ConceptType = 'vocabulary' | 'grammar_rule' | 'honorific' | 'script' | 'syntax';
export type MasteryLevel = 'unseen' | 'learning' | 'review' | 'mastered' | 'overdue';

export interface ConceptNode {
  id: string; // e.g., 'telugu_vowels_short', 'hindi_verb_present_aa'
  label: string; // Human-readable name
  language: string;
  type: ConceptType;
  description: string;
  prerequisites: string[]; // IDs of prerequisite concept nodes
  level: number; // CEFR-inspired difficulty tier (1-5)
  tags: string[]; // For categorization
}

export interface MasterySnapshot {
  conceptId: string;
  masteryPercent: number; // 0-100
  stabilityDays: number;
  retrievability: number;
  dueStatus: 'due' | 'overdue' | 'fresh' | 'stable';
  decayColor: 'red' | 'amber' | 'green';
}

// ============================================================
// TELEGU CONCEPT TAXONOMY
// ============================================================
export const TELUGU_GRAPH: ConceptNode[] = [
  // --- Script Layer (Level 1) ---
  {
    id: 'telugu_script_vowels_short',
    label: 'Short Vowels (a, i, u)',
    language: 'telugu',
    type: 'script',
    description: 'Basic vowel sounds: a (అ), i (ఇ), u (ఉ)',
    prerequisites: [],
    level: 1,
    tags: ['script', 'vowels', 'beginner'],
  },
  {
    id: 'telugu_script_vowels_long',
    label: 'Long Vowels (aa, ii, uu)',
    language: 'telugu',
    type: 'script',
    description: 'Long vowel sounds: aa (ఆ), ii (ఈ), uu (ఊ)',
    prerequisites: ['telugu_script_vowels_short'],
    level: 1,
    tags: ['script', 'vowels', 'beginner'],
  },
  {
    id: 'telugu_script_consonants_kvarga',
    label: 'Ka-Varga (Ka, Kha, Ga, Gha, Nga)',
    language: 'telugu',
    type: 'script',
    description: 'First consonant group: క, ఖ, గ, ఘ, ఙ',
    prerequisites: ['telugu_script_vowels_short'],
    level: 1,
    tags: ['script', 'consonants', 'beginner'],
  },
  {
    id: 'telugu_script_consonants_cvarga',
    label: 'Ca-Varga (Ca, Cha, Ja, Jha,Nya)',
    language: 'telugu',
    type: 'script',
    description: 'Third consonant group: చ, ఛ, జ, ఝ, ఞ',
    prerequisites: ['telugu_script_consonants_kvarga'],
    level: 1,
    tags: ['script', 'consonants', 'beginner'],
  },
  {
    id: 'telugu_script_guninthalu',
    label: 'Guninthalu (Vowel Signs / Matras)',
    language: 'telugu',
    type: 'script',
    description: 'Dependent vowel signs attached to consonants',
    prerequisites: ['telugu_script_vowels_short', 'telugu_script_consonants_kvarga'],
    level: 2,
    tags: ['script', 'matras', 'beginner'],
  },
  {
    id: 'telugu_script_vattulu',
    label: 'Vattulu (Virama / Halant)',
    language: 'telugu',
    type: 'script',
    description: 'The halant (్) that removes the inherent vowel',
    prerequisites: ['telugu_script_guninthalu'],
    level: 2,
    tags: ['script', 'virama', 'intermediate'],
  },
  // --- Vocabulary Layer (Level 1-2) ---
  {
    id: 'telugu_vocab_greetings',
    label: 'Greetings (Namaskaram, Swagatham)',
    language: 'telugu',
    type: 'vocabulary',
    description: 'Common greetings and salutations',
    prerequisites: ['telugu_script_vowels_short'],
    level: 1,
    tags: ['vocabulary', 'greetings', 'beginner'],
  },
  {
    id: 'telugu_vocab_numbers_1_10',
    label: 'Numbers 1-10',
    language: 'telugu',
    type: 'vocabulary',
    description: 'Numbers from one to ten',
    prerequisites: ['telugu_script_vowels_short', 'telugu_script_consonants_kvarga'],
    level: 1,
    tags: ['vocabulary', 'numbers', 'beginner'],
  },
  {
    id: 'telugu_vocab_family',
    label: 'Family Members',
    language: 'telugu',
    type: 'vocabulary',
    description: 'Words for mother, father, sibling, etc.',
    prerequisites: ['telugu_vocab_greetings'],
    level: 1,
    tags: ['vocabulary', 'family', 'beginner'],
  },
  {
    id: 'telugu_vocab_food',
    label: 'Food & Dining',
    language: 'telugu',
    type: 'vocabulary',
    description: 'Common food items and dining vocabulary',
    prerequisites: ['telugu_vocab_greetings'],
    level: 2,
    tags: ['vocabulary', 'food', 'beginner'],
  },
  // --- Morphology / Grammar (Level 2-3) ---
  {
    id: 'telugu_pronouns_basic',
    label: 'Basic Pronouns (Nenu, Nuvvu, Aame)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Basic personal pronouns: I, you (inf), he/she/it',
    prerequisites: ['telugu_vocab_greetings'],
    level: 2,
    tags: ['grammar', 'pronouns', 'beginner'],
  },
  {
    id: 'telugu_pronouns_honorific',
    label: 'Honorific Pronouns (Meeru)',
    language: 'telugu',
    type: 'honorific',
    description: 'Respectful address: Meeru (you formal), Amma, Avva',
    prerequisites: ['telugu_pronouns_basic'],
    level: 2,
    tags: ['honorific', 'pronouns', 'beginner'],
  },
  {
    id: 'telugu_verb_roots',
    label: 'Verb Roots (Padanalu)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Identifying and using verb roots',
    prerequisites: ['telugu_pronouns_basic'],
    level: 2,
    tags: ['grammar', 'verbs', 'intermediate'],
  },
  {
    id: 'telugu_verb_present_aa',
    label: 'Present Tense (-aa, -aanu)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Present continuous and simple present with -aa suffix',
    prerequisites: ['telugu_verb_roots', 'telugu_pronouns_basic'],
    level: 2,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'telugu_verb_past_aa',
    label: 'Past Tense (-indi, -naa)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Past tense formation with -indi, -naa suffixes',
    prerequisites: ['telugu_verb_present_aa'],
    level: 3,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'telugu_vibhakti_dative',
    label: 'Dative Case (-ki, -ku)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Dative case marker for indirect object',
    prerequisites: ['telugu_pronouns_basic'],
    level: 2,
    tags: ['grammar', 'cases', 'intermediate'],
  },
  {
    id: 'telugu_vibhakti_locative',
    label: 'Locative Case (-lo, -ki)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Location and place markers',
    prerequisites: ['telugu_vibhakti_dative'],
    level: 2,
    tags: ['grammar', 'cases', 'intermediate'],
  },
  // --- Syntax & Pragmatics (Level 3+) ---
  {
    id: 'telugu_syntax_sov',
    label: 'SOV Word Order',
    language: 'telugu',
    type: 'syntax',
    description: 'Subject-Object-Verb sentence structure',
    prerequisites: ['telugu_verb_present_aa', 'telugu_vibhakti_dative'],
    level: 3,
    tags: ['syntax', 'word_order', 'intermediate'],
  },
  {
    id: 'telugu_honorific_imperatives',
    label: 'Honorific Imperatives (Command Forms)',
    language: 'telugu',
    type: 'honorific',
    description: 'Polite commands: Randi, Tappa, Lechipodhu',
    prerequisites: ['telugu_pronouns_honorific', 'telugu_verb_present_aa'],
    level: 3,
    tags: ['honorific', 'imperatives', 'intermediate'],
  },
  {
    id: 'telugu_questions_aa',
    label: 'Yes/No Questions (-aa suffix)',
    language: 'telugu',
    type: 'syntax',
    description: 'Forming questions with the -aa interrogative marker',
    prerequisites: ['telugu_syntax_sov'],
    level: 3,
    tags: ['syntax', 'questions', 'intermediate'],
  },
  {
    id: 'telugu_negation_ledhu',
    label: 'Negation (Ledhu, Kadu)',
    language: 'telugu',
    type: 'grammar_rule',
    description: 'Negating sentences with ledhu/kadu',
    prerequisites: ['telugu_verb_present_aa'],
    level: 3,
    tags: ['grammar', 'negation', 'intermediate'],
  },
];

// ============================================================
// HINDI CONCEPT TAXONOMY
// ============================================================
export const HINDI_GRAPH: ConceptNode[] = [
  {
    id: 'hindi_script_vowels',
    label: 'Devanagari Vowels',
    language: 'hindi',
    type: 'script',
    description: 'Basic vowel sounds in Devanagari',
    prerequisites: [],
    level: 1,
    tags: ['script', 'vowels', 'beginner'],
  },
  {
    id: 'hindi_script_consonants',
    label: 'Devanagari Consonants',
    language: 'hindi',
    type: 'script',
    description: 'Basic consonant sounds in Devanagari',
    prerequisites: ['hindi_script_vowels'],
    level: 1,
    tags: ['script', 'consonants', 'beginner'],
  },
  {
    id: 'hindi_vocab_greetings',
    label: 'Greetings (Namaste, Pranaam)',
    language: 'hindi',
    type: 'vocabulary',
    description: 'Common greetings and salutations',
    prerequisites: ['hindi_script_vowels'],
    level: 1,
    tags: ['vocabulary', 'greetings', 'beginner'],
  },
  {
    id: 'hindi_vocab_numbers',
    label: 'Numbers 1-20',
    language: 'hindi',
    type: 'vocabulary',
    description: 'Numbers from one to twenty',
    prerequisites: ['hindi_script_consonants'],
    level: 1,
    tags: ['vocabulary', 'numbers', 'beginner'],
  },
  {
    id: 'hindi_pronouns_tu_aap',
    label: 'Pronouns: Tu vs Aap',
    language: 'hindi',
    type: 'honorific',
    description: 'Intimate (Tu) vs Formal (Aap) pronoun usage',
    prerequisites: ['hindi_vocab_greetings'],
    level: 2,
    tags: ['honorific', 'pronouns', 'beginner'],
  },
  {
    id: 'hindi_verb_present',
    label: 'Present Tense (kar, karta hai)',
    language: 'hindi',
    type: 'grammar_rule',
    description: 'Present tense conjugation',
    prerequisites: ['hindi_pronouns_tu_aap'],
    level: 2,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'hindi_verb_past',
    label: 'Past Tense (-aa, -i)',
    language: 'hindi',
    type: 'grammar_rule',
    description: 'Past tense with gender/number agreement',
    prerequisites: ['hindi_verb_present'],
    level: 3,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'hindi_karak_cases',
    label: 'Karak: ne, ko, se, mein',
    language: 'hindi',
    type: 'grammar_rule',
    description: 'Postpositions replacing Sanskrit case markers',
    prerequisites: ['hindi_verb_present'],
    level: 2,
    tags: ['grammar', 'cases', 'intermediate'],
  },
  {
    id: 'hindi_negation',
    label: 'Negation (nahi, mat, bina)',
    language: 'hindi',
    type: 'grammar_rule',
    description: 'Negating verbs with nahī̃, mat, bina',
    prerequisites: ['hindi_verb_present'],
    level: 2,
    tags: ['grammar', 'negation', 'intermediate'],
  },
];

// ============================================================
// KANNADA CONCEPT TAXONOMY
// ============================================================
export const KANNADA_GRAPH: ConceptNode[] = [
  {
    id: 'kannada_script_vowels',
    label: 'Kannada Vowels (Swara)',
    language: 'kannada',
    type: 'script',
    description: 'Vowel sounds in Kannada script',
    prerequisites: [],
    level: 1,
    tags: ['script', 'vowels', 'beginner'],
  },
  {
    id: 'kannada_script_consonants',
    label: 'Kannada Consonants (Vyanjana)',
    language: 'kannada',
    type: 'script',
    description: 'Consonant sounds in Kannada script',
    prerequisites: ['kannada_script_vowels'],
    level: 1,
    tags: ['script', 'consonants', 'beginner'],
  },
  {
    id: 'kannada_vocab_greetings',
    label: 'Greetings (Namaskara, Swagatha)',
    language: 'kannada',
    type: 'vocabulary',
    description: 'Common Kannada greetings',
    prerequisites: ['kannada_script_vowels'],
    level: 1,
    tags: ['vocabulary', 'greetings', 'beginner'],
  },
  {
    id: 'kannada_pronouns_neenu_neevu',
    label: 'Pronouns: Neenu vs Neevu',
    language: 'kannada',
    type: 'honorific',
    description: 'Informal (Neenu) vs Formal (Neevu) pronouns',
    prerequisites: ['kannada_vocab_greetings'],
    level: 2,
    tags: ['honorific', 'pronouns', 'beginner'],
  },
  {
    id: 'kannada_verb_present',
    label: 'Present Tense (-u, -utte)',
    language: 'kannada',
    type: 'grammar_rule',
    description: 'Present tense verb conjugation',
    prerequisites: ['kannada_pronouns_neenu_neevu'],
    level: 2,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'kannada_verb_past',
    label: 'Past Tense (-de, -tu)',
    language: 'kannada',
    type: 'grammar_rule',
    description: 'Past tense formation',
    prerequisites: ['kannada_verb_present'],
    level: 3,
    tags: ['grammar', 'verbs', 'tense', 'intermediate'],
  },
  {
    id: 'kannada_script_vattulu',
    label: 'Ottakshara & Halant (್)',
    language: 'kannada',
    type: 'script',
    description: 'Consonant clusters and the halant sign',
    prerequisites: ['kannada_script_consonants'],
    level: 2,
    tags: ['script', 'conjuncts', 'intermediate'],
  },
  {
    id: 'kannada_vocab_numbers',
    label: 'Numbers 1-10',
    language: 'kannada',
    type: 'vocabulary',
    description: 'Numbers ondu to hattu',
    prerequisites: ['kannada_script_vowels'],
    level: 1,
    tags: ['vocabulary', 'numbers', 'beginner'],
  },
  {
    id: 'kannada_vocab_family',
    label: 'Family (Amma, Appa, Anna)',
    language: 'kannada',
    type: 'vocabulary',
    description: 'Family member words',
    prerequisites: ['kannada_vocab_greetings'],
    level: 1,
    tags: ['vocabulary', 'family', 'beginner'],
  },
  {
    id: 'kannada_vocab_food',
    label: 'Food & Dining (Oota, Neeru)',
    language: 'kannada',
    type: 'vocabulary',
    description: 'Meals, water, ordering food',
    prerequisites: ['kannada_vocab_greetings'],
    level: 2,
    tags: ['vocabulary', 'food', 'beginner'],
  },
  {
    id: 'kannada_vibhakti_dative',
    label: 'Dative Case (-ge / -kke)',
    language: 'kannada',
    type: 'grammar_rule',
    description: 'To/for marking: nana-ge, nima-kke',
    prerequisites: ['kannada_pronouns_neenu_neevu'],
    level: 2,
    tags: ['grammar', 'cases', 'intermediate'],
  },
  {
    id: 'kannada_vibhakti_locative',
    label: 'Locative Case (-alli / -li)',
    language: 'kannada',
    type: 'grammar_rule',
    description: 'Location marking: mane-yalli, ooru-li',
    prerequisites: ['kannada_vibhakti_dative'],
    level: 2,
    tags: ['grammar', 'cases', 'intermediate'],
  },
  {
    id: 'kannada_negation_illa',
    label: 'Negation (illa, alla)',
    language: 'kannada',
    type: 'grammar_rule',
    description: 'Negating with illa (not present) and alla (not so)',
    prerequisites: ['kannada_verb_present'],
    level: 3,
    tags: ['grammar', 'negation', 'intermediate'],
  },
  {
    id: 'kannada_syntax_sov',
    label: 'SOV Word Order',
    language: 'kannada',
    type: 'syntax',
    description: 'Subject-Object-Verb sentence structure',
    prerequisites: ['kannada_verb_present', 'kannada_vibhakti_dative'],
    level: 3,
    tags: ['syntax', 'word_order', 'intermediate'],
  },
  {
    id: 'kannada_questions_aa',
    label: 'Questions (-aa suffix, enu, elli)',
    language: 'kannada',
    type: 'syntax',
    description: 'Yes/no questions with -aa, wh-words enu/elli/yaaru',
    prerequisites: ['kannada_syntax_sov'],
    level: 3,
    tags: ['syntax', 'questions', 'intermediate'],
  },
];

// Union of all language graphs
export const KNOWLEDGE_GRAPHS: Record<string, ConceptNode[]> = {
  telugu: TELUGU_GRAPH,
  hindi: HINDI_GRAPH,
  kannada: KANNADA_GRAPH,
};

/**
 * Get the full concept graph for a language
 */
export function getLanguageGraph(language: string): ConceptNode[] {
  return KNOWLEDGE_GRAPHS[language.toLowerCase()] || [];
}

/**
 * Get a specific concept node by ID
 */
export function getConceptById(conceptId: string): ConceptNode | undefined {
  for (const langGraph of Object.values(KNOWLEDGE_GRAPHS)) {
    const found = langGraph.find(c => c.id === conceptId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get all prerequisite concepts for a given concept (recursive)
 */
export function getPrerequisites(conceptId: string): ConceptNode[] {
  const concept = getConceptById(conceptId);
  if (!concept) return [];

  const prereqs: ConceptNode[] = [];
  for (const prereqId of concept.prerequisites) {
    const prereq = getConceptById(prereqId);
    if (prereq) {
      prereqs.push(prereq);
      prereqs.push(...getPrerequisites(prereqId)); // Recursive
    }
  }
  return prereqs;
}

/**
 * Calculate mastery status for a concept given its FSRS node
 */
export function calculateMasteryStatus(node: FSRSNode): MasterySnapshot {
  const now = new Date();
  const daysSinceReview =
    (now.getTime() - node.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Recalculate current retrievability
  const retrievability =
    daysSinceReview === 0
      ? node.retrievability
      : Math.pow(1 + 0.19 * (daysSinceReview / node.stability), -0.5);

  const masteryPercent = Math.round(retrievability * 100);

  // Determine decay color (for heatmap)
  let decayColor: 'red' | 'amber' | 'green';
  if (retrievability >= 0.90) {
    decayColor = 'green';
  } else if (retrievability >= 0.70) {
    decayColor = 'amber';
  } else {
    decayColor = 'red';
  }

  // Determine due status
  const isDue = now >= node.dueAt;
  const isOverdue = retrievability < 0.7;
  const isFresh = retrievability > 0.98;

  let dueStatus: MasterySnapshot['dueStatus'];
  if (isOverdue) {
    dueStatus = 'overdue';
  } else if (isDue) {
    dueStatus = 'due';
  } else if (isFresh) {
    dueStatus = 'fresh';
  } else {
    dueStatus = 'stable';
  }

  return {
    conceptId: node.conceptId,
    masteryPercent,
    stabilityDays: Math.round(node.stability * 10) / 10,
    retrievability: Math.round(retrievability * 100) / 100,
    dueStatus,
    decayColor,
  };
}
