import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks ---
const _hoisted = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockFindFirst = vi.fn();
  const mockUpdate = vi.fn();
  const mockSet = vi.fn();
  const mockWhere = vi.fn();

  mockUpdate.mockReturnValue({ set: mockSet.mockReturnValue({ where: mockWhere.mockResolvedValue(undefined) }) });

  return { mockAuth, mockFindFirst, mockUpdate, mockSet, mockWhere };
});

vi.mock("@/lib/auth", () => ({ auth: _hoisted.mockAuth }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      intakeSubmissions: { findFirst: _hoisted.mockFindFirst },
      caseSummaries: { findFirst: vi.fn() },
      caseTimelines: { findFirst: vi.fn() },
      qualificationScores: { findFirst: vi.fn() },
      lawyerNotes: { findFirst: vi.fn() },
    },
    select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ leftJoin: vi.fn().mockReturnValue({ leftJoin: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ offset: vi.fn().mockResolvedValue([]) }) }) }) }) }) }) }),
    update: _hoisted.mockUpdate,
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "note-1" }]) }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  },
}));

vi.mock("@/lib/db/schema/intake", () => ({
  intakeSubmissions: { id: "is.id", fullName: "is.fullName", problemType: "is.problemType", status: "is.status", createdAt: "is.createdAt", userId: "is.userId" },
  intakeDocuments: { submissionId: "id.submissionId" },
  aiFollowUps: { submissionId: "af.submissionId" },
}));
vi.mock("@/lib/db/schema/case-intelligence", () => ({
  caseSummaries: { submissionId: "cs.submissionId", legalDomain: "cs.legalDomain" },
  caseTimelines: { submissionId: "ct.submissionId" },
  qualificationScores: { submissionId: "qs.submissionId", overallScore: "qs.overallScore" },
}));
vi.mock("@/lib/db/schema/lawyer", () => ({
  lawyerNotes: { id: "ln.id", submissionId: "ln.submissionId", lawyerId: "ln.lawyerId", createdAt: "ln.createdAt" },
}));
vi.mock("@/server/actions/case-intelligence.actions", () => ({
  triggerCaseIntelligence: vi.fn().mockResolvedValue({ success: true, version: 1 }),
  CaseIntelligenceResult: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_a: any, _b: any) => ({ _type: "eq" })),
  and: vi.fn((...args: any[]) => args),
  sql: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  ilike: vi.fn(),
  ne: vi.fn((_a: any, _b: any) => ({ _type: "ne" })),
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

import { updateCaseStatus } from "@/server/actions/dashboard.actions";

describe("updateCaseStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject non-avocat users", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "client" },
    });

    const result = await updateCaseStatus("sub-1", "en_cours");

    expect(result.success).toBe(false);
    expect(result.error).toBe("unauthorized");
  });

  it("should allow forward transitions (submitted -> en_cours)", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockFindFirst.mockResolvedValue({
      id: "sub-1",
      status: "submitted",
    });

    const result = await updateCaseStatus("sub-1", "en_cours");

    expect(result.success).toBe(true);
    expect(_hoisted.mockUpdate).toHaveBeenCalled();
  });

  it("should prevent transition from archive to any earlier status", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockFindFirst.mockResolvedValue({
      id: "sub-1",
      status: "archive",
    });

    const result = await updateCaseStatus("sub-1", "en_cours");

    expect(result.success).toBe(false);
    expect(result.error).toBe("cannot_unarchive");
  });
});
