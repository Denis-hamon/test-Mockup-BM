import { vi, beforeEach } from "vitest";

// === Types ===

export type MockUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  image: string | null;
  role: "avocat" | "client";
  emailVerified: Date | null;
  deletedAt: Date | null;
  deletionScheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MockEmailVerificationToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export type MockPasswordResetToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
};

// === Hoisted shared state ===

const _hoisted = vi.hoisted(() => {
  const store = {
    users: [] as any[],
    emailVerificationTokens: [] as any[],
    passwordResetTokens: [] as any[],
  };
  const mockSendVerificationEmail = vi.fn(async () => ({ data: { id: "mock" } }));
  const mockSendPasswordResetEmail = vi.fn(async () => ({ data: { id: "mock" } }));

  // Track last eq() call for findFirst resolution
  let lastEqCol: string | null = null;
  let lastEqVal: any = null;

  return {
    store,
    mockSendVerificationEmail,
    mockSendPasswordResetEmail,
    setLastEq(col: string, val: any) {
      lastEqCol = col;
      lastEqVal = val;
    },
    getLastEq() {
      return { col: lastEqCol, val: lastEqVal };
    },
  };
});

export const store = _hoisted.store;
export const mockSendVerificationEmail = _hoisted.mockSendVerificationEmail;
export const mockSendPasswordResetEmail = _hoisted.mockSendPasswordResetEmail;

// === Public helpers ===

export function getStore() {
  return _hoisted.store;
}

export function resetStore() {
  _hoisted.store.users.length = 0;
  _hoisted.store.emailVerificationTokens.length = 0;
  _hoisted.store.passwordResetTokens.length = 0;
}

export function createTestUser(overrides: Partial<MockUser> = {}): MockUser {
  const user: MockUser = {
    id: crypto.randomUUID(),
    email: "test@example.com",
    passwordHash: null,
    name: null,
    image: null,
    role: "client",
    emailVerified: null,
    deletedAt: null,
    deletionScheduledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  _hoisted.store.users.push(user);
  return user;
}

// === Mock email ===

vi.mock("@legalconnect/email", () => ({
  sendVerificationEmail: (...args: any[]) => _hoisted.mockSendVerificationEmail(...args),
  sendPasswordResetEmail: (...args: any[]) => _hoisted.mockSendPasswordResetEmail(...args),
}));

// === Mock drizzle-orm ===
// We intercept eq() to capture what field/value is being queried
// This works regardless of whether the real or mocked eq is called

vi.mock("drizzle-orm", () => ({
  eq: (col: any, val: any) => {
    // col might be a drizzle column object with .name, or a string from our schema mock
    const colName = typeof col === "string" ? col : (col?.name || String(col));
    _hoisted.setLastEq(colName, val);
    return { _col: colName, _val: val };
  },
  and: (...conditions: any[]) => conditions,
  isNull: (col: any) => ({ _col: col }),
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

// === Mock schema ===

vi.mock("@/lib/db/schema/auth", () => ({
  users: {
    id: "users.id",
    email: "users.email",
    passwordHash: "users.passwordHash",
    role: "users.role",
    emailVerified: "users.emailVerified",
    deletedAt: "users.deletedAt",
  },
  emailVerificationTokens: {
    id: "evt.id",
    token: "evt.token",
    userId: "evt.userId",
  },
  passwordResetTokens: {
    id: "prt.id",
    token: "prt.token",
    userId: "prt.userId",
  },
  accounts: {},
  sessions: {},
  verificationTokens: {},
}));

// === Mock database ===
// findFirst reads the last eq() call to determine what to search for

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: {
        findFirst: async (_opts: any) => {
          const { col, val } = _hoisted.getLastEq();
          if (col && String(col).includes("email")) {
            return _hoisted.store.users.find((u: any) => u.email === val) || null;
          }
          return null;
        },
      },
      emailVerificationTokens: {
        findFirst: async (_opts: any) => {
          const { col, val } = _hoisted.getLastEq();
          if (col && String(col).includes("token")) {
            return (
              _hoisted.store.emailVerificationTokens.find((t: any) => t.token === val) ||
              null
            );
          }
          return null;
        },
      },
      passwordResetTokens: {
        findFirst: async (_opts: any) => {
          const { col, val } = _hoisted.getLastEq();
          if (col && String(col).includes("token")) {
            return (
              _hoisted.store.passwordResetTokens.find((t: any) => t.token === val) ||
              null
            );
          }
          return null;
        },
      },
    },
    insert: (_table: any) => ({
      values: (data: any) => {
        // Store data immediately (for calls without .returning())
        const id = crypto.randomUUID();
        let record: any;

        if ("passwordHash" in data && "role" in data) {
          record = {
            id,
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name || null,
            image: null,
            role: data.role,
            emailVerified: null,
            deletedAt: null,
            deletionScheduledAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          _hoisted.store.users.push(record);
        } else if ("expiresAt" in data && "userId" in data && "token" in data) {
          const expiryMs = data.expiresAt.getTime() - Date.now();
          record = {
            id,
            userId: data.userId,
            token: data.token,
            expiresAt: data.expiresAt,
            usedAt: null,
          };
          if (expiryMs > 2 * 60 * 60 * 1000) {
            _hoisted.store.emailVerificationTokens.push(record);
          } else {
            _hoisted.store.passwordResetTokens.push(record);
          }
        } else {
          record = { id, ...data };
        }

        // Return object that is both thenable (for await) and has returning()
        const result = {
          returning: async () => [record],
          then: (resolve: any) => resolve(undefined),
        };
        return result;
      },
    }),
    update: (_table: any) => ({
      set: (data: any) => ({
        where: async (_condition: any) => {
          // Use the last eq() call to find the target record
          const { val: targetId } = _hoisted.getLastEq();

          if ("emailVerified" in data || "passwordHash" in data) {
            const idx = _hoisted.store.users.findIndex((u: any) => u.id === targetId);
            if (idx >= 0) _hoisted.store.users[idx] = { ..._hoisted.store.users[idx], ...data };
          }
          if ("usedAt" in data) {
            let idx = _hoisted.store.emailVerificationTokens.findIndex(
              (t: any) => t.id === targetId
            );
            if (idx >= 0)
              _hoisted.store.emailVerificationTokens[idx] = {
                ..._hoisted.store.emailVerificationTokens[idx],
                ...data,
              };
            idx = _hoisted.store.passwordResetTokens.findIndex(
              (t: any) => t.id === targetId
            );
            if (idx >= 0)
              _hoisted.store.passwordResetTokens[idx] = {
                ..._hoisted.store.passwordResetTokens[idx],
                ...data,
              };
          }
        },
      }),
    }),
  },
}));

// === Reset before each test ===

beforeEach(() => {
  resetStore();
  _hoisted.setLastEq("", null);
  vi.clearAllMocks();
});
