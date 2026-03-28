"use client";

import { useState, useEffect } from "react";
import {
  selectRandomWordIndices,
  verifyPassphraseWords,
} from "@legalconnect/crypto";

interface RecoveryVerifyProps {
  mnemonic: string;
  onVerified: () => void;
}

export function RecoveryVerify({ mnemonic, onVerified }: RecoveryVerifyProps) {
  const [indices, setIndices] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    selectRandomWordIndices(3).then(setIndices);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      const verified = verifyPassphraseWords(mnemonic, attempts);

      if (verified) {
        onVerified();
      } else {
        setError(
          "Les mots ne correspondent pas. Veuillez reessayer."
        );
      }
    } finally {
      setVerifying(false);
    }
  }

  if (indices.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-center text-xl font-semibold">
        Vérification de la phrase de récupération
      </h2>

      <p className="mb-6 text-center text-sm text-muted-foreground">
        Pour confirmer que vous avez bien noté votre phrase, entrez les mots
        demandés ci-dessous.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {indices.map((idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <label
              htmlFor={`word-${idx}`}
              className="text-sm font-medium"
            >
              Mot n.{idx + 1}
            </label>
            <input
              id={`word-${idx}`}
              type="text"
              autoComplete="off"
              value={attempts[idx] || ""}
              onChange={(e) =>
                setAttempts((prev) => ({
                  ...prev,
                  [idx]: e.target.value,
                }))
              }
              className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying}
          className="mt-2 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {verifying ? "Verification..." : "Verifier"}
        </button>
      </form>
    </div>
  );
}
