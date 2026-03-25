import { describe, it, expect } from "vitest";
import {
  generateRecoveryMnemonic,
  encryptPrivateKey,
  decryptPrivateKey,
  selectRandomWordIndices,
  verifyPassphraseWords,
} from "../recovery";
import { generateKeypair } from "../keypair";
import { wordlist } from "@scure/bip39/wordlists/english.js";

describe("recovery", () => {
  it("generateRecoveryMnemonic() returns a string with exactly 12 words", async () => {
    const mnemonic = await generateRecoveryMnemonic();
    const words = mnemonic.split(" ");
    expect(words.length).toBe(12);
  });

  it("each word in the mnemonic is from the BIP39 English wordlist", async () => {
    const mnemonic = await generateRecoveryMnemonic();
    const words = mnemonic.split(" ");
    for (const word of words) {
      expect(wordlist).toContain(word);
    }
  });

  it("encryptPrivateKey() returns a RecoveryBundle with base64 strings", async () => {
    const kp = await generateKeypair();
    const mnemonic = await generateRecoveryMnemonic();
    const bundle = await encryptPrivateKey(kp.secretKey, mnemonic);
    expect(typeof bundle.encryptedPrivateKey).toBe("string");
    expect(typeof bundle.nonce).toBe("string");
    expect(typeof bundle.salt).toBe("string");
    expect(bundle.encryptedPrivateKey.length).toBeGreaterThan(0);
    expect(bundle.nonce.length).toBeGreaterThan(0);
    expect(bundle.salt.length).toBeGreaterThan(0);
    expect(bundle.params).toHaveProperty("opslimit");
    expect(bundle.params).toHaveProperty("memlimit");
    expect(bundle.params).toHaveProperty("alg");
  });

  it("decryptPrivateKey() returns the original secretKey", async () => {
    const kp = await generateKeypair();
    const mnemonic = await generateRecoveryMnemonic();
    const bundle = await encryptPrivateKey(kp.secretKey, mnemonic);
    const recovered = await decryptPrivateKey(bundle, mnemonic);
    expect(recovered).toEqual(kp.secretKey);
  });

  it("decryptPrivateKey with wrong mnemonic throws error", async () => {
    const kp = await generateKeypair();
    const mnemonic = await generateRecoveryMnemonic();
    const wrongMnemonic = await generateRecoveryMnemonic();
    const bundle = await encryptPrivateKey(kp.secretKey, mnemonic);
    await expect(decryptPrivateKey(bundle, wrongMnemonic)).rejects.toThrow();
  });

  it("selectRandomWordIndices(3) returns 3 sorted unique numbers between 0-11", async () => {
    const indices = await selectRandomWordIndices(3);
    expect(indices.length).toBe(3);
    // Sorted
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    // Unique
    expect(new Set(indices).size).toBe(3);
    // In range 0-11
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(11);
    }
  });

  it("verifyPassphraseWords returns true for correct words (D-04)", async () => {
    const mnemonic = await generateRecoveryMnemonic();
    const words = mnemonic.split(" ");
    const attempts: Record<number, string> = {
      0: words[0],
      5: words[5],
      11: words[11],
    };
    const result = verifyPassphraseWords(mnemonic, attempts);
    expect(result).toBe(true);
  });

  it("verifyPassphraseWords returns false for incorrect words", async () => {
    const mnemonic = await generateRecoveryMnemonic();
    const attempts: Record<number, string> = {
      0: "wrongword",
      5: "anotherwrong",
      11: "badword",
    };
    const result = verifyPassphraseWords(mnemonic, attempts);
    expect(result).toBe(false);
  });

  it("full round-trip: generate keypair -> encrypt with mnemonic -> decrypt -> keys match", async () => {
    const kp = await generateKeypair();
    const mnemonic = await generateRecoveryMnemonic();
    const bundle = await encryptPrivateKey(kp.secretKey, mnemonic);
    const recovered = await decryptPrivateKey(bundle, mnemonic);
    expect(recovered).toEqual(kp.secretKey);
    // Also verify public key can still be derived (key integrity)
    expect(recovered.length).toBe(32);
  });
});
