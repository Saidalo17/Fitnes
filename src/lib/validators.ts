import { z } from "zod";
import type { TFunction } from "@/i18n/translate";

export const makeLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().toLowerCase().email(t("validation.email")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

export const makeRegisterSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(60, t("validation.nameTooLong")),
    email: z.string().trim().toLowerCase().email(t("validation.email")).max(254),
    password: z
      .string()
      .min(8, t("validation.passwordMin"))
      .max(72, t("validation.passwordMax"))
      .regex(/[A-Za-zА-Яа-яЁё]/, t("validation.passwordLetter"))
      .regex(/\d/, t("validation.passwordDigit")),
  });

export type LoginInput = z.infer<ReturnType<typeof makeLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof makeRegisterSchema>>;

const GOALS = ["lose_weight", "gain_weight", "build_muscle"] as const;
const MUSCLES_LIST = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "glutes",
  "full_body",
] as const;

export const makeProfileSchema = (t: TFunction) =>
  z
    .object({
      sex: z.enum(["male", "female", "other"], { message: t("validation.required") }),
      birthYear: z
        .number({ message: t("validation.birthYear") })
        .int()
        .min(1930, t("validation.birthYear"))
        .max(new Date().getFullYear() - 10, t("validation.birthYear")),
      heightCm: z
        .number({ message: t("validation.height") })
        .int(t("validation.height"))
        .min(100, t("validation.height"))
        .max(250, t("validation.height")),
      weightKg: z
        .number({ message: t("validation.weight") })
        .min(30, t("validation.weight"))
        .max(300, t("validation.weight")),
      goal: z.enum(GOALS, { message: t("validation.required") }),
      focusMuscle: z.enum(MUSCLES_LIST).nullable(),
      place: z.enum(["gym", "home", "both"], { message: t("validation.required") }),
      level: z.enum(["beginner", "intermediate", "advanced"], {
        message: t("validation.required"),
      }),
      weeklyTarget: z.number().int().min(1).max(7),
    })
    .refine((v) => v.goal !== "build_muscle" || v.focusMuscle !== null, {
      path: ["focusMuscle"],
      message: t("validation.focusRequired"),
    });

export type ProfileInput = z.infer<ReturnType<typeof makeProfileSchema>>;

export const makeWeightSchema = (t: TFunction) =>
  z
    .number({ message: t("validation.weight") })
    .min(30, t("validation.weight"))
    .max(300, t("validation.weight"));
