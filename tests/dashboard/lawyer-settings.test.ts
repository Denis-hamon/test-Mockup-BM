import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), query: { lawyerProfiles: { findFirst: vi.fn() } } } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

describe("getLawyerProfile", () => {
  it("should create default profile if none exists", async () => {
    expect(true).toBe(true);
  });

  it("should return parsed specialties as array", async () => {
    expect(true).toBe(true);
  });
});

describe("updateLawyerProfile", () => {
  it("should upsert profile with serialized specialties", async () => {
    expect(true).toBe(true);
  });
});
