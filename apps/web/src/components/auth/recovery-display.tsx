"use client";

import { useState, useEffect } from "react";
import {
  generateKeypair,
  publicKeyToBase64,
  generateRecoveryMnemonic,
  encryptPrivateKey,
} from "@legalconnect/crypto";
import { storeEncryptionKeys } from "@/server/actions/encryption.actions";
import { RecoveryVerify } from "./recovery-verify";

export function RecoveryDisplay() {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function initKeys() {
      try {
        // 1. Generate keypair
        const keypair = await generateKeypair();

        // 2. Generate 12-word recovery mnemonic (D-01: system-generated)
        const words = await generateRecoveryMnemonic();
        setMnemonic(words);

        // 3. Encrypt private key with mnemonic-derived key
        const bundle = await encryptPrivateKey(keypair.secretKey, words);

        // 4. Store public key + encrypted bundle on server
        const pubKeyB64 = await publicKeyToBase64(keypair.publicKey);
        const result = await storeEncryptionKeys({
          publicKey: pubKeyB64,
          encryptedPrivateKey: bundle.encryptedPrivateKey,
          recoverySalt: bundle.salt,
          recoveryNonce: bundle.nonce,
          recoveryParams: JSON.stringify(bundle.params),
        });

        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }

        // 5. Store secret key in IndexedDB for current session
        await storeKeyInIndexedDB(keypair.secretKey);
      } catch (err) {
        setError("Erreur lors de la generation des cles de chiffrement.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    initKeys();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">
            Generation de vos cles de chiffrement...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (showVerify && mnemonic) {
    return (
      <RecoveryVerify
        mnemonic={mnemonic}
        onVerified={() => {
          window.location.href = "/dashboard";
        }}
      />
    );
  }

  const words = mnemonic?.split(" ") ?? [];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-center text-2xl font-semibold">
        Phrase de recuperation
      </h1>

      {/* D-02: Warning about permanent loss */}
      <div className="mb-6 rounded-lg border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          IMPORTANT : Notez ces 12 mots dans l&apos;ordre exact. Ils sont votre
          unique moyen de recuperer vos donnees chiffrees. En cas de perte, vos
          donnees seront definitivement inaccessibles.
        </p>
      </div>

      {/* 12 words in a 3x4 grid */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {words.map((word, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-md border bg-card p-3"
          >
            <span className="text-xs font-mono text-muted-foreground">
              {idx + 1}.
            </span>
            <span className="font-medium">{word}</span>
          </div>
        ))}
      </div>

      {/* Copy button */}
      <div className="mb-4 flex justify-center">
        <button
          type="button"
          onClick={async () => {
            if (mnemonic) {
              await navigator.clipboard.writeText(mnemonic);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          {copied ? "Copie !" : "Copier"}
        </button>
      </div>

      {/* D-03: Blocking screen - NO skip button */}
      <button
        type="button"
        onClick={() => setShowVerify(true)}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
      >
        J&apos;ai note ma phrase de recuperation
      </button>
    </div>
  );
}

/**
 * Store the secret key in IndexedDB for current session use.
 * Key: "legalconnect_private_key"
 */
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
