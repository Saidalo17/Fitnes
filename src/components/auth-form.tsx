"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";

type Props = {
  mode: "login" | "register";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function AuthForm({ mode, action }: Props) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});
  const isRegister = mode === "register";
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="p-6">
      <h1 className="mb-6 text-3xl font-extrabold">
        {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
      </h1>
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {isRegister && (
          <Input
            name="name"
            label={t("auth.name")}
            autoComplete="name"
            defaultValue={state.values?.name}
            error={fe.name?.[0]}
          />
        )}
        <Input
          name="email"
          type="email"
          label={t("auth.email")}
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          error={fe.email?.[0]}
        />
        <Input
          name="password"
          type="password"
          label={t("auth.password")}
          autoComplete={isRegister ? "new-password" : "current-password"}
          error={fe.password?.[0]}
        />
        {isRegister && <p className="-mt-2 text-xs text-muted">{t("auth.passwordHint")}</p>}
        {state.error && (
          <p role="alert" className="text-sm text-danger-text">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending
            ? t("common.wait")
            : isRegister
              ? t("auth.registerSubmit")
              : t("auth.loginSubmit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? t("auth.hasAccount") : t("auth.noAccount")}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-semibold text-accent-text underline"
        >
          {isRegister ? t("auth.toLogin") : t("auth.toRegister")}
        </Link>
      </p>
    </Card>
  );
}
