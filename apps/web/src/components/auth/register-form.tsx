"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@legalconnect/shared";
import { registerUser } from "@/server/actions/auth.actions";
import { PasswordStrength } from "./password-strength";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");
  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("role", data.role);

    const result = await registerUser(formData);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">V\u00e9rifiez votre email</h2>
        <p className="text-muted-foreground">
          Un email de v\u00e9rification vous a \u00e9t\u00e9 envoy\u00e9. Veuillez cliquer sur le
          lien contenu dans cet email pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">
        Cr\u00e9er mon compte
      </h1>
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
            autoComplete="new-password"
            {...register("password")}
          />
          <PasswordStrength password={password} />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Type de compte</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("role", "avocat", { shouldValidate: true })}
              className={cn(
                "rounded-md border p-3 text-center text-sm font-medium transition-colors",
                role === "avocat"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-primary/50"
              )}
            >
              Je suis avocat
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "client", { shouldValidate: true })}
              className={cn(
                "rounded-md border p-3 text-center text-sm font-medium transition-colors",
                role === "client"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted hover:border-primary/50"
              )}
            >
              Je suis un client
            </button>
          </div>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Cr\u00e9ation en cours\u2026" : "Cr\u00e9er mon compte"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          D\u00e9j\u00e0 un compte ?{" "}
          <Link href="/login" className="text-primary underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
