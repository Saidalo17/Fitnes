import { CoachChat } from "@/components/coach/coach-chat";
import { getT } from "@/i18n/server";
import { loadChat } from "@/lib/coach-server";
import { requireOnboardedUser } from "@/lib/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: `${t("coach.title")} — Fitnes` };
}

export default async function CoachPage() {
  const { userId } = await requireOnboardedUser();
  const history = await loadChat(userId);
  return <CoachChat initial={history} configured={!!process.env.ANTHROPIC_API_KEY} />;
}
