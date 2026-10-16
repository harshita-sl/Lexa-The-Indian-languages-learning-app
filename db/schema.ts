import { integer, pgTable, serial, text, pgEnum, boolean, timestamp, jsonb, real, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    imageSrc: text("image_src").notNull(),
});

export const aiGeneratedContent = pgTable("ai_generated_content", {
    id: serial("id").primaryKey(),
    contentType: text("content_type").notNull(),
    inputHash: text("input_hash").notNull(),
    content: jsonb("content").notNull(),
    language: text("language").notNull(),
    topic: text("topic"),
    difficulty: text("difficulty"),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    reviewStatus: text("review_status").notNull().default("unreviewed"), // 'unreviewed' | 'reviewed' | 'rejected'
}, (t) => ({
    contentTypeHashIdx: uniqueIndex("ai_content_type_hash_idx").on(t.contentType, t.inputHash),
}));

export const conversations = pgTable("conversations", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    language: text("language").notNull(),
    messages: jsonb("messages").notNull(),
    context: text("context"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
    userId: text("user_id").primaryKey(),
    learningStyle: text("learning_style").default("balanced"),
    difficulty: text("difficulty").default("adaptive"),
    dailyGoalMinutes: integer("daily_goal_minutes").default(15),
    preferredTopics: text("preferred_topics").array().default([]),
    nativeLanguage: text("native_language").default("English"),
    targetLanguage: text("target_language"),
    goal: text("goal").default("culture"), // 'travel' | 'family' | 'work' | 'culture'
    currentLevel: text("current_level").default("beginner"),
    targetRegister: text("target_register").default("colloquial"),
    transliterationMode: text("transliteration_mode").default("both"),
    assessmentCompleted: boolean("assessment_completed").default(false),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
    userProgresses: many(userProgress),
    units: many(units),
    learnerKnowledgeNodes: many(learnerKnowledgeNodes),
}));

export const units = pgTable("units", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    order: integer("order").notNull(),
});

export const unitRelations = relations(units, ({ many, one }) => ({
    course: one(courses, {
        fields: [units.courseId],
        references: [courses.id],
    }),
    lessons: many(lessons),
}));

export const lessons = pgTable("lessons", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
    order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
    unit: one(units, {
        fields: [lessons.unitId],
        references: [units.id],
    }),
    challenges: many(challenges),
}));

export const challengesEnum = pgEnum("type", [
    "SELECT",
    "ASSIST",
    "TRANSLATE",
    "SPEAK",
    "LISTEN",
    "CONVERSATION",
    "MATCH",
    "ORDER"
]);

export const challenges = pgTable("challenges", {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    type: challengesEnum("type").notNull(),
    question: text("question").notNull(),
    order: integer("order").notNull(),
    // Adaptive-path linkage (nullable keeps legacy lessons working)
    conceptId: text("concept_id"),
    skill: text("skill"), // 'vocabulary' | 'script' | 'listening' | 'speaking' | 'grammar' | 'conversation'
    itemDifficulty: real("item_difficulty").default(0), // Elo beta
    reviewStatus: text("review_status").notNull().default("seeded"), // 'seeded' | 'unreviewed' | 'reviewed'
    source: text("source").notNull().default("seed"), // 'seed' | 'llm'
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
    lesson: one(lessons, {
        fields: [challenges.lessonId],
        references: [lessons.id],
    }),
    challengeOptions: many(challengeOptions),
    challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable("challenge_options", {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
    text: text("text").notNull(),
    correct: boolean("correct").notNull(),
    imageSrc: text("image_src"),
    audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(challengeOptions, ({ one }) => ({
    challenge: one(challenges, {
        fields: [challengeOptions.challengeId],
        references: [challenges.id],
    }),
}));

export const challengeProgress = pgTable("challenge_progress", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
    completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
    challenge: one(challenges, {
        fields: [challengeProgress.challengeId],
        references: [challenges.id],
    }),
}));

// Clean, zero-gamification user progress
export const userProgress = pgTable("user_progress", {
    userId: text("user_id").primaryKey(),
    userName: text("user_name").notNull().default("Learner"),
    userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
    activeCourseId: integer("active_course_id").references(() => courses.id, { onDelete: "cascade" }),
    completedChallenges: integer("completed_challenges").notNull().default(0),
    accuracyRate: real("accuracy_rate").notNull().default(1.0),
    lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
    activeCourse: one(courses, {
        fields: [userProgress.activeCourseId],
        references: [courses.id],
    }),
}));

// FSRS Spaced Repetition Knowledge Nodes
export const learnerKnowledgeNodes = pgTable("learner_knowledge_nodes", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    conceptId: text("concept_id").notNull(),
    conceptType: text("concept_type").notNull().default("vocabulary"), // 'vocabulary' | 'grammar_rule' | 'honorific' | 'script' | 'syntax'
    stability: real("stability").notNull().default(1.0), // S in days
    difficulty: real("difficulty").notNull().default(5.0), // D (1 - 10)
    retrievability: real("retrievability").notNull().default(1.0), // R (0.0 - 1.0)
    lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
    dueAt: timestamp("due_at").defaultNow(),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    state: text("state").notNull().default("learning"), // 'learning' | 'review' | 'mastered'
}, (t) => ({
    userConceptIdx: uniqueIndex("lkn_user_concept_idx").on(t.userId, t.courseId, t.conceptId),
}));

export const learnerKnowledgeNodesRelations = relations(learnerKnowledgeNodes, ({ one }) => ({
    course: one(courses, {
        fields: [learnerKnowledgeNodes.courseId],
        references: [courses.id],
    }),
}));

