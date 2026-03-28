"use client";

import { useState } from "react";
import { decryptPrivateKey, type RecoveryBundle } from "@legalconnect/crypto";
import { getEncryptionKeys } from "@/server/actions/encryption.actions";

export function RecoveryRestore() {
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Get encrypted bundle from server
      const keysResult = await getEncryptionKeys();
      if ("error" in keysResult && keysResult.error) {
        setError(keysResult.error);
        return;
      }

      const keys = keysResult as {
        publicKey: string;
        encryptedPrivateKey: string;
        recoverySalt: string;
        recoveryNonce: string;
        recoveryParams: string;
      };

      // 2. Reconstruct mnemonic
      const mnemonic = words.map((w) => w.trim().toLowerCase()).join(" ");

      // 3. Build RecoveryBundle from server data
      const params = JSON.parse(keys.recoveryParams);
      const bundle: RecoveryBundle = {
        encryptedPrivateKey: keys.encryptedPrivateKey,
        nonce: keys.recoveryNonce,
        salt: keys.recoverySalt,
        params,
      };

      // 4. Decrypt private key
      const secretKey = await decryptPrivateKey(bundle, mnemonic);

      // 5. Store in IndexedDB
      await storeKeyInIndexedDB(secretKey);

      setSuccess(true);

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch {
      // D-02: No server recourse
      setError(
        "Phrase de r\u00e9cup\u00e9ration incorrecte. Vos donn\u00e9es ne peuvent pas \u00eatre d\u00e9chiffr\u00e9es."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Cl\u00e9 restaur\u00e9e avec succ\u00e8s. Redirection\u2026
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-center text-2xl font-semibold">
        Restaurer vos cl\u00e9s de chiffrement
      </h1>

      <p className="mb-6 text-center text-sm text-muted-foreground">
        Entrez vos 12 mots de r\u00e9cup\u00e9ration pour restaurer l&apos;acc\u00e8s \u00e0 vos
        donn\u00e9es chiffr\u00e9es sur cet appareil.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {words.map((word, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <label
                htmlFor={`restore-word-${idx}`}
                className="text-xs font-mono text-muted-foreground"
              >
                {idx + 1}.
              </label>
              <input
                id={`restore-word-${idx}`}
                type="text"
                autoComplete="off"
                value={word}
                onChange={(e) =>
                  setWords((prev) => {
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  })
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Restauration\u2026" : "Restaurer mes cl\u00e9s"}
        </button>
      </form>
    </div>
  );
}

async function storeKeyInIndexedDB(secretKey: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("legalconnect_keys", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("keys", "readwrite");
      const store = tx.objectStore("keys");
      store.put(Array.from(secretKey), "legalconnect_private_key");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}
