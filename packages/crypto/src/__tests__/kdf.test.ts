import { describe, it, expect } from "vitest";
import { deriveKey, generateSalt } from "../kdf";

describe("kdf", () => {
  it("deriveKey() returns a 32-byte Uint8Array", async () => {
    const salt = await generateSalt();
    const key = await deriveKey("test-password", salt);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
  });

  it("same password + salt produces same key (deterministic)", async () => {
    const salt = await generateSalt();
    const key1 = await deriveKey("my-password", salt);
    const key2 = await deriveKey("my-password", salt);
    expect(key1).toEqual(key2);
  });

  it("different passwords produce different keys", async () => {
    const salt = await generateSalt();
    const key1 = await deriveKey("password-a", salt);
    const key2 = await deriveKey("password-b", salt);
    expect(key1).not.toEqual(key2);
  });

  it("generateSalt() returns 16-byte Uint8Array", async () => {
    const salt = await generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });
});
