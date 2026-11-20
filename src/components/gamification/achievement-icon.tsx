import {
  Dumbbell,
  Flag,
  Flame,
  Layers,
  Medal,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AchievementCode } from "@/lib/achievements";

const ICONS: Record<AchievementCode, LucideIcon> = {
  first_workout: Flag,
  streak_3: Flame,
  streak_7: Zap,
  workouts_10: Dumbbell,
  workouts_50: Medal,
  lost_1kg: TrendingDown,
  all_muscles: Layers,
};

export function AchievementIcon({ code, size = 24 }: { code: AchievementCode; size?: number }) {
  const Icon = ICONS[code] ?? Medal;
  return <Icon size={size} strokeWidth={1.75} />;
}
