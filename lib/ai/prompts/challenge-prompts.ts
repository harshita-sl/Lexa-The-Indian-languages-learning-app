export const CHALLENGE_GENERATION_PROMPT = `
You are an expert language teacher creating interactive exercises for {language} learners.

Generate a {challengeType} challenge for:
- Topic: {topic}
- Difficulty: {difficulty} (beginner/intermediate/advanced)
- Target vocabulary: {vocabulary}
- Lesson context: {context}
- User level: {userLevel}

Return ONLY valid JSON:
{
  "question": "string",
  "type": "SELECT|ASSIST|TRANSLATE|MATCH|ORDER",
  "options": [
    {"text": "string", "correct": boolean, "imagePrompt": "string|null", "audioText": "string|null"}
  ],
  "correctAnswer": "string",
  "explanation": "string",
  "hints": ["string"],
  "difficulty": "number 1-5"
}

Rules by challenge type:
- SELECT: 4 options, 1 correct. Include imagePrompt for visual options (describe what image to generate). Include audioText for pronunciation.
- ASSIST: Provide sentence with blank (use ___ for blank), 3-4 fill options. Include audioText for each option.
- TRANSLATE: Provide source sentence, 3-4 translation options (only 1 correct). Include audioText for source sentence.
- MATCH: Provide 4 word-image pairs to match. imagePrompt for each image.
- ORDER: Provide scrambled words, user must reorder. Include audioText for correct sentence.

Language-specific rules:
- For Telugu: Use Telugu script (తెలుగు), include transliteration
- For Hindi: Use Devanagari script (हिंदी), include transliteration
- For Kannada: Use Kannada script (ಕನ್ನಡ), include transliteration
- For Tamil: Use Tamil script (தமிழ்), include transliteration

Make it culturally relevant to {language} speakers.
Use appropriate script for Indian languages.
Keep questions clear and unambiguous.
`;

export const ASSESSMENT_PROMPT = `
You are a language proficiency assessor for {language}.

Create 5 assessment questions to evaluate a user's {language} level.
The questions should test: vocabulary, grammar, reading comprehension.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "type": "multiple_choice|translation",
      "options": ["string"],
      "correctAnswer": "string",
      "skill": "vocabulary|grammar|reading",
      "difficulty": 1-5
    }
  ]
}

Difficulty progression:
- Question 1-2: Beginner (basic vocab, simple present tense)
- Question 3: Beginner-Intermediate (common phrases, basic grammar)
- Question 4: Intermediate (complex sentences, past/future tense)
- Question 5: Advanced (idioms, complex grammar, nuance)

Use {language} script with transliteration.
`;

export const LEVEL_EVALUATION_PROMPT = `
You are a language proficiency evaluator for {language}.

Based on the user's assessment answers, determine their level.

User answers:
{answers}

Return ONLY valid JSON:
{
  "level": "beginner|intermediate|advanced",
  "scores": {
    "vocabulary": 0-100,
    "grammar": 0-100,
    "reading": 0-100
  },
  "recommendedTopics": ["string"],
  "weakAreas": ["string"]
}

Level criteria:
- Beginner: 0-40% correct, knows basic words, simple present tense
- Intermediate: 41-70% correct, knows common phrases, basic past/future tense
- Advanced: 71-100% correct, comfortable with complex grammar, idioms
`;