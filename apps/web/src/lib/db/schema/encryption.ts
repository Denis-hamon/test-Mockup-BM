import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const encryptionKeys = pgTable("encryption_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  publicKey: text("public_key").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  recoverySalt: text("recovery_salt").notNull(),
  recoveryNonce: text("recovery_nonce").notNull(),
  recoveryParams: text("recovery_params").notNull(), // JSON: { opslimit, memlimit, alg }
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const encryptionKeysRelations = relations(encryptionKeys, ({ one }) => ({
  user: one(users, {
    fields: [encryptionKeys.userId],
    references: [users.id],
  }),
}));
