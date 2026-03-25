import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import sodium from "libsodium-wrappers-sumo";
import { deriveKey, generateSalt, KDF_OPSLIMIT, KDF_MEMLIMIT, KDF_ALG } from "./kdf";
import { encrypt, decrypt } from "./encrypt";
import type { RecoveryBundle } from "./types";

/**
 * Generate a 12-word BIP39 mnemonic (128 bits entropy).
 * D-01: System-generated, not user-chosen.
 */
export async function generateRecoveryMnemonic(): Promise<string> {
  await sodium.ready;
  return bip39.generateMnemonic(wordlist, 128);
}

/**
 * Encrypt a private key using a mnemonic-derived key.
 * The mnemonic is run through Argon2id to derive an encryption key.
 * D-02: If mnemonic is lost, there is no server recourse.
 */
export async function encryptPrivateKey(
  secretKey: Uint8Array,
  mnemonic: string,
): Promise<RecoveryBundle> {
  await sodium.ready;
  const salt = await generateSalt();
  const derivedKey = await deriveKey(mnemonic, salt);
  const { ciphertext, nonce } = await encrypt(secretKey, derivedKey);

  return {
    encryptedPrivateKey: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
    salt: sodium.to_base64(salt, sodium.base64_variants.ORIGINAL),
    params: {
      opslimit: KDF_OPSLIMIT,
      memlimit: KDF_MEMLIMIT,
      alg: KDF_ALG,
    },
  };
}

/**
 * Decrypt a private key from a RecoveryBundle using the original mnemonic.
 * D-02: Throws if mnemonic is wrong (no recovery possible).
 */
export async function decryptPrivateKey(
  bundle: RecoveryBundle,
  mnemonic: string,
): Promise<Uint8Array> {
  await sodium.ready;
  const salt = sodium.from_base64(bundle.salt, sodium.base64_variants.ORIGINAL);
  const nonce = sodium.from_base64(bundle.nonce, sodium.base64_variants.ORIGINAL);
  const ciphertext = sodium.from_base64(
    bundle.encryptedPrivateKey,
    sodium.base64_variants.ORIGINAL,
  );

  const derivedKey = await deriveKey(mnemonic, salt);
  return decrypt(ciphertext, nonce, derivedKey);
}

/**
 * Select `count` unique random word indices (0-11) for verification.
 * D-04: User verifies 3 random words to confirm they saved the mnemonic.
 * Uses cryptographic randomness (sodium.randombytes_uniform).
 */
export async function selectRandomWordIndices(count = 3): Promise<number[]> {
  await sodium.ready;
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(sodium.randombytes_uniform(12));
  }
  return [...indices].sort((a, b) => a - b);
}

/**
 * Verify that the user correctly entered specific words from their mnemonic.
 * D-04: Blocking verification screen before proceeding.
 */
export function verifyPassphraseWords(
  mnemonic: string,
  attempts: Record<number, string>,
): boolean {
  const words = mnemonic.split(" ");
  return Object.entries(attempts).every(
    ([indexStr, attempt]) =>
      words[Number(indexStr)]?.toLowerCase().trim() ===
      attempt.toLowerCase().trim(),
  );
}
