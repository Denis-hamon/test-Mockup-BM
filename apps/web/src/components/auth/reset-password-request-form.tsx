"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from "@legalconnect/shared";
import { requestPasswordReset } from "@/server/actions/auth.actions";

export function ResetPasswordRequestForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  async function onSubmit(data: ResetPasswordRequestInput) {
    const formData = new FormData();
    formData.set("email", data.email);
    await requestPasswordReset(formData);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Email envoye</h2>
        <p className="mb-4 text-muted-foreground">
          Si un compte existe avec cet email, vous recevrez un lien de
          reinitialisation.
        </p>
        <Link href="/login" className="text-primary underline">
          Retour a la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-semibold">
        Mot de passe oublie
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Entrez votre adresse email pour recevoir un lien de reinitialisation.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Retour a la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
