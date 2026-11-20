import { eq } from "drizzle-orm";
import { FOODS } from "./seed-foods";
import { EX_EN, LEVEL_EN, MUSCLE_EN, PLACE_EN } from "./seed-en";

try {
  process.loadEnvFile(".env.local");
} catch {
  // нет .env.local — локальная БД
}

type Muscle = "chest" | "back" | "legs" | "shoulders" | "arms" | "abs" | "glutes" | "full_body";
type Equip = "none" | "dumbbells" | "barbell" | "machine" | "bands";
type Place = "gym" | "home" | "both";
type Level = "beginner" | "intermediate" | "advanced";
type Goal = "lose_weight" | "gain_weight" | "build_muscle";

type Ex = {
  slug: string;
  name: string;
  muscle: Muscle;
  equip: Equip;
  place: Place;
  diff: 1 | 2 | 3;
  timed?: boolean;
  tips: string;
};

const EXERCISES: Ex[] = [
  // Грудь
  {
    slug: "push-up",
    name: "Отжимания",
    muscle: "chest",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Корпус прямой, локти под углом 45° к телу.",
  },
  {
    slug: "incline-push-up",
    name: "Отжимания с упором на возвышение",
    muscle: "chest",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Руки на скамье или стуле — нагрузка легче.",
  },
  {
    slug: "diamond-push-up",
    name: "Алмазные отжимания",
    muscle: "chest",
    equip: "none",
    place: "both",
    diff: 2,
    tips: "Ладони образуют ромб; акцент на трицепс и внутреннюю часть груди.",
  },
  {
    slug: "dumbbell-bench-press",
    name: "Жим гантелей лёжа",
    muscle: "chest",
    equip: "dumbbells",
    place: "both",
    diff: 2,
    tips: "Опускайте гантели до уровня груди, лопатки сведены.",
  },
  {
    slug: "barbell-bench-press",
    name: "Жим штанги лёжа",
    muscle: "chest",
    equip: "barbell",
    place: "gym",
    diff: 2,
    tips: "Стопы на полу, штангу опускайте на нижнюю часть груди.",
  },
  {
    slug: "incline-dumbbell-press",
    name: "Жим гантелей на наклонной скамье",
    muscle: "chest",
    equip: "dumbbells",
    place: "gym",
    diff: 2,
    tips: "Угол скамьи 30–45°, акцент на верх груди.",
  },
  {
    slug: "cable-fly",
    name: "Сведение рук в кроссовере",
    muscle: "chest",
    equip: "machine",
    place: "gym",
    diff: 2,
    tips: "Небольшой изгиб в локтях, плавное сведение.",
  },
  {
    slug: "dumbbell-fly",
    name: "Разведение гантелей лёжа",
    muscle: "chest",
    equip: "dumbbells",
    place: "both",
    diff: 2,
    tips: "Не опускайте локти ниже уровня плеч.",
  },
  // Спина
  {
    slug: "pull-up",
    name: "Подтягивания",
    muscle: "back",
    equip: "none",
    place: "gym",
    diff: 3,
    tips: "Тянитесь грудью к перекладине, без раскачки.",
  },
  {
    slug: "lat-pulldown",
    name: "Тяга верхнего блока",
    muscle: "back",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Тяните к верху груди, лопатки вниз и к центру.",
  },
  {
    slug: "barbell-row",
    name: "Тяга штанги в наклоне",
    muscle: "back",
    equip: "barbell",
    place: "gym",
    diff: 3,
    tips: "Спина прямая, тяните к поясу.",
  },
  {
    slug: "dumbbell-row",
    name: "Тяга гантели одной рукой",
    muscle: "back",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Опора рукой и коленом о скамью, локоть вдоль тела.",
  },
  {
    slug: "superman",
    name: "Супермен",
    muscle: "back",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Лёжа на животе, поднимайте руки и ноги, задержка на 1–2 сек.",
  },
  {
    slug: "band-row",
    name: "Тяга резинки к поясу",
    muscle: "back",
    equip: "bands",
    place: "home",
    diff: 1,
    tips: "Сводите лопатки, не поднимайте плечи.",
  },
  {
    slug: "seated-cable-row",
    name: "Тяга нижнего блока сидя",
    muscle: "back",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Корпус неподвижен, тяните рукоять к животу.",
  },
  // Ноги
  {
    slug: "bodyweight-squat",
    name: "Приседания",
    muscle: "legs",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Колени по линии носков, колени не заваливать внутрь.",
  },
  {
    slug: "lunge",
    name: "Выпады",
    muscle: "legs",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Шаг вперёд, оба колена под 90°.",
  },
  {
    slug: "goblet-squat",
    name: "Кубковые приседания",
    muscle: "legs",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Гантель у груди, спина прямая.",
  },
  {
    slug: "barbell-squat",
    name: "Приседания со штангой",
    muscle: "legs",
    equip: "barbell",
    place: "gym",
    diff: 3,
    tips: "Присед до параллели бёдер с полом, корпус жёсткий.",
  },
  {
    slug: "leg-press",
    name: "Жим ногами",
    muscle: "legs",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Поясница прижата, колени не выпрямлять до конца.",
  },
  {
    slug: "romanian-deadlift",
    name: "Румынская тяга",
    muscle: "legs",
    equip: "barbell",
    place: "gym",
    diff: 2,
    tips: "Таз назад, штанга скользит вдоль ног.",
  },
  {
    slug: "bulgarian-split-squat",
    name: "Болгарские выпады",
    muscle: "legs",
    equip: "dumbbells",
    place: "both",
    diff: 3,
    tips: "Задняя нога на опоре, вес на передней.",
  },
  {
    slug: "calf-raise",
    name: "Подъём на носки",
    muscle: "legs",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Полная амплитуда, пауза вверху.",
  },
  {
    slug: "leg-extension",
    name: "Разгибание ног в тренажёре",
    muscle: "legs",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Плавно, без рывков.",
  },
  // Плечи
  {
    slug: "pike-push-up",
    name: "Отжимания «уголком»",
    muscle: "shoulders",
    equip: "none",
    place: "home",
    diff: 2,
    tips: "Таз вверх, голова между руками.",
  },
  {
    slug: "dumbbell-shoulder-press",
    name: "Жим гантелей сидя",
    muscle: "shoulders",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Не прогибайте поясницу.",
  },
  {
    slug: "lateral-raise",
    name: "Махи гантелей в стороны",
    muscle: "shoulders",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Локти чуть согнуты, до уровня плеч.",
  },
  {
    slug: "overhead-press",
    name: "Жим штанги стоя",
    muscle: "shoulders",
    equip: "barbell",
    place: "gym",
    diff: 2,
    tips: "Корпус напряжён, штанга над головой.",
  },
  {
    slug: "face-pull",
    name: "Тяга каната к лицу",
    muscle: "shoulders",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Локти высоко, разводите концы каната.",
  },
  {
    slug: "band-lateral-raise",
    name: "Махи с резинкой в стороны",
    muscle: "shoulders",
    equip: "bands",
    place: "home",
    diff: 1,
    tips: "Встаньте на резинку, поднимайте руки в стороны.",
  },
  // Руки
  {
    slug: "bicep-curl",
    name: "Сгибание рук с гантелями",
    muscle: "arms",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Локти прижаты к корпусу.",
  },
  {
    slug: "hammer-curl",
    name: "Молотковые сгибания",
    muscle: "arms",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Ладони смотрят друг на друга.",
  },
  {
    slug: "triceps-dip",
    name: "Обратные отжимания от скамьи",
    muscle: "arms",
    equip: "none",
    place: "both",
    diff: 2,
    tips: "Локти назад, не разводите в стороны.",
  },
  {
    slug: "triceps-pushdown",
    name: "Разгибание рук на блоке",
    muscle: "arms",
    equip: "machine",
    place: "gym",
    diff: 1,
    tips: "Локти неподвижны.",
  },
  {
    slug: "skull-crusher",
    name: "Французский жим лёжа",
    muscle: "arms",
    equip: "barbell",
    place: "gym",
    diff: 2,
    tips: "Опускайте штангу ко лбу, локти узко.",
  },
  {
    slug: "overhead-triceps-extension",
    name: "Французский жим гантели из-за головы",
    muscle: "arms",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Локти смотрят вверх.",
  },
  {
    slug: "band-curl",
    name: "Сгибание рук с резинкой",
    muscle: "arms",
    equip: "bands",
    place: "home",
    diff: 1,
    tips: "Медленный негатив при опускании.",
  },
  // Пресс
  {
    slug: "plank",
    name: "Планка",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 1,
    timed: true,
    tips: "Тело — прямая линия, живот втянут.",
  },
  {
    slug: "crunch",
    name: "Скручивания",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Поднимайте лопатки, поясница прижата.",
  },
  {
    slug: "leg-raise",
    name: "Подъём ног лёжа",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 2,
    tips: "Поясница прижата к полу.",
  },
  {
    slug: "russian-twist",
    name: "Русские скручивания",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 2,
    tips: "Поворачивайте корпус, а не только руки.",
  },
  {
    slug: "bicycle-crunch",
    name: "Велосипед",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Локоть к противоположному колену.",
  },
  {
    slug: "cable-crunch",
    name: "Скручивания на блоке",
    muscle: "abs",
    equip: "machine",
    place: "gym",
    diff: 2,
    tips: "Скручивайте корпус, а не тяните руками.",
  },
  {
    slug: "mountain-climber",
    name: "Альпинист",
    muscle: "abs",
    equip: "none",
    place: "both",
    diff: 2,
    timed: true,
    tips: "Из упора лёжа быстро подтягивайте колени.",
  },
  // Ягодицы
  {
    slug: "glute-bridge",
    name: "Ягодичный мостик",
    muscle: "glutes",
    equip: "none",
    place: "both",
    diff: 1,
    tips: "Сжимайте ягодицы вверху.",
  },
  {
    slug: "hip-thrust",
    name: "Ягодичный мост со штангой",
    muscle: "glutes",
    equip: "barbell",
    place: "gym",
    diff: 2,
    tips: "Спина на скамье, подбородок к груди.",
  },
  {
    slug: "donkey-kick",
    name: "Отведение ноги назад на четвереньках",
    muscle: "glutes",
    equip: "none",
    place: "home",
    diff: 1,
    tips: "Не прогибайте поясницу.",
  },
  {
    slug: "cable-kickback",
    name: "Отведение ноги назад на блоке",
    muscle: "glutes",
    equip: "machine",
    place: "gym",
    diff: 2,
    tips: "Движение из бедра, медленно.",
  },
  {
    slug: "sumo-squat",
    name: "Сумо-приседания",
    muscle: "glutes",
    equip: "dumbbells",
    place: "both",
    diff: 1,
    tips: "Широкая стойка, носки в стороны.",
  },
  {
    slug: "band-lateral-walk",
    name: "Шаги в стороны с резинкой",
    muscle: "glutes",
    equip: "bands",
    place: "home",
    diff: 1,
    tips: "Резинка над коленями, лёгкий присед.",
  },
  // Всё тело / кардио
  {
    slug: "burpee",
    name: "Бёрпи",
    muscle: "full_body",
    equip: "none",
    place: "both",
    diff: 3,
    timed: true,
    tips: "Держите темп, приземляйтесь мягко.",
  },
  {
    slug: "jumping-jack",
    name: "Прыжки «звёздочка»",
    muscle: "full_body",
    equip: "none",
    place: "both",
    diff: 1,
    timed: true,
    tips: "Ровное дыхание, мягкие приземления.",
  },
  {
    slug: "high-knees",
    name: "Бег с высоким подниманием колен",
    muscle: "full_body",
    equip: "none",
    place: "both",
    diff: 1,
    timed: true,
    tips: "Колени до уровня бёдер.",
  },
  {
    slug: "jump-squat",
    name: "Приседания с прыжком",
    muscle: "full_body",
    equip: "none",
    place: "both",
    diff: 2,
    timed: true,
    tips: "Мягкое приземление на носки, затем на всю стопу.",
  },
  {
    slug: "kettlebell-swing",
    name: "Махи гантелью",
    muscle: "full_body",
    equip: "dumbbells",
    place: "both",
    diff: 2,
    tips: "Движение от бёдер, спина прямая.",
  },
  {
    slug: "deadlift",
    name: "Становая тяга",
    muscle: "full_body",
    equip: "barbell",
    place: "gym",
    diff: 3,
    tips: "Спина нейтральна, штанга вплотную к ногам.",
  },
  {
    slug: "rowing-machine",
    name: "Гребной тренажёр",
    muscle: "full_body",
    equip: "machine",
    place: "gym",
    diff: 1,
    timed: true,
    tips: "Сначала ноги, потом корпус, затем руки.",
  },
  {
    slug: "treadmill-intervals",
    name: "Интервалы на дорожке",
    muscle: "full_body",
    equip: "machine",
    place: "gym",
    diff: 1,
    timed: true,
    tips: "Чередуйте 30 сек быстро / 30 сек медленно.",
  },
];

