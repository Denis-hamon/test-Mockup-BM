import { describe, it, expect } from "vitest";
import { registerUser } from "@/server/actions/auth.actions";
import {
  getStore,
  createTestUser,
  mockSendVerificationEmail,
} from "../setup";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

describe("registerUser", () => {
  it("registers a new user with valid data", async () => {
    const result = await registerUser(
      makeFormData({
        email: "new@example.com",
        password: "securepass123",
        role: "avocat",
      })
    );

    expect(result).toEqual({ success: true });
    expect(getStore().users.length).toBe(1);
    expect(getStore().users[0].email).toBe("new@example.com");
    expect(getStore().users[0].role).toBe("avocat");
  });

  it("rejects registration with existing email", async () => {
    createTestUser({ email: "existing@example.com" });

    const result = await registerUser(
      makeFormData({
        email: "existing@example.com",
        password: "securepass123",
        role: "client",
      })
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain("existe deja");
  });

  it("rejects registration with password < 8 chars", async () => {
    await expect(
      registerUser(
        makeFormData({
          email: "test@example.com",
          password: "short",
          role: "client",
        })
      )
    ).rejects.toThrow();
  });

  it("rejects registration without role", async () => {
    await expect(
      registerUser(
        makeFormData({
          email: "test@example.com",
          password: "securepass123",
        })
      )
    ).rejects.toThrow();
  });

  it("creates a 24h email verification token after registration", async () => {
    await registerUser(
      makeFormData({
        email: "token@example.com",
        password: "securepass123",
        role: "client",
      })
    );

    const tokens = getStore().emailVerificationTokens;
    expect(tokens.length).toBe(1);
    const token = tokens[0];
    const expiryDiff = token.expiresAt.getTime() - Date.now();
    // Should be approximately 24 hours (within 1 minute tolerance)
    expect(expiryDiff).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(expiryDiff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 60000);
  });

  it("calls sendVerificationEmail after registration", async () => {
    await registerUser(
      makeFormData({
        email: "verify@example.com",
        password: "securepass123",
        role: "avocat",
      })
    );

    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "verify@example.com",
      expect.any(String)
    );
  });

  it("password is hashed with bcrypt before storage (never stored in plaintext)", async () => {
    await registerUser(
      makeFormData({
        email: "hash@example.com",
        password: "mysecretpassword",
        role: "client",
      })
    );

    const user = getStore().users.find((u) => u.email === "hash@example.com");
    expect(user).toBeDefined();
    // Password must not be stored in plaintext
    expect(user!.passwordHash).not.toBe("mysecretpassword");
    // bcrypt hashes start with $2a$ or $2b$
    expect(user!.passwordHash).toMatch(/^\$2[ab]\$/);
  });
});
