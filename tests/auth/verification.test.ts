import { describe, it, expect } from "vitest";
import { verifyEmail } from "@/server/actions/auth.actions";
import {
  createTestUser,
  getStore,
  type MockEmailVerificationToken,
} from "../setup";

function createVerificationToken(
  overrides: Partial<MockEmailVerificationToken> & { userId: string }
): MockEmailVerificationToken {
  const token: MockEmailVerificationToken = {
    id: crypto.randomUUID(),
    token: `test_token_${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: null,
    ...overrides,
  };
  getStore().emailVerificationTokens.push(token);
  return token;
}

describe("verifyEmail", () => {
  it("marks user emailVerified and token used for valid token", async () => {
    const user = createTestUser({ email: "verify@example.com" });
    const token = createVerificationToken({ userId: user.id });

    const result = await verifyEmail(token.token);

    expect(result).toEqual({ success: true });

    const updatedUser = getStore().users.find((u) => u.id === user.id);
    expect(updatedUser?.emailVerified).toBeInstanceOf(Date);

    const updatedToken = getStore().emailVerificationTokens.find(
      (t) => t.id === token.id
    );
    expect(updatedToken?.usedAt).toBeInstanceOf(Date);
  });

  it("returns error for expired token (>24h)", async () => {
    const user = createTestUser({ email: "expired@example.com" });
    const token = createVerificationToken({
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await verifyEmail(token.token);

    expect(result.error).toBeDefined();
    expect(result.error).toContain("expire");
  });

  it("returns error for already-used token", async () => {
    const user = createTestUser({ email: "used@example.com" });
    const token = createVerificationToken({
      userId: user.id,
      usedAt: new Date(),
    });

    const result = await verifyEmail(token.token);

    expect(result.error).toBeDefined();
    expect(result.error).toContain("deja ete utilise");
  });

  it("returns error for non-existent token", async () => {
    const result = await verifyEmail("nonexistent_token");

    expect(result.error).toBeDefined();
    expect(result.error).toContain("invalide");
  });
});
