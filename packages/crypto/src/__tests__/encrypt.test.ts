import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../encrypt";
import sodium from "libsodium-wrappers-sumo";

describe("encrypt / decrypt", () => {
  it("encrypt() returns ciphertext and nonce as Uint8Array", async () => {
    await sodium.ready;
    const key = sodium.crypto_secretbox_keygen();
    const plaintext = sodium.from_string("hello world");
    const result = await encrypt(plaintext, key);
    expect(result.ciphertext).toBeInstanceOf(Uint8Array);
    expect(result.nonce).toBeInstanceOf(Uint8Array);
    expect(result.nonce.length).toBe(sodium.crypto_secretbox_NONCEBYTES);
  });

  it("decrypt() returns original plaintext", async () => {
    await sodium.ready;
    const key = sodium.crypto_secretbox_keygen();
    const plaintext = sodium.from_string("hello world");
    const { ciphertext, nonce } = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, nonce, key);
    expect(sodium.to_string(decrypted)).toBe("hello world");
  });

  it("decrypt with wrong key throws error", async () => {
    await sodium.ready;
    const key = sodium.crypto_secretbox_keygen();
    const wrongKey = sodium.crypto_secretbox_keygen();
    const plaintext = sodium.from_string("secret data");
    const { ciphertext, nonce } = await encrypt(plaintext, key);
    await expect(decrypt(ciphertext, nonce, wrongKey)).rejects.toThrow();
  });

  it("decrypt with wrong nonce throws error", async () => {
    await sodium.ready;
    const key = sodium.crypto_secretbox_keygen();
    const plaintext = sodium.from_string("secret data");
    const { ciphertext } = await encrypt(plaintext, key);
    const wrongNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    await expect(decrypt(ciphertext, wrongNonce, key)).rejects.toThrow();
  });
});
