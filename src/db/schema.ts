import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const MUSCLES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "glutes",
  "full_body",
] as const;
export const GOALS = ["lose_weight", "gain_weight", "build_muscle"] as const;
export const PLACES = ["gym", "home"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const EQUIPMENT = ["none", "dumbbells", "barbell", "machine", "bands"] as const;

const now = sql`(unixepoch())`;

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sex: text("sex", { enum: ["male", "female", "other"] }),
  birthYear: integer("birth_year"),
  heightCm: integer("height_cm"),
  weightKg: real("weight_kg"),
  goal: text("goal", { enum: GOALS }),
  focusMuscle: text("focus_muscle", { enum: MUSCLES }),
  place: text("place", { enum: ["gym", "home", "both"] }),
  level: text("level", { enum: LEVELS }),
  weeklyTarget: integer("weekly_target").default(3),
  xp: integer("xp").notNull().default(0),
  theme: text("theme", { enum: ["system", "light", "dark"] })
    .notNull()
    .default("system"),
  reduceEffects: integer("reduce_effects", { mode: "boolean" }).notNull().default(false),
});

export const weightLogs = sqliteTable(
  "weight_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: real("weight_kg").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("weight_logs_user_date").on(t.userId, t.loggedAt)],
);

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull().default(""),
  muscleGroup: text("muscle_group", { enum: MUSCLES }).notNull(),
  equipment: text("equipment", { enum: EQUIPMENT }).notNull(),
  place: text("place", { enum: ["gym", "home", "both"] }).notNull(),
  videoUrl: text("video_url"),
  posterUrl: text("poster_url"),
  difficulty: integer("difficulty").notNull().default(1),
  timed: integer("timed", { mode: "boolean" }).notNull().default(false),
  tips: text("tips"),
  tipsEn: text("tips_en"),
});

export const workouts = sqliteTable(
  "workouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    titleEn: text("title_en"),
    description: text("description").notNull().default(""),
    descriptionEn: text("description_en"),
    place: text("place", { enum: PLACES }).notNull(),
    goal: text("goal", { enum: GOALS }).notNull(),
    targetMuscle: text("target_muscle", { enum: MUSCLES }),
    level: text("level", { enum: LEVELS }).notNull(),
    durationMin: integer("duration_min").notNull(),
    coverUrl: text("cover_url"),
    xpReward: integer("xp_reward").notNull().default(50),
  },
  (t) => [
    index("workouts_place_goal").on(t.place, t.goal),
    index("workouts_muscle").on(t.targetMuscle),
  ],
);

export const workoutExercises = sqliteTable(
  "workout_exercises",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    position: integer("position").notNull(),
    sets: integer("sets").notNull(),
    reps: integer("reps"),
    durationSec: integer("duration_sec"),
    restSec: integer("rest_sec").notNull().default(60),
    suggestedWeightKg: real("suggested_weight_kg"),
  },
  (t) => [index("workout_exercises_workout").on(t.workoutId, t.position)],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(now),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    durationSec: integer("duration_sec"),
    xpEarned: integer("xp_earned").notNull().default(0),
    totalVolumeKg: real("total_volume_kg").notNull().default(0),
  },
  (t) => [index("workout_sessions_user_date").on(t.userId, t.startedAt)],
);

export const sessionSets = sqliteTable(
  "session_sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    weightKg: real("weight_kg"),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [uniqueIndex("session_sets_unique").on(t.sessionId, t.exerciseId, t.setNumber)],
);

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpBonus: integer("xp_bonus").notNull().default(0),
});

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id),
    unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

export const FOOD_CATEGORIES = [
  "grains",
  "protein",
  "dairy",
  "vegetables",
  "fruits",
  "fats",
  "legumes",
] as const;
export const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snack"] as const;

/** Справочник продуктов: КБЖУ на 100 г (приблизительные средние значения). */
export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  category: text("category", { enum: FOOD_CATEGORIES }).notNull(),
  kcal: real("kcal").notNull(),
  protein: real("protein").notNull(),
  fat: real("fat").notNull(),
  carbs: real("carbs").notNull(),
  /** Типичная порция, г. */
  servingG: integer("serving_g").notNull().default(100),
});

/** Что пользователь съел: приём пищи + продукт + граммы за локальный день. */
export const mealLogs = sqliteTable(
  "meal_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    meal: text("meal", { enum: MEAL_KEYS }).notNull(),
    foodId: integer("food_id")
      .notNull()
      .references(() => foods.id),
    grams: real("grams").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("meal_logs_user_day").on(t.userId, t.day)],
);

export const waterLogs = sqliteTable(
  "water_logs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    ml: integer("ml").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

/** История чата с ИИ-помощником (только вопросы по тренировкам и питанию). */
export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    /** false — вопрос не по теме, ответ заменён отказом. */
    onTopic: integer("on_topic", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("chat_messages_user_date").on(t.userId, t.createdAt)],
);
