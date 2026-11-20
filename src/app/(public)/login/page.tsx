import { loginUser } from "@/actions/auth";
import { getT } from "@/i18n/server";
import { AuthForm } from "@/components/auth-form";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.login") };
}

export default function LoginPage() {
  return <AuthForm mode="login" action={loginUser} />;
}
