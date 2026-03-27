import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks ---
const _hoisted = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockFindFirst = vi.fn();
  const mockInsert = vi.fn();
  const mockValues = vi.fn();
  const mockReturning = vi.fn();
  const mockUpdate = vi.fn();
  const mockSet = vi.fn();
  const mockWhere = vi.fn();

  mockInsert.mockReturnValue({ values: mockValues.mockReturnValue({ returning: mockReturning }) });
  mockUpdate.mockReturnValue({ set: mockSet.mockReturnValue({ where: mockWhere.mockResolvedValue(undefined) }) });

  return { mockAuth, mockFindFirst, mockInsert, mockValues, mockReturning, mockUpdate, mockSet, mockWhere };
});

vi.mock("@/lib/auth", () => ({ auth: _hoisted.mockAuth }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      lawyerProfiles: { findFirst: _hoisted.mockFindFirst },
    },
    insert: _hoisted.mockInsert,
    update: _hoisted.mockUpdate,
  },
}));

vi.mock("@/lib/db/schema/lawyer", () => ({
  lawyerProfiles: { id: "lp.id", userId: "lp.userId" },
  lawyerNotes: { id: "ln.id", submissionId: "ln.submissionId", lawyerId: "ln.lawyerId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_a: any, _b: any) => ({ _type: "eq" })),
  and: vi.fn((...args: any[]) => args),
  relations: () => ({}),
}));

vi.mock("drizzle-orm/pg-core", () => {
  const chain = () => {
    const c: any = {};
    c.primaryKey = () => c;
    c.$defaultFn = () => c;
    c.notNull = () => c;
    c.unique = () => c;
    c.references = () => c;
    c.defaultNow = () => c;
    c.default = () => c;
    return c;
  };
  return {
    pgTable: (_name: string, cols: any) => ({ ...cols }),
    text: () => chain(),
    timestamp: () => chain(),
    integer: () => chain(),
    primaryKey: () => ({}),
  };
});

import { getLawyerProfile, updateLawyerProfile } from "@/server/actions/lawyer-settings.actions";

describe("getLawyerProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create default profile if none exists", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockFindFirst.mockResolvedValue(null);

    const defaultProfile = {
      id: "profile-1",
      userId: "lawyer-1",
      firmName: null,
      phone: null,
      specialties: "[]",
      notifyNewCase: 1,
      notifyNewMessage: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _hoisted.mockReturning.mockResolvedValue([defaultProfile]);

    const result = await getLawyerProfile();

    expect(result.success).toBe(true);
    expect(_hoisted.mockInsert).toHaveBeenCalled();
    expect(result.profile).toBeDefined();
    expect(result.profile!.specialties).toEqual([]);
    expect(result.profile!.notifyNewCase).toBe(true);
  });

  it("should return parsed specialties as array", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "lawyer-1",
      firmName: "Cabinet Dupont",
      phone: "0612345678",
      specialties: '["famille","travail"]',
      notifyNewCase: 1,
      notifyNewMessage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getLawyerProfile();

    expect(result.success).toBe(true);
    expect(result.profile!.specialties).toEqual(["famille", "travail"]);
    expect(result.profile!.notifyNewCase).toBe(true);
    expect(result.profile!.notifyNewMessage).toBe(false);
  });
});

describe("updateLawyerProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mock chain after clear
    _hoisted.mockInsert.mockReturnValue({ values: _hoisted.mockValues.mockReturnValue({ returning: _hoisted.mockReturning }) });
    _hoisted.mockUpdate.mockReturnValue({ set: _hoisted.mockSet.mockReturnValue({ where: _hoisted.mockWhere.mockResolvedValue(undefined) }) });
  });

  it("should upsert profile with serialized specialties", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockFindFirst.mockResolvedValue({
      id: "profile-1",
      userId: "lawyer-1",
    });

    const result = await updateLawyerProfile({
      firmName: "Cabinet Martin",
      specialties: ["penal", "civil"],
      notifyNewCase: false,
    });

    expect(result.success).toBe(true);
    expect(_hoisted.mockUpdate).toHaveBeenCalled();
    // Verify the set call includes serialized specialties
    const setCallArgs = _hoisted.mockSet.mock.calls[0][0];
    expect(setCallArgs.specialties).toBe('["penal","civil"]');
    expect(setCallArgs.notifyNewCase).toBe(0);
  });
});
