import sodium from "libsodium-wrappers-sumo";
import type { KeyPair } from "./types";

export async function generateKeypair(): Promise<KeyPair> {
  await sodium.ready;
  const kp = sodium.crypto_box_keypair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.privateKey,
  };
}

export async function publicKeyToBase64(key: Uint8Array): Promise<string> {
  await sodium.ready;
  return sodium.to_base64(key, sodium.base64_variants.ORIGINAL);
}

export async function base64ToKey(b64: string): Promise<Uint8Array> {
  await sodium.ready;
  return sodium.from_base64(b64, sodium.base64_variants.ORIGINAL);
}
