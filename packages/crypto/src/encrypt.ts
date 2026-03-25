import sodium from "libsodium-wrappers-sumo";
import type { EncryptedData } from "./types";

export async function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
): Promise<EncryptedData> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintext, nonce, key);
  return { ciphertext, nonce };
}

export async function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array,
): Promise<Uint8Array> {
  await sodium.ready;
  const result = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  if (!result) {
    throw new Error("Decryption failed: invalid key, nonce, or tampered data");
  }
  return result;
}
