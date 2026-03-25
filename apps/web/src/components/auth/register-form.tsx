"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@legalconnect/shared";
import { registerUser } from "@/server/actions/auth.actions";
import { PasswordStrength } from "./password-strength";
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
        <h2 className="mb-4 text-xl font-semibold">Verifiez votre email</h2>
        <p className="text-muted-foreground">
          Un email de verification vous a ete envoye. Veuillez cliquer sur le
          lien contenu dans cet email pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">
        Creer mon compte
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          <label className="text-sm font-medium">Type de compte</label>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Creation en cours..." : "Creer mon compte"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Deja un compte ?{" "}
          <Link href="/login" className="text-primary underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