const MUSCLE_RU: Record<Muscle, string> = {
  chest: "грудь",
  back: "спина",
  legs: "ноги",
  shoulders: "плечи",
  arms: "руки",
  abs: "пресс",
  glutes: "ягодицы",
  full_body: "всё тело",
};
const LEVEL_RU: Record<Level, string> = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
};
const LEVEL_MAX_DIFF: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const fits = (e: Ex, place: "gym" | "home") => e.place === "both" || e.place === place;

type PlanItem = {
  ex: Ex;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  rest: number;
};
type WorkoutDef = {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  place: "gym" | "home";
  goal: Goal;
  targetMuscle: Muscle | null;
  level: Level;
  durationMin: number;
  items: PlanItem[];
};

function item(ex: Ex, goal: Goal): PlanItem {
  if (ex.timed) return { ex, sets: 3, reps: null, durationSec: 40, rest: 30 };
  if (goal === "lose_weight") return { ex, sets: 3, reps: 15, durationSec: null, rest: 30 };
  if (goal === "gain_weight") return { ex, sets: 4, reps: 8, durationSec: null, rest: 90 };
  return { ex, sets: 4, reps: 10, durationSec: null, rest: 60 };
}

function estimateMinutes(items: PlanItem[]) {
  const sec = items.reduce(
    (s, i) => s + i.sets * ((i.durationSec ?? (i.reps ?? 10) * 3) + i.rest),
    0,
  );
  return Math.max(10, Math.round(sec / 60 / 5) * 5);
}

