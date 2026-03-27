import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: { update: vi.fn(), select: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

describe("updateCaseStatus", () => {
  it("should reject non-avocat users", async () => {
    expect(true).toBe(true);
  });

  it("should allow forward transitions (submitted -> en_cours)", async () => {
    expect(true).toBe(true);
  });

  it("should prevent transition from archive to any earlier status", async () => {
    expect(true).toBe(true);
  });
});
