import { describe, it, expect } from "vitest";
import {
  requestPasswordReset,
  resetPassword,
} from "@/server/actions/auth.actions";
import {
  createTestUser,
  getStore,
  mockSendPasswordResetEmail,
  type MockPasswordResetToken,
} from "../setup";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}

function createResetToken(
  overrides: Partial<MockPasswordResetToken> & { userId: string }
): MockPasswordResetToken {
  const token: MockPasswordResetToken = {
    id: crypto.randomUUID(),
    token: `reset_token_${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h (3600 * 1000)
    usedAt: null,
    ...overrides,
  };
  getStore().passwordResetTokens.push(token);
  return token;
}

describe("requestPasswordReset", () => {
  it("creates 1h token and sends email for existing user", async () => {
    createTestUser({
      email: "exists@example.com",
      emailVerified: new Date(),
    });

    const result = await requestPasswordReset(
      makeFormData({ email: "exists@example.com" })
    );

    expect(result).toEqual({ success: true });
    expect(getStore().passwordResetTokens.length).toBe(1);

    const token = getStore().passwordResetTokens[0];
    const expiryDiff = token.expiresAt.getTime() - Date.now();
    // Should be approximately 1 hour (within 1 minute tolerance)
    expect(expiryDiff).toBeGreaterThan(59 * 60 * 1000);
    expect(expiryDiff).toBeLessThanOrEqual(60 * 60 * 1000 + 60000);

    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("returns success for non-existent email (no information leak)", async () => {
    const result = await requestPasswordReset(
      makeFormData({ email: "nobody@example.com" })
    );

    expect(result).toEqual({ success: true });
    expect(getStore().passwordResetTokens.length).toBe(0);
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  it("updates password hash and marks token used for valid token", async () => {
    const user = createTestUser({
      email: "reset@example.com",
      passwordHash: "old_hash",
    });
    const token = createResetToken({ userId: user.id });

    const result = await resetPassword(
      makeFormData({
        token: token.token,
        password: "newpassword123",
        confirmPassword: "newpassword123",
      })
    );

    expect(result).toEqual({ success: true });

    // Check password was updated (should be a bcrypt hash, not plaintext)
    const updatedUser = getStore().users.find((u) => u.id === user.id);
    expect(updatedUser?.passwordHash).not.toBe("newpassword123");
    expect(updatedUser?.passwordHash).toMatch(/^\$2[ab]\$/);

    // Check token was marked as used
    const updatedToken = getStore().passwordResetTokens.find(
      (t) => t.id === token.id
    );
    expect(updatedToken?.usedAt).toBeInstanceOf(Date);
  });

  it("returns error for expired token (>1h)", async () => {
    const user = createTestUser({ email: "expired@example.com" });
    const token = createResetToken({
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await resetPassword(
      makeFormData({
        token: token.token,
        password: "newpassword123",
        confirmPassword: "newpassword123",
      })
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain("expire");
  });

  it("returns Zod validation error for mismatched passwords", async () => {
    await expect(
      resetPassword(
        makeFormData({
          token: "anytoken",
          password: "newpassword123",
          confirmPassword: "differentpassword",
        })
      )
    ).rejects.toThrow();
  });
});