function buildWorkouts(): WorkoutDef[] {
  const out: WorkoutDef[] = [];
  const places = ["gym", "home"] as const;
  const placeRu = { gym: "в зале", home: "дома" };
  const levels: Level[] = ["beginner", "intermediate", "advanced"];

  // Накачать часть тела: место × мышца (16)
  for (const place of places) {
    for (const muscle of Object.keys(MUSCLE_RU) as Muscle[]) {
      const level: Level = place === "home" ? "beginner" : "intermediate";
      const pool = EXERCISES.filter((e) => e.muscle === muscle && fits(e, place));
      const items = pool.slice(0, 5).map((e) => item(e, "build_muscle"));
      out.push({
        slug: `muscle-${muscle}-${place}`,
        title: `Накачать: ${MUSCLE_RU[muscle]} ${placeRu[place]}`,
        titleEn: `Build: ${MUSCLE_EN[muscle]} ${PLACE_EN[place]}`,
        description: `Целевая тренировка на группу мышц «${MUSCLE_RU[muscle]}» ${placeRu[place]}.`,
        descriptionEn: `A targeted ${MUSCLE_EN[muscle]} workout ${PLACE_EN[place]}.`,
        place,
        goal: "build_muscle",
        targetMuscle: muscle,
        level,
        durationMin: estimateMinutes(items),
        items,
      });
    }
  }

  // Сброс веса: круговые тренировки (6)
  for (const place of places) {
    for (const level of levels) {
      const pool = EXERCISES.filter(
        (e) =>
          ["full_body", "legs", "abs"].includes(e.muscle) &&
          fits(e, place) &&
          e.diff <= LEVEL_MAX_DIFF[level],
      );
      const count = { beginner: 5, intermediate: 6, advanced: 7 }[level];
      // чередуем группы: кардио → ноги → пресс
      const groups = ["full_body", "legs", "abs"].map((m) => pool.filter((e) => e.muscle === m));
      const picked: Ex[] = [];
      for (let round = 0; picked.length < count; round++) {
        let added = false;
        for (const g of groups) {
          if (g[round] && picked.length < count) {
            picked.push(g[round]);
            added = true;
          }
        }
        if (!added) break;
      }
      const items = picked.map((e) => item(e, "lose_weight"));
      out.push({
        slug: `lose-weight-${place}-${level}`,
        title: `Сжигание жира ${placeRu[place]} · ${LEVEL_RU[level]}`,
        titleEn: `Fat burn ${PLACE_EN[place]} · ${LEVEL_EN[level]}`,
        description: `Круговая тренировка с высоким расходом энергии ${placeRu[place]}.`,
        descriptionEn: `A high-energy circuit workout ${PLACE_EN[place]}.`,
        place,
        goal: "lose_weight",
        targetMuscle: null,
        level,
        durationMin: estimateMinutes(items),
        items,
      });
    }
  }

  // Набор веса: базовые многосуставные (6)
  for (const place of places) {
    for (const level of levels) {
      const items: PlanItem[] = [];
      for (const muscle of ["legs", "chest", "back", "shoulders"] as Muscle[]) {
        const pool = EXERCISES.filter(
          (e) => e.muscle === muscle && fits(e, place) && e.diff <= LEVEL_MAX_DIFF[level],
        ).sort((a, b) => b.diff - a.diff);
        pool
          .slice(0, level === "beginner" ? 1 : 2)
          .forEach((e) => items.push(item(e, "gain_weight")));
      }
      out.push({
        slug: `gain-weight-${place}-${level}`,
        title: `Набор массы ${placeRu[place]} · ${LEVEL_RU[level]}`,
        titleEn: `Mass gain ${PLACE_EN[place]} · ${LEVEL_EN[level]}`,
        description: `Базовые упражнения на крупные мышцы для набора массы ${placeRu[place]}.`,
        descriptionEn: `Basic compound lifts for the big muscle groups to gain mass ${PLACE_EN[place]}.`,
        place,
        goal: "gain_weight",
        targetMuscle: null,
        level,
        durationMin: estimateMinutes(items),
        items,
      });
    }
  }
  return out;
}

