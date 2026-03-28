"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@legalconnect/shared";
import { loginAction } from "@/server/actions/login.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data.email, data.password);
      if (result?.error) {
        setServerError(result.error);
      }
      // On success, signIn throws NEXT_REDIRECT which auto-navigates
    });
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">Se connecter</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nom@exemple.fr"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending ? "Connexion en cours…" : "Se connecter"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/reset-password" className="text-primary underline">
            Mot de passe oublié ?
          </Link>
          <p>
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-primary underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
