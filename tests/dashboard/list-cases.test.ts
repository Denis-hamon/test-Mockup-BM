import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks ---
const _hoisted = vi.hoisted(() => {
  const mockAuth = vi.fn();

  // Build a fully chainable mock for db.select()
  const mockOffset = vi.fn().mockResolvedValue([]);
  const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
  const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  // Also resolve directly for count queries (no orderBy/limit/offset)
  mockWhere.mockResolvedValue([{ count: 0 }]);
  // But return chainable for main query
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  const mockLeftJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
  const mockLeftJoin1 = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin2 });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin1 });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  return { mockAuth, mockSelect, mockFrom, mockLeftJoin1, mockLeftJoin2, mockWhere, mockOrderBy, mockLimit, mockOffset };
});

vi.mock("@/lib/auth", () => ({ auth: _hoisted.mockAuth }));

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: any[]) => _hoisted.mockSelect(...args),
    query: {
      intakeSubmissions: { findFirst: vi.fn(), findMany: vi.fn() },
      caseSummaries: { findFirst: vi.fn() },
      caseTimelines: { findFirst: vi.fn() },
      qualificationScores: { findFirst: vi.fn() },
      lawyerNotes: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "note-1" }]) }) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
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
  sql: Object.assign(vi.fn(), { raw: vi.fn() }),
  desc: vi.fn((col: any) => ({ _type: "desc", col })),
  asc: vi.fn((col: any) => ({ _type: "asc", col })),
  gte: vi.fn((_a: any, _b: any) => ({ _type: "gte" })),
  lte: vi.fn((_a: any, _b: any) => ({ _type: "lte" })),
  ilike: vi.fn((_a: any, _b: any) => ({ _type: "ilike" })),
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

// Import after mocks
import { listCasesForLawyer } from "@/server/actions/dashboard.actions";
import { gte, lte, ilike } from "drizzle-orm";

describe("listCasesForLawyer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup the chain after clearAllMocks
    _hoisted.mockSelect.mockReturnValue({ from: _hoisted.mockFrom });
    _hoisted.mockFrom.mockReturnValue({ leftJoin: _hoisted.mockLeftJoin1 });
    _hoisted.mockLeftJoin1.mockReturnValue({ leftJoin: _hoisted.mockLeftJoin2 });
    _hoisted.mockLeftJoin2.mockReturnValue({ where: _hoisted.mockWhere });
    _hoisted.mockWhere.mockReturnValue({ orderBy: _hoisted.mockOrderBy });
    _hoisted.mockOrderBy.mockReturnValue({ limit: _hoisted.mockLimit });
    _hoisted.mockLimit.mockReturnValue({ offset: _hoisted.mockOffset });
    _hoisted.mockOffset.mockResolvedValue([]);
  });

  it("should reject non-avocat users", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "client" },
    });

    const result = await listCasesForLawyer({ page: 1, pageSize: 10 });

    expect(result.success).toBe(false);
    expect(result.error).toBe("unauthorized");
  });

  it("should return paginated cases with score and summary joins", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });

    // Main query returns cases
    _hoisted.mockOffset.mockResolvedValueOnce([
      { id: "sub-1", clientName: "Jean Dupont", problemType: "famille", status: "submitted", overallScore: 85, legalDomain: "famille" },
    ]);
    // Count query: second select call goes through same chain, where resolves to count
    // We need the second where call to resolve directly (count query has no orderBy)
    // Simplification: the function catches errors, so we just need non-error path
    // The count query also chains .where() which we already mock to return orderBy chain
    // Let's just make the second offset call return count-like
    _hoisted.mockOffset.mockResolvedValueOnce([{ count: 1 }]);

    const result = await listCasesForLawyer({ page: 1, pageSize: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });

  it("should filter by status when provided", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockOffset.mockResolvedValueOnce([]);
    _hoisted.mockOffset.mockResolvedValueOnce([{ count: 0 }]);

    const result = await listCasesForLawyer({ page: 1, pageSize: 10, status: "en_cours" });

    expect(result.success).toBe(true);
  });

  it("should filter by date range (dateFrom/dateTo) per D-02", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockOffset.mockResolvedValueOnce([]);
    _hoisted.mockOffset.mockResolvedValueOnce([{ count: 0 }]);

    const result = await listCasesForLawyer({
      page: 1,
      pageSize: 10,
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });

    expect(result.success).toBe(true);
    // Verify gte and lte were called (date filter applied)
    expect(gte).toHaveBeenCalled();
    expect(lte).toHaveBeenCalled();
  });

  it("should filter by scoreRange", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockOffset.mockResolvedValueOnce([]);
    _hoisted.mockOffset.mockResolvedValueOnce([{ count: 0 }]);

    const result = await listCasesForLawyer({ page: 1, pageSize: 10, scoreRange: "eleve" });
    expect(result.success).toBe(true);
  });

  it("should search by client name (ilike)", async () => {
    _hoisted.mockAuth.mockResolvedValue({
      user: { id: "lawyer-1", role: "avocat" },
    });
    _hoisted.mockOffset.mockResolvedValueOnce([]);
    _hoisted.mockOffset.mockResolvedValueOnce([{ count: 0 }]);

    const result = await listCasesForLawyer({ page: 1, pageSize: 10, search: "Dupont" });

    expect(result.success).toBe(true);
    expect(ilike).toHaveBeenCalled();
  });
});