const ACHIEVEMENTS = [
  {
    code: "first_workout",
    title: "Первая тренировка",
    description: "Завершите свою первую тренировку",
    icon: "flag",
    xpBonus: 50,
  },
  {
    code: "streak_3",
    title: "Три дня подряд",
    description: "Тренируйтесь 3 дня подряд",
    icon: "flame",
    xpBonus: 50,
  },
  {
    code: "streak_7",
    title: "Неделя огня",
    description: "Тренируйтесь 7 дней подряд",
    icon: "flame",
    xpBonus: 150,
  },
  {
    code: "workouts_10",
    title: "10 тренировок",
    description: "Завершите 10 тренировок",
    icon: "dumbbell",
    xpBonus: 100,
  },
  {
    code: "workouts_50",
    title: "50 тренировок",
    description: "Завершите 50 тренировок",
    icon: "medal",
    xpBonus: 300,
  },
  {
    code: "lost_1kg",
    title: "Минус 1 кг",
    description: "Снизьте вес на 1 кг от стартового",
    icon: "trending-down",
    xpBonus: 100,
  },
  {
    code: "all_muscles",
    title: "Все группы мышц",
    description: "Проработайте все группы мышц",
    icon: "body",
    xpBonus: 200,
  },
];

async function main() {
  const { db } = await import("./client");
  const s = await import("./schema");

  for (const e of EXERCISES) {
    const row = {
      slug: e.slug,
      name: e.name,
      nameEn: EX_EN[e.slug]?.[0] ?? e.name,
      description: "",
      muscleGroup: e.muscle,
      equipment: e.equip,
      place: e.place,
      difficulty: e.diff,
      timed: !!e.timed,
      tips: e.tips,
      tipsEn: EX_EN[e.slug]?.[1] ?? e.tips,
    };
    await db
      .insert(s.exercises)
      .values(row)
      .onConflictDoUpdate({ target: s.exercises.slug, set: row });
  }
  const exRows = await db.select().from(s.exercises);
  const exId = new Map(exRows.map((r) => [r.slug, r.id]));

  const workouts = buildWorkouts();
  for (const w of workouts) {
    const row = {
      slug: w.slug,
      title: w.title,
      titleEn: w.titleEn,
      description: w.description,
      descriptionEn: w.descriptionEn,
      place: w.place,
      goal: w.goal,
      targetMuscle: w.targetMuscle,
      level: w.level,
      durationMin: w.durationMin,
      xpReward: w.durationMin * 2,
    };
    await db
      .insert(s.workouts)
      .values(row)
      .onConflictDoUpdate({ target: s.workouts.slug, set: row });
    const [saved] = await db.select().from(s.workouts).where(eq(s.workouts.slug, w.slug));
    await db.delete(s.workoutExercises).where(eq(s.workoutExercises.workoutId, saved.id));
    await db.insert(s.workoutExercises).values(
      w.items.map((it, i) => ({
        workoutId: saved.id,
        exerciseId: exId.get(it.ex.slug)!,
        position: i + 1,
        sets: it.sets,
        reps: it.reps,
        durationSec: it.durationSec,
        restSec: it.rest,
      })),
    );
  }

  for (const a of ACHIEVEMENTS) {
    await db
      .insert(s.achievements)
      .values(a)
      .onConflictDoUpdate({ target: s.achievements.code, set: a });
  }

  for (const food of FOODS) {
    await db.insert(s.foods).values(food).onConflictDoUpdate({ target: s.foods.slug, set: food });
  }

  console.log(
    `Seed OK: упражнений ${EXERCISES.length}, тренировок ${workouts.length}, достижений ${ACHIEVEMENTS.length}, продуктов ${FOODS.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
