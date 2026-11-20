import { registerUser } from "@/actions/auth";
import { getT } from "@/i18n/server";
import { AuthForm } from "@/components/auth-form";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.register") };
}

export default function RegisterPage() {
  return <AuthForm mode="register" action={registerUser} />;
}