// Session and Diagnostic Interaction Logs — append-only evidence stream
export const learnerSessions = pgTable("learner_sessions", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    challengeId: text("challenge_id").notNull(),
    conceptId: text("concept_id").notNull(),
    itemId: text("item_id"), // learner_items.itemKey when granular
    skill: text("skill"), // 'vocabulary' | 'script' | 'listening' | 'speaking' | 'grammar' | 'conversation'
    source: text("source").notNull().default("lesson"), // 'lesson' | 'practice' | 'chat' | 'placement'
    taskReason: text("task_reason"), // why this task was served
    userAnswer: text("user_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    latencyMs: integer("latency_ms").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    errorClassification: text("error_classification").default("none"), // 'syntax' | 'l1_interference' | 'phonetic' | 'pragmatic' | 'none'
    acousticPhoneticScore: real("acoustic_phonetic_score"),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const learnerSessionsRelations = relations(learnerSessions, ({ one }) => ({
    course: one(courses, {
        fields: [learnerSessions.courseId],
        references: [courses.id],
    }),
}));

export const aiGeneratedContentRelations = relations(aiGeneratedContent, ({ }) => ({}));
export const conversationsRelations = relations(conversations, ({ }) => ({}));
export const userPreferencesRelations = relations(userPreferences, ({ }) => ({}));

// ── Adaptive engine tables ──────────────────────────────────────────────────

// Per-user-per-skill state: Elo ability + BKT mastery estimate
export const learnerSkillState = pgTable("learner_skill_state", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    skill: text("skill").notNull(), // 'vocabulary' | 'script' | 'listening' | 'speaking' | 'grammar' | 'conversation'
    elo: real("elo").notNull().default(1000),
    bktKnown: real("bkt_known").notNull().default(0.2),
    bktLearn: real("bkt_learn").notNull().default(0.15),
    bktGuess: real("bkt_guess").notNull().default(0.22),
    bktSlip: real("bkt_slip").notNull().default(0.10),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
}, (t) => ({
    userSkillIdx: uniqueIndex("lss_user_skill_idx").on(t.userId, t.courseId, t.skill),
}));

// Granular per-item memory (words, phrases, slang collected incl. from chat)
export const learnerItems = pgTable("learner_items", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    itemKey: text("item_key").notNull(), // e.g. 'telugu_vocab_greetings:namaskaram'
    conceptId: text("concept_id").notNull(),
    itemType: text("item_type").notNull().default("word"), // 'word' | 'phrase' | 'slang'
    stability: real("stability").notNull().default(1.0),
    difficulty: real("difficulty").notNull().default(5.0),
    retrievability: real("retrievability").notNull().default(1.0),
    lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
    dueAt: timestamp("due_at").defaultNow(),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    state: text("state").notNull().default("learning"),
}, (t) => ({
    userItemIdx: uniqueIndex("li_user_item_idx").on(t.userId, t.itemKey),
}));

// Item bank — concept-tagged practice questions (seeded + LLM-generated)
export const practiceItems = pgTable("practice_items", {
    id: serial("id").primaryKey(),
    language: text("language").notNull(),
    conceptId: text("concept_id").notNull(),
    skill: text("skill").notNull().default("vocabulary"),
    type: text("type").notNull().default("SELECT"), // challenge enum strings
    payload: jsonb("payload").notNull(), // { question, options[], correctAnswer, explanation, hints[] }
    difficultyB: real("difficulty_b").notNull().default(0), // Elo beta, seeded from concept level
    reviewStatus: text("review_status").notNull().default("seeded"),
    source: text("source").notNull().default("seed"),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
    itemHashIdx: uniqueIndex("pi_lang_concept_hash_idx").on(t.language, t.conceptId, t.contentHash),
}));

// Explainability: every served task logs why it was chosen
export const recommendationLog = pgTable("recommendation_log", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    taskType: text("task_type").notNull(), // 'fsrs_review' | 'zpd_new' | 'remediation' | 'conversation' | 'placement'
    conceptId: text("concept_id"),
    itemKey: text("item_key"),
    reason: text("reason").notNull(),
    scores: jsonb("scores"), // { urgency, zpdReadiness, eloProximity, remediationBoost, total }
    servedAt: timestamp("served_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

// Spoken-language knowledge base: slang, idioms, colloquial phrases
export const spokenContent = pgTable("spoken_content", {
    id: serial("id").primaryKey(),
    language: text("language").notNull(),
    kind: text("kind").notNull().default("slang"), // 'slang' | 'idiom' | 'colloquial' | 'register_note' | 'phrase'
    nativeText: text("native_text").notNull(),
    translit: text("translit"),
    gloss: text("gloss").notNull(), // English meaning
    register: text("register").notNull().default("casual"), // 'casual' | 'very_informal' | 'rude' | 'regional' | 'formal'
    region: text("region"), // e.g. 'Telangana', 'Bengaluru'
    example: jsonb("example"), // { native, translit, english }
    conceptId: text("concept_id"), // nearest knowledge-graph node
    reviewStatus: text("review_status").notNull().default("unreviewed"),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
    spokenHashIdx: uniqueIndex("sc_lang_hash_idx").on(t.language, t.contentHash),
}));

export const learnerSkillStateRelations = relations(learnerSkillState, ({ one }) => ({
    course: one(courses, { fields: [learnerSkillState.courseId], references: [courses.id] }),
}));
export const learnerItemsRelations = relations(learnerItems, ({ one }) => ({
    course: one(courses, { fields: [learnerItems.courseId], references: [courses.id] }),
}));
export const practiceItemsRelations = relations(practiceItems, ({ }) => ({}));
export const recommendationLogRelations = relations(recommendationLog, ({ one }) => ({
    course: one(courses, { fields: [recommendationLog.courseId], references: [courses.id] }),
}));
export const spokenContentRelations = relations(spokenContent, ({ }) => ({}));
