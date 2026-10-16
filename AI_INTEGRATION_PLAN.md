# Lexa AI Integration Plan

## Overview
Transform Lexa from a static content-based language learning app to an AI-powered interactive tutor (like Duolingo) that dynamically generates challenges, images, and conversational practice.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
                        FRONTEND (Next.js)
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌───────────────┐ ┌──────────────┐
        │  AI Challenge   │ │  AI Tutor     │ │  Image       │
        │  Generation API │ │  Chat API     │ │  Generation  │
        └────────┬────────┘ └───────┬───────┘ └──────┬───────┘
                 │                  │                │
                 ▼                  ▼                ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    AI SERVICES LAYER                    │
        │  • OpenAI GPT-4o (challenges, conversation, translation)│
        │  • DALL-E 3 / Pollinations (images)                     │
        │  • TTS (ElevenLabs / OpenAI TTS)                        │
        └─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    DATABASE (PostgreSQL)                │
        │  • Cache AI-generated content                           │
        │  • Track user progress & interactions                   │
        │  • Store conversation history                           │
        └─────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Dynamic Challenge Generation
- **Input**: Language, topic, difficulty, lesson context
- **Output**: JSON with question, options, correct answer, explanation
- **Types**: SELECT (multiple choice), ASSIST (fill-in-blank), TRANSLATE, SPEAK, LISTEN, CONVERSATION

### 2. AI Language Tutor (Conversational)
- **Persona**: Encouraging tutor for specific Indian language
- **Capabilities**: 
  - Explain grammar concepts
  - Practice conversation
  - Correct mistakes with explanations
  - Adapt to user level
  - Cultural context

### 3. Dynamic Image Generation
- **Option A**: DALL-E 3 (high quality, paid)
- **Option B**: Pollinations.ai (free, good quality)
- **Option C**: Unsplash API (real photos, free tier)
- **Strategy**: Generate on-demand, cache in DB, fallback to placeholder

### 4. Audio/TTS Integration
- **OpenAI TTS** or **ElevenLabs** for pronunciation
- Generate on-demand, cache audio files

---

## Database Schema Updates

```typescript
// Add to schema.ts

// Track AI-generated content for caching
export const aiGeneratedContent = pgTable("ai_generated_content", {
    id: serial("id").primaryKey(),
    contentType: text("content_type").notNull(), // "challenge", "image", "audio", "explanation"
    inputHash: text("input_hash").notNull(), // Hash of input params for deduplication
    content: jsonb("content").notNull(), // The generated content
    language: text("language").notNull(),
    topic: text("topic"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"), // For cache invalidation
});

// Conversation history for AI tutor
export const conversations = pgTable("conversations", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    language: text("language").notNull(),
    messages: jsonb("messages").notNull(), // Array of {role, content, timestamp}
    context: text("context"), // e.g., "lesson-5", "free-practice"
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences for AI personalization
export const userPreferences = pgTable("user_preferences", {
    userId: text("user_id").primaryKey(),
    learningStyle: text("learning_style").default("balanced"), // "visual", "audio", "conversational", "balanced"
    difficulty: text("difficulty").default("adaptive"), // "beginner", "intermediate", "advanced", "adaptive"
    dailyGoalMinutes: integer("daily_goal_minutes").default(15),
    preferredTopics: text("preferred_topics").array().default([]),
    nativeLanguage: text("native_language").default("English"),
});
```

---

## API Routes Structure

```
app/api/ai/
├── generate-challenge/route.ts     # POST - Generate lesson challenge
├── tutor-chat/route.ts             # POST - Conversational tutor
├── generate-image/route.ts         # POST - Generate image for word/concept
├── generate-audio/route.ts         # POST - TTS for pronunciation
├── explain-concept/route.ts        # POST - Grammar/vocab explanation
├── translate/route.ts              # POST - Translation with context
└── practice-conversation/route.ts  # POST - Guided conversation practice
```

---

## AI Service Layer (lib/ai/)

```
lib/ai/
├── index.ts                    # Main exports
├── challenge-generator.ts      # Challenge generation logic
├── tutor-agent.ts              # Conversational tutor
├── image-generator.ts          # Image generation (multiple providers)
├── audio-generator.ts          # TTS generation
├── prompts/
│   ├── challenge-prompts.ts    # System prompts for challenges
│   ├── tutor-prompts.ts        # Tutor personas per language
│   └── image-prompts.ts        # Image generation prompts
├── providers/
│   ├── openai.ts               # OpenAI client
│   ├── pollinations.ts         # Free image generation
│   └── unsplash.ts             # Photo search
├── cache.ts                    # Caching logic
└── types.ts                    # TypeScript types
```

---

## Challenge Types (Duolingo-style)

