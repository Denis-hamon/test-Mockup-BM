import { describe, it, expect } from "vitest";
import { generateKeypair, publicKeyToBase64, base64ToKey } from "../keypair";

describe("keypair", () => {
  it("generateKeypair() returns publicKey and secretKey as Uint8Array(32)", async () => {
    const kp = await generateKeypair();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.secretKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.secretKey.length).toBe(32);
  });

  it("publicKeyToBase64() returns a non-empty base64 string", async () => {
    const kp = await generateKeypair();
    const b64 = await publicKeyToBase64(kp.publicKey);
    expect(typeof b64).toBe("string");
    expect(b64.length).toBeGreaterThan(0);
  });

  it("base64ToKey() round-trips with publicKeyToBase64()", async () => {
    const kp = await generateKeypair();
    const b64 = await publicKeyToBase64(kp.publicKey);
    const restored = await base64ToKey(b64);
    expect(restored).toEqual(kp.publicKey);
  });

  it("two generated keypairs have different public keys", async () => {
    const kp1 = await generateKeypair();
    const kp2 = await generateKeypair();
    expect(kp1.publicKey).not.toEqual(kp2.publicKey);
  });
});
