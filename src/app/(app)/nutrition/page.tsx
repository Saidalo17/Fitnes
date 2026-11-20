import { NutritionView } from "@/components/nutrition/nutrition-view";
import { getT } from "@/i18n/server";
import { getNutritionPage } from "@/lib/nutrition-data";
import { getTzOffset } from "@/lib/prefs";
import { requireOnboardedUser } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("nutrition.title")} — Fitnes` };
}

export default async function NutritionPage() {
  const { userId, profile } = await requireOnboardedUser();
  const data = await getNutritionPage(userId, profile, await getTzOffset());
  return <NutritionView data={data} minorNote={data.targets.minorNoDeficit} />;
}
