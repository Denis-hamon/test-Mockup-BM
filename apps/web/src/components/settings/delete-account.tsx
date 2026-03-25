"use client";

import { useState } from "react";
import {
  requestAccountDeletion,
  cancelAccountDeletion,
} from "@/server/actions/rgpd.actions";

export function DeleteAccount() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    try {
      const result = await requestAccountDeletion();
      if ("success" in result && result.success && "scheduledPurgeDate" in result) {
        setScheduledDate(result.scheduledPurgeDate);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const result = await cancelAccountDeletion();
      if ("success" in result && result.success) {
        setCancelled(true);
        setScheduledDate(null);
      }
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          La suppression de votre compte a ete annulee. Votre compte est de nouveau actif.
        </p>
      </div>
    );
  }

  if (scheduledDate) {
    const formattedDate = new Date(scheduledDate).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Suppression prevue le <span className="font-medium text-foreground">{formattedDate}</span>.
          Vous pouvez annuler la suppression avant cette date.
        </p>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Annulation..." : "Annuler la suppression"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-muted-foreground">
          La suppression de votre compte est irreversible apres 30 jours.
          Pendant cette periode, vous pouvez annuler la suppression.
        </p>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border"
        />
        <span className="text-sm">
          Je comprends que mes donnees chiffrees seront definitivement supprimees
        </span>
      </label>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!confirmed || loading}
        className="w-fit rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
      >
        {loading ? "Suppression..." : "Supprimer mon compte"}
      </button>
    </div>
  );
}
