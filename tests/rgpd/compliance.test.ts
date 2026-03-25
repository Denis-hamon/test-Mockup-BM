import { describe, it, expect, vi, beforeEach } from "vitest";
import { store, resetStore } from "../setup";

// === Mock auth ===
const mockUserId = "user-rgpd-test-123";
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: mockUserId, email: "test@example.com", role: "client" },
  })),
}));

// === Mock next/headers ===
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => {
      if (name === "x-forwarded-for") return "127.0.0.1";
      if (name === "user-agent") return "test-agent";
      return null;
    },
  })),
}));

// === Mock email ===
const mockSendDeletionEmail = vi.fn(async () => ({ data: { id: "mock-del" } }));
vi.mock("@legalconnect/email", () => ({
  sendVerificationEmail: vi.fn(async () => ({ data: { id: "mock" } })),
  sendPasswordResetEmail: vi.fn(async () => ({ data: { id: "mock" } })),
  sendDeletionConfirmationEmail: (...args: any[]) => mockSendDeletionEmail(...args),
}));

// === Mock consent schema ===
vi.mock("@/lib/db/schema/consent", () => ({
  consents: {
    id: "consents.id",
    userId: "consents.userId",
    type: "consents.type",
    granted: "consents.granted",
    grantedAt: "consents.grantedAt",
    revokedAt: "consents.revokedAt",
    ipAddress: "consents.ipAddress",
    userAgent: "consents.userAgent",
  },
}));

// --- Extend the in-memory store for RGPD tests ---
type ConsentRecord = {
  id: string;
  userId: string;
  type: "essential" | "analytics";
  granted: boolean;
  grantedAt: Date;
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const consentStore: ConsentRecord[] = [];

// Extend DB mock to handle consent queries
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: {
        findFirst: async (_opts: any) => {
          return store.users.find((u: any) => u.id === mockUserId) || null;
        },
      },
      consents: {
        findFirst: async (_opts: any) => {
          // Return last matching consent for the user
          return [...consentStore].reverse().find(
            (c) => c.userId === mockUserId
          ) || null;
        },
        findMany: async (_opts: any) => {
          return consentStore.filter((c) => c.userId === mockUserId);
        },
      },
      encryptionKeys: {
        findFirst: async () => null,
      },
      emailVerificationTokens: {
        findFirst: async () => null,
      },
      passwordResetTokens: {
        findFirst: async () => null,
      },
    },
    insert: (_table: any) => ({
      values: (data: any) => {
        const id = crypto.randomUUID();
        if ("type" in data && ("granted" in data)) {
          // Consent record
          const record: ConsentRecord = {
            id,
            userId: data.userId,
            type: data.type,
            granted: data.granted,
            grantedAt: data.grantedAt || new Date(),
            revokedAt: data.revokedAt || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
          };
          consentStore.push(record);
          return { then: (resolve: any) => resolve(undefined) };
        }
        // User record fallback
        const record = { id, ...data };
        store.users.push(record);
        return {
          returning: async () => [record],
          then: (resolve: any) => resolve(undefined),
        };
      },
    }),
    update: (_table: any) => ({
      set: (data: any) => ({
        where: async (_condition: any) => {
          // Update consent
          if ("revokedAt" in data || "granted" in data) {
            const idx = consentStore.findIndex((c) => c.userId === mockUserId);
            if (idx >= 0) {
              consentStore[idx] = { ...consentStore[idx], ...data };
            }
          }
          // Update user (deletion)
          if ("deletedAt" in data || "deletionScheduledAt" in data) {
            const idx = store.users.findIndex((u: any) => u.id === mockUserId);
            if (idx >= 0) {
              store.users[idx] = { ...store.users[idx], ...data };
            }
          }
        },
      }),
    }),
    delete: (_table: any) => ({
      where: async (_condition: any) => {
        // Delete sessions - no-op in test
      },
    }),
  },
}));

