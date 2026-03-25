import { describe, it, expect, beforeAll } from "vitest";
import { createTestUser, getStore } from "../setup";
import { loginSchema } from "@legalconnect/shared";

/**
 * Tests for the authorize function behavior in Auth.js Credentials provider.
 * We test the authorization logic directly since the actual Auth.js config
 * cannot be unit-tested without a full server context.
 *
 * We use a local import of bcryptjs for hashing test passwords.
 */

let bcryptHash: (password: string, rounds: number) => Promise<string>;
let bcryptCompare: (password: string, hash: string) => Promise<boolean>;
let hashedPassword: string;

beforeAll(async () => {
  // Dynamic import to handle bcryptjs resolution
  const bcrypt = await import("bcryptjs");
  bcryptHash = bcrypt.default?.hash || bcrypt.hash;
  bcryptCompare = bcrypt.default?.compare || bcrypt.compare;
  hashedPassword = await bcryptHash("correctpassword", 4);
});

async function simulateAuthorize(credentials: {
  email: string;
  password: string;
}) {
  const { email, password } = loginSchema.parse(credentials);
  const user = getStore().users.find((u) => u.email === email) || null;

  if (!user || !user.passwordHash) return null;
  if (!user.emailVerified) return null;
  if (user.deletedAt) return null;

  const valid = await bcryptCompare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

describe("authorize (login)", () => {
  it("returns user object for valid credentials (verified user)", async () => {
    createTestUser({
      email: "verified@example.com",
      passwordHash: hashedPassword,
      role: "avocat",
      emailVerified: new Date(),
    });

    const result = await simulateAuthorize({
      email: "verified@example.com",
      password: "correctpassword",
    });

    expect(result).not.toBeNull();
    expect(result!.email).toBe("verified@example.com");
    expect(result!.role).toBe("avocat");
    expect(result!.id).toBeDefined();
  });

  it("returns null for invalid password", async () => {
    createTestUser({
      email: "user@example.com",
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    });

    const result = await simulateAuthorize({
      email: "user@example.com",
      password: "wrongpassword",
    });

    expect(result).toBeNull();
  });

  it("returns null for unverified email (cannot log in until verified)", async () => {
    createTestUser({
      email: "unverified@example.com",
      passwordHash: hashedPassword,
      emailVerified: null,
    });

    const result = await simulateAuthorize({
      email: "unverified@example.com",
      password: "correctpassword",
    });

    expect(result).toBeNull();
  });

  it("returns null for soft-deleted user", async () => {
    createTestUser({
      email: "deleted@example.com",
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      deletedAt: new Date(),
    });

    const result = await simulateAuthorize({
      email: "deleted@example.com",
      password: "correctpassword",
    });

    expect(result).toBeNull();
  });

  it("returns null for non-existent email", async () => {
    const result = await simulateAuthorize({
      email: "nobody@example.com",
      password: "anypassword",
    });

    expect(result).toBeNull();
  });
});
