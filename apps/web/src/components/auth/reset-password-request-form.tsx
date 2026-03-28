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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
        <h2 className="mb-4 text-xl font-semibold">Email envoyé</h2>
        <p className="mb-4 text-muted-foreground">
          Si un compte existe avec cet email, vous recevrez un lien de
          réinitialisation.
        </p>
        <Link href="/login" className="text-primary underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-semibold">
        Mot de passe oublié
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Entrez votre adresse email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi en cours…" : "Envoyer le lien"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