| Type | Description | Example |
|------|-------------|---------|
| SELECT | Multiple choice with images | "Which is 'apple'?" + 4 images |
| ASSIST | Fill in the blank | "The ___ is red" |
| TRANSLATE | Translate sentence | "Translate: 'I eat rice'" |
| SPEAK | Voice recognition | "Say: 'नमस्ते'" |
| LISTEN | Audio to text | Play audio, user types |
| CONVERSATION | Chat with AI tutor | Roleplay: ordering food |
| MATCH | Word-picture matching | Drag word to image |
| ORDER | Sentence building | Reorder words |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add database schema for AI content & conversations
- [ ] Create AI service layer with OpenAI client
- [ ] Build challenge generation API
- [ ] Create basic challenge UI components

### Phase 2: Core AI Features (Week 2)
- [ ] Implement AI tutor chat API
- [ ] Add image generation (Pollinations free tier first)
- [ ] Build lesson page with dynamic challenges
- [ ] Add progress tracking for AI content

### Phase 3: Polish & Scale (Week 3)
- [ ] Add audio/TTS
- [ ] Implement conversation practice mode
- [ ] Add caching & cost optimization
- [ ] User preference learning
- [ ] Error handling & fallbacks

---

## Cost Optimization Strategies

1. **Cache aggressively**: Store generated challenges for 30 days
2. **Use smaller models**: GPT-4o-mini for simple tasks
3. **Free image APIs**: Pollinations.ai, Unsplash
4. **Batch requests**: Generate multiple challenges at once
5. **User-tier limits**: Free vs Pro daily limits

---

## Environment Variables Needed

```env
# AI Services
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=... (optional, for better TTS)
UNSPLASH_ACCESS_KEY=... (optional, for photos)

# Feature Flags
ENABLE_AI_CHALLENGES=true
ENABLE_AI_TUTOR=true
ENABLE_IMAGE_GENERATION=true
ENABLE_TTS=true
```

---

## Key Files to Create/Modify

### New Files:
1. `db/schema.ts` - Add AI tables
2. `lib/ai/types.ts` - TypeScript interfaces
3. `lib/ai/providers/openai.ts` - OpenAI client
4. `lib/ai/providers/pollinations.ts` - Free image gen
5. `lib/ai/challenge-generator.ts` - Challenge logic
6. `lib/ai/tutor-agent.ts` - Conversational tutor
7. `lib/ai/image-generator.ts` - Image generation
8. `lib/ai/cache.ts` - Caching utilities
9. `lib/ai/prompts/challenge-prompts.ts` - Prompts
10. `lib/ai/prompts/tutor-prompts.ts` - Tutor personas
11. `app/api/ai/generate-challenge/route.ts`
12. `app/api/ai/tutor-chat/route.ts`
13. `app/api/ai/generate-image/route.ts`
14. `app/(main)/learn/lesson/[id]/page.tsx` - Dynamic lesson page
15. `components/challenge/*` - Challenge UI components

### Modified Files:
1. `db/schema.ts` - Add new tables
2. `package.json` - Already added AI deps
3. `.env` - Add API keys

---

## Example: Challenge Generation Prompt

```typescript
// lib/ai/prompts/challenge-prompts.ts

export const CHALLENGE_GENERATION_PROMPT = `
You are an expert language teacher creating interactive exercises for {language} learners.

Generate a {challengeType} challenge for:
- Topic: {topic}
- Difficulty: {difficulty} (beginner/intermediate/advanced)
- Target vocabulary: {vocabulary}
- Lesson context: {context}

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

Rules:
- For SELECT: 4 options, 1 correct, include imagePrompt for visual options
- For ASSIST: Provide sentence with blank, 3-4 fill options
- For TRANSLATE: Provide source sentence, target translation options
- Make it culturally relevant to {language} speakers
- Use Devanagari/appropriate script for Indian languages
`;
```

---

## Example: Tutor Persona (Telugu)

```typescript
// lib/ai/prompts/tutor-prompts.ts

export const TUTOR_PERSONAS = {
  telugu: {
    name: "Priya",
    personality: "Warm, encouraging, patient Telugu teacher from Hyderabad",
    systemPrompt: `You are Priya, a friendly Telugu tutor from Hyderabad. 
    You speak Telugu (తెలుగు) and English. 
    Teaching style: Encouraging, uses examples from daily life, 
    explains grammar simply, celebrates small wins.
    Current student level: {level}
    Current topic: {topic}
    
    Guidelines:
    - Mix Telugu and English naturally
    - Correct gently with explanations
    - Ask follow-up questions
    - Use cultural references (food, festivals, family)
    - Keep responses concise (2-3 sentences max)
    - End with a question to continue conversation`,
  },
  hindi: {
    name: "Raj",
    personality: "Enthusiastic Hindi teacher from Delhi",
    systemPrompt: `...`,
  },
  // ... other languages
};
```

---

## Next Steps

1. **Review this plan** - Confirm approach aligns with your vision
2. **Add API keys** to `.env` (OpenAI required, others optional)
3. **Run schema migration** after adding AI tables
4. **Start with Phase 1** - Foundation

Would you like me to proceed with Phase 1 implementation?