// Import after mocks
import {
  updateConsent,
  getConsents,
  requestDataExport,
  requestAccountDeletion,
  cancelAccountDeletion,
} from "@/server/actions/rgpd.actions";

describe("RGPD Compliance", () => {
  beforeEach(() => {
    resetStore();
    consentStore.length = 0;
    vi.clearAllMocks();

    // Add test user to store
    store.users.push({
      id: mockUserId,
      email: "test@example.com",
      passwordHash: "hashed",
      name: "Test User",
      image: null,
      role: "client" as const,
      emailVerified: new Date(),
      deletedAt: null,
      deletionScheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("updateConsent", () => {
    it("granting analytics consent creates record with grantedAt and ipAddress", async () => {
      await updateConsent({ type: "analytics", granted: true });

      expect(consentStore.length).toBe(1);
      expect(consentStore[0].type).toBe("analytics");
      expect(consentStore[0].granted).toBe(true);
      expect(consentStore[0].grantedAt).toBeInstanceOf(Date);
      expect(consentStore[0].ipAddress).toBe("unknown");
    });

    it("revoking analytics consent sets revokedAt on existing record", async () => {
      // First grant
      consentStore.push({
        id: "consent-1",
        userId: mockUserId,
        type: "analytics",
        granted: true,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      });

      await updateConsent({ type: "analytics", granted: false });

      const updated = consentStore.find((c) => c.id === "consent-1");
      expect(updated?.granted).toBe(false);
      expect(updated?.revokedAt).toBeInstanceOf(Date);
    });

    it("attempting to revoke essential consent is rejected", async () => {
      const result = await updateConsent({ type: "essential", granted: false });

      expect(result).toHaveProperty("error");
      expect((result as { error: string }).error).toContain("essentiel");
    });
  });

  describe("requestDataExport", () => {
    it("returns JSON containing user profile and consents (not private keys)", async () => {
      const result = await requestDataExport();
      expect(result).toHaveProperty("data");

      const data = JSON.parse((result as { data: string }).data);
      expect(data.profile).toBeDefined();
      expect(data.profile.email).toBe("test@example.com");
      expect(data.consents).toBeDefined();
      expect(Array.isArray(data.consents)).toBe(true);
    });

    it("returned data does NOT contain encryptedPrivateKey or recoverySalt", async () => {
      const result = await requestDataExport();
      const jsonStr = (result as { data: string }).data;

      expect(jsonStr).not.toContain("encryptedPrivateKey");
      expect(jsonStr).not.toContain("recoverySalt");
    });
  });

  describe("requestAccountDeletion", () => {
    it("sets deletedAt and deletionScheduledAt (now + 30 days) on user", async () => {
      const before = Date.now();
      const result = await requestAccountDeletion();

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("scheduledPurgeDate");

      const user = store.users.find((u: any) => u.id === mockUserId);
      expect(user?.deletedAt).toBeInstanceOf(Date);
      expect(user?.deletionScheduledAt).toBeInstanceOf(Date);

      // Verify 30-day grace period
      const gracePeriodMs = user.deletionScheduledAt.getTime() - user.deletedAt.getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(gracePeriodMs).toBe(thirtyDaysMs);
    });

    it("sends deletion confirmation email", async () => {
      await requestAccountDeletion();

      expect(mockSendDeletionEmail).toHaveBeenCalledTimes(1);
      expect(mockSendDeletionEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String),
      );
    });
  });

  describe("cancelAccountDeletion", () => {
    it("clears deletedAt and deletionScheduledAt", async () => {
      // First set deletion on the store entry
      const idx = store.users.findIndex((u: any) => u.id === mockUserId);
      store.users[idx].deletedAt = new Date();
      store.users[idx].deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const result = await cancelAccountDeletion();

      expect(result).toHaveProperty("success", true);
      // Re-query after update (mock replaces object via spread)
      const user = store.users.find((u: any) => u.id === mockUserId);
      expect(user.deletedAt).toBeNull();
      expect(user.deletionScheduledAt).toBeNull();
    });
  });
});